'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UserFeedbackEntry } from '@/types/admin';
import {
  MessageSquare,
  Star,
  Bug,
  Sparkles,
  Smartphone,
  Laptop,
  Apple,
  RefreshCw,
  Search,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Clock,
  ThumbsUp,
  Lightbulb,
  HelpCircle,
  Bell,
  Eye,
} from 'lucide-react';

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<UserFeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState<'All' | 'Android' | 'iPhone' | 'Web'>('All');
  const [bugFilter, setBugFilter] = useState<'all' | 'bugs_only' | 'no_bugs'>('all');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [selectedItem, setSelectedItem] = useState<UserFeedbackEntry | null>(null);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/feedback');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch feedback');
      }
      const data = await res.json();
      setFeedback(data.feedback || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchFeedback();
  }, [fetchFeedback]);

  // Keyboard close for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered feedback
  const filteredFeedback = useMemo(() => {
    return feedback.filter((item) => {
      // Platform filter
      if (platformFilter !== 'All' && item.platform !== platformFilter) {
        return false;
      }

      // Bug filter
      const hasBug = Boolean(item.bugs_encountered && item.bugs_encountered.trim().length > 0);
      if (bugFilter === 'bugs_only' && !hasBug) return false;
      if (bugFilter === 'no_bugs' && hasBug) return false;

      // Rating filter
      if (ratingFilter !== 'all') {
        if (ratingFilter === 5 && item.ease_of_use < 5) return false;
        if (ratingFilter === 4 && item.ease_of_use < 4) return false;
        if (ratingFilter === 3 && item.ease_of_use > 3) return false;
      }

      // Search term
      if (search.trim()) {
        const query = search.toLowerCase();
        const searchableText = [
          item.user_email || '',
          item.user_name || '',
          item.liked_most || '',
          item.improve_first || '',
          item.bugs_encountered || '',
          item.future_features || '',
          item.additional_suggestions || '',
          item.confusing_aspects || '',
          ...(item.features_tested || []),
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [feedback, platformFilter, bugFilter, ratingFilter, search]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const total = feedback.length;
    if (total === 0) {
      return {
        total: 0,
        avgEase: 0,
        avgDesign: 0,
        bugCount: 0,
        webCount: 0,
        androidCount: 0,
        iphoneCount: 0,
      };
    }

    const easeSum = feedback.reduce((sum, f) => sum + (Number(f.ease_of_use) || 0), 0);
    const designSum = feedback.reduce((sum, f) => sum + (Number(f.design_rating) || 0), 0);
    const bugCount = feedback.filter((f) => f.bugs_encountered && f.bugs_encountered.trim().length > 0).length;
    const webCount = feedback.filter((f) => f.platform === 'Web').length;
    const androidCount = feedback.filter((f) => f.platform === 'Android').length;
    const iphoneCount = feedback.filter((f) => f.platform === 'iPhone').length;

    return {
      total,
      avgEase: Number((easeSum / total).toFixed(1)),
      avgDesign: Number((designSum / total).toFixed(1)),
      bugCount,
      webCount,
      androidCount,
      iphoneCount,
    };
  }, [feedback]);

  // Export CSV
  const handleExportCSV = () => {
    if (feedback.length === 0) return;

    const headers = [
      'ID',
      'Date',
      'User Email',
      'Platform',
      'Duration',
      'Ease of Use',
      'Design Rating',
      'Predictions Clarity',
      'Energy & Sleep Rating',
      'Notifications Working',
      'Features Tested',
      'Confusing Aspects',
      'Bugs Encountered',
      'Liked Most',
      'Improve First',
      'Future Features',
      'Additional Suggestions',
    ];

    const rows = feedback.map((f) => [
      f.id,
      new Date(f.created_at).toISOString(),
      `"${(f.user_email || 'Anonymous').replace(/"/g, '""')}"`,
      f.platform,
      `"${(f.test_duration || '').replace(/"/g, '""')}"`,
      f.ease_of_use,
      f.design_rating,
      f.clarity,
      `"${(f.energy_sleep_rating || '').replace(/"/g, '""')}"`,
      `"${(f.notifications_working || '').replace(/"/g, '""')}"`,
      `"${(f.features_tested || []).join('; ').replace(/"/g, '""')}"`,
      `"${(f.confusing_aspects || '').replace(/"/g, '""')}"`,
      `"${(f.bugs_encountered || '').replace(/"/g, '""')}"`,
      `"${(f.liked_most || '').replace(/"/g, '""')}"`,
      `"${(f.improve_first || '').replace(/"/g, '""')}"`,
      `"${(f.future_features || '').replace(/"/g, '""')}"`,
      `"${(f.additional_suggestions || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `luna_user_feedback_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}
          />
        ))}
        <span className="ml-1 text-xs font-semibold text-gray-700">{rating}/5</span>
      </div>
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Android':
        return <Smartphone size={14} className="text-emerald-600" />;
      case 'iPhone':
        return <Apple size={14} className="text-gray-700" />;
      case 'Web':
        return <Laptop size={14} className="text-[#E85D9A]" />;
      default:
        return <MessageSquare size={14} className="text-gray-500" />;
    }
  };

  const getClarityBadge = (clarity: string) => {
    if (clarity === 'Yes') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">Clear</span>;
    }
    if (clarity === 'Partly') {
      return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">Partly Clear</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Confusing</span>;
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#4A1B3C] tracking-tight">User Feedback</h2>
          <p className="text-gray-500 text-sm mt-1">
            Quantitative ratings, qualitative opinions, and reported bugs directly from beta testers & app users.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void fetchFeedback()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E85D9A]/20 hover:border-[#E85D9A] rounded-xl text-sm font-semibold text-[#4A1B3C] shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-[#E85D9A]' : 'text-[#E85D9A]'} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            disabled={feedback.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#4A1B3C] hover:bg-[#38142d] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Aggregate Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Responses</span>
            <MessageSquare size={16} className="text-[#E85D9A]" />
          </div>
          <p className="text-3xl font-black mt-2 text-[#4A1B3C]">{metrics.total}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
            <span>Web: {metrics.webCount}</span>
            <span>•</span>
            <span>Android: {metrics.androidCount}</span>
            <span>•</span>
            <span>iOS: {metrics.iphoneCount}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Ease of Use</span>
            <Sparkles size={16} className="text-amber-500" />
          </div>
          <p className="text-3xl font-black mt-2 text-[#E85D9A]">
            {metrics.avgEase} <span className="text-sm font-semibold text-gray-400">/ 5</span>
          </p>
          <div className="mt-2">{renderStars(Math.round(metrics.avgEase))}</div>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#E85D9A]/10">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Design Rating</span>
            <Star size={16} className="text-amber-500 fill-amber-400" />
          </div>
          <p className="text-3xl font-black mt-2 text-[#E85D9A]">
            {metrics.avgDesign} <span className="text-sm font-semibold text-gray-400">/ 5</span>
          </p>
          <div className="mt-2">{renderStars(Math.round(metrics.avgDesign))}</div>
        </div>

        <div
          className={`bg-white p-5 rounded-3xl shadow-sm border ${
            metrics.bugCount > 0 ? 'border-red-300 bg-red-50/20' : 'border-[#E85D9A]/10'
          }`}
        >
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Bug Reports</span>
            <Bug size={16} className={metrics.bugCount > 0 ? 'text-red-500' : 'text-gray-400'} />
          </div>
          <p className={`text-3xl font-black mt-2 ${metrics.bugCount > 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {metrics.bugCount}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            {metrics.bugCount === 0 ? 'No open bugs reported' : `${metrics.bugCount} users flagged issues`}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#E85D9A]/10 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Top Feedback</span>
            <ThumbsUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-3xl font-black mt-2 text-emerald-600">
            {feedback.filter((f) => f.liked_most && f.liked_most.trim().length > 0).length}
          </p>
          <p className="mt-2 text-xs text-gray-500">Submissions with praise</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-[#E85D9A]/10 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by tester email, bugs, suggestions, or features..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#E85D9A]/30 focus:border-[#E85D9A] transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Platform Filter */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-bold">
              {(['All', 'Web', 'Android', 'iPhone'] as const).map((plat) => (
                <button
                  key={plat}
                  onClick={() => setPlatformFilter(plat)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    platformFilter === plat ? 'bg-white text-[#4A1B3C] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {plat}
                </button>
              ))}
            </div>

            {/* Bugs Filter */}
            <div className="flex items-center bg-gray-100 p-1 rounded-2xl text-xs font-bold">
              <button
                onClick={() => setBugFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  bugFilter === 'all' ? 'bg-white text-[#4A1B3C] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setBugFilter('bugs_only')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  bugFilter === 'bugs_only'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-red-600 hover:text-red-700'
                }`}
              >
                <Bug size={12} />
                Bugs
              </button>
              <button
                onClick={() => setBugFilter('no_bugs')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  bugFilter === 'no_bugs' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Clean
              </button>
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-gray-100 border-none rounded-2xl px-3 py-2 text-xs font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#E85D9A]/30 cursor-pointer"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars only</option>
              <option value="4">4+ Stars</option>
              <option value="3">3 Stars or less</option>
            </select>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(search || platformFilter !== 'All' || bugFilter !== 'all' || ratingFilter !== 'all') && (
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>
              Showing <strong className="text-gray-800">{filteredFeedback.length}</strong> of{' '}
              <strong className="text-gray-800">{feedback.length}</strong> submissions
            </span>
            <button
              onClick={() => {
                setSearch('');
                setPlatformFilter('All');
                setBugFilter('all');
                setRatingFilter('all');
              }}
              className="text-[#E85D9A] hover:underline font-semibold"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && feedback.length === 0 && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-200 rounded w-1/4"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-100 rounded w-1/2"></div>
              <div className="h-16 bg-gray-50 rounded-2xl"></div>
            </div>
          ))}
        </div>
      )}

      {/* Feedback List */}
      {!loading && filteredFeedback.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E85D9A]/10 shadow-sm space-y-3">
          <div className="w-16 h-16 bg-[#E85D9A]/10 text-[#E85D9A] rounded-full flex items-center justify-center mx-auto mb-2">
            <MessageSquare size={28} />
          </div>
          <h3 className="text-xl font-bold text-[#4A1B3C]">No feedback entries found</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            {feedback.length === 0
              ? 'No user feedback submissions have been recorded yet.'
              : 'No submissions matched your active search and filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedback.map((item) => {
            const hasBugs = Boolean(item.bugs_encountered && item.bugs_encountered.trim().length > 0);
            const dateStr = new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={item.id}
                className={`bg-white p-6 rounded-3xl shadow-sm border transition-all hover:shadow-md ${
                  hasBugs ? 'border-red-200 hover:border-red-300' : 'border-[#E85D9A]/15 hover:border-[#E85D9A]/40'
                }`}
              >
                {/* Header Row: User Info, Platform, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4A1B3C] to-[#E85D9A] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {(item.user_name?.[0] || item.user_email?.[0] || 'U').toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#4A1B3C] text-base">
                          {item.user_email || 'Anonymous Tester'}
                        </span>
                        {item.user_name && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                            {item.user_name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                        <span className="font-mono">ID: {item.user_id ? item.user_id.slice(0, 8) : 'anon'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {dateStr}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Platform Pill */}
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-gray-100 text-gray-800">
                      {getPlatformIcon(item.platform)}
                      {item.platform}
                    </span>

                    {/* Test Duration */}
                    <span className="px-3 py-1 rounded-xl text-xs font-semibold bg-pink-50 text-[#E85D9A]">
                      {item.test_duration}
                    </span>

                    {/* View Button */}
                    <button
                      onClick={() => setSelectedItem(item)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4A1B3C] hover:bg-[#38142d] text-white rounded-xl text-xs font-bold shadow-sm transition-colors ml-auto sm:ml-0"
                    >
                      <Eye size={13} />
                      View Details
                    </button>
                  </div>
                </div>

                {/* Ratings & Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 py-4 border-b border-gray-100 text-sm">
                  <div>
                    <span className="text-xs text-gray-400 font-semibold block mb-1">Ease of Use</span>
                    {renderStars(item.ease_of_use)}
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-semibold block mb-1">Design Rating</span>
                    {renderStars(item.design_rating)}
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-semibold block mb-1">Predictions Clarity</span>
                    {getClarityBadge(item.clarity)}
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-semibold block mb-1">Energy/Sleep Accuracy</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.energy_sleep_rating === 'Yes'
                          ? 'bg-green-100 text-green-700'
                          : item.energy_sleep_rating === 'Partly'
                          ? 'bg-amber-100 text-amber-700'
                          : item.energy_sleep_rating === 'No'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.energy_sleep_rating}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-semibold block mb-1">Notifications</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        item.notifications_working === 'Yes'
                          ? 'bg-green-100 text-green-700'
                          : item.notifications_working === 'No'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.notifications_working}
                    </span>
                  </div>
                </div>

                {/* Features Tested Chips */}
                {item.features_tested && item.features_tested.length > 0 && (
                  <div className="py-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-400 mr-1">Tested:</span>
                    {item.features_tested.map((feat, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Qualitative Highlights Snippets */}
                <div className="space-y-2 mt-2">
                  {/* Bugs Highlight */}
                  {hasBugs && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-900">
                      <Bug size={16} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="font-bold text-red-700">Bug Reported: </strong>
                        <span>{item.bugs_encountered}</span>
                      </div>
                    </div>
                  )}

                  {/* Liked Most Highlight */}
                  {item.liked_most && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
                      <ThumbsUp size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="font-bold text-emerald-800">Liked Most: </strong>
                        <span>{item.liked_most}</span>
                      </div>
                    </div>
                  )}

                  {/* Improve First Highlight */}
                  {item.improve_first && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                      <Lightbulb size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <strong className="font-bold text-amber-800">Improve First: </strong>
                        <span>{item.improve_first}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Feedback Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-[#4A1B3C] to-[#2B0B20] text-white flex items-center justify-between shrink-0">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold">Feedback Details</h3>
                  <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-xs font-semibold">
                    {selectedItem.platform}
                  </span>
                </div>
                <p className="text-xs text-white/70">
                  Submitted by{' '}
                  <span className="font-semibold text-white">
                    {selectedItem.user_email || 'Anonymous Tester'}
                  </span>{' '}
                  on {new Date(selectedItem.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Ratings Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Ease of Use
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-[#4A1B3C]">{selectedItem.ease_of_use}</span>
                    <span className="text-xs text-gray-400">/ 5</span>
                  </div>
                  <div className="mt-1">{renderStars(selectedItem.ease_of_use)}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Design Rating
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-2xl font-black text-[#E85D9A]">{selectedItem.design_rating}</span>
                    <span className="text-xs text-gray-400">/ 5</span>
                  </div>
                  <div className="mt-1">{renderStars(selectedItem.design_rating)}</div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Predictions Clarity
                  </span>
                  <p className="text-lg font-bold text-[#4A1B3C]">{selectedItem.clarity}</p>
                  <p className="text-xs text-gray-400 mt-1">Cycle phase predictions</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">
                    Notifications
                  </span>
                  <p className="text-lg font-bold text-[#4A1B3C]">{selectedItem.notifications_working}</p>
                  <p className="text-xs text-gray-400 mt-1">Working & timely</p>
                </div>
              </div>

              {/* Testing Duration & Features */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-gray-500 uppercase tracking-wider">Test Duration</span>
                  <span className="font-bold text-[#E85D9A] bg-pink-50 px-2.5 py-1 rounded-lg">
                    {selectedItem.test_duration}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                    Features Tested
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedItem.features_tested && selectedItem.features_tested.length > 0 ? (
                      selectedItem.features_tested.map((f, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 shadow-2xs"
                        >
                          ✓ {f}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-gray-400">None specified</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bug Reports Section */}
              {selectedItem.bugs_encountered ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-red-700 font-bold">
                    <Bug size={17} />
                    <span>Reported Bugs or Glitches</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap pl-6">{selectedItem.bugs_encountered}</p>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-2 text-emerald-800 text-xs font-medium">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>No bugs were reported by this user.</span>
                </div>
              )}

              {/* Confusing Aspects */}
              {selectedItem.confusing_aspects && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-bold">
                    <HelpCircle size={17} />
                    <span>Confusing Aspects or Difficult Navigation</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap pl-6">{selectedItem.confusing_aspects}</p>
                </div>
              )}

              {/* Liked Most */}
              {selectedItem.liked_most && (
                <div className="p-4 bg-pink-50 border border-pink-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-[#4A1B3C] font-bold">
                    <ThumbsUp size={17} className="text-[#E85D9A]" />
                    <span>What They Liked Most</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap pl-6">{selectedItem.liked_most}</p>
                </div>
              )}

              {/* Improve First */}
              {selectedItem.improve_first && (
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold">
                    <Lightbulb size={17} className="text-indigo-600" />
                    <span>What Should Be Improved or Fixed First</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap pl-6">{selectedItem.improve_first}</p>
                </div>
              )}

              {/* Future Features */}
              {selectedItem.future_features && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-purple-900 font-bold">
                    <Sparkles size={17} className="text-purple-600" />
                    <span>Requested Future Features</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap pl-6">{selectedItem.future_features}</p>
                </div>
              )}

              {/* Additional Suggestions */}
              {selectedItem.additional_suggestions && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-gray-800 font-bold">
                    <MessageSquare size={17} className="text-gray-600" />
                    <span>Additional Suggestions & Notes</span>
                  </div>
                  <p className="text-gray-800 text-sm whitespace-pre-wrap pl-6">
                    {selectedItem.additional_suggestions}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-xs text-gray-400 font-mono">Submission ID: {selectedItem.id}</span>
              <button
                onClick={() => setSelectedItem(null)}
                className="px-5 py-2 bg-[#4A1B3C] hover:bg-[#38142d] text-white rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
