'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLATFORMS = ['Android', 'iPhone', 'Web'] as const;
const DURATIONS = ['Less than 5 minutes', '5–15 minutes', 'More than 15 minutes'] as const;
const FEATURES = [
  'Dashboard',
  'Cycle Tracking',
  'Calendar',
  'History',
  'Log Your Feelings',
  'Chat',
  'Notifications',
  'Settings',
] as const;

const CLARITY_OPTIONS = ['Yes', 'Partly', 'No'] as const;
const ENERGY_SLEEP_OPTIONS = ['Yes', 'Partly', 'No', "Didn't test"] as const;
const NOTIFICATIONS_OPTIONS = ['Yes', 'No', "Didn't test"] as const;

export default function FeedbackPage() {
  const router = useRouter();

  // Form State
  const [platform, setPlatform] = useState<string>('Web');
  const [testDuration, setTestDuration] = useState<string>('');
  const [featuresTested, setFeaturesTested] = useState<string[]>([]);

  const [easeOfUse, setEaseOfUse] = useState<number>(0);
  const [designRating, setDesignRating] = useState<number>(0);
  const [clarity, setClarity] = useState<string>('');

  const [confusingAspects, setConfusingAspects] = useState<string>('');
  const [energySleepRating, setEnergySleepRating] = useState<string>('');
  const [bugsEncountered, setBugsEncountered] = useState<string>('');
  const [notificationsWorking, setNotificationsWorking] = useState<string>('');

  const [likedMost, setLikedMost] = useState<string>('');
  const [improveFirst, setImproveFirst] = useState<string>('');
  const [futureFeatures, setFutureFeatures] = useState<string>('');
  const [additionalSuggestions, setAdditionalSuggestions] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const toggleFeature = (feature: string) => {
    setFeaturesTested(prev =>
      prev.includes(feature) ? prev.filter(f => f !== feature) : [...prev, feature]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!platform) {
      setError('Please select which platform you used.');
      return;
    }
    if (!testDuration) {
      setError('Please select how long you tested Luna.');
      return;
    }
    if (featuresTested.length === 0) {
      setError('Please select at least one feature you tried.');
      return;
    }
    if (easeOfUse === 0) {
      setError('Please rate how easy Luna was to use (1 to 5).');
      return;
    }
    if (designRating === 0) {
      setError('Please rate the overall design (1 to 5).');
      return;
    }
    if (!clarity) {
      setError('Please specify if features and instructions were easy to understand.');
      return;
    }
    if (!energySleepRating) {
      setError('Please specify if Energy and Sleep selection worked as expected.');
      return;
    }
    if (!notificationsWorking) {
      setError('Please specify if notifications worked correctly.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        platform,
        test_duration: testDuration,
        features_tested: featuresTested,
        ease_of_use: easeOfUse,
        design_rating: designRating,
        clarity,
        confusing_aspects: confusingAspects.trim() || undefined,
        energy_sleep_rating: energySleepRating,
        bugs_encountered: bugsEncountered.trim() || undefined,
        notifications_working: notificationsWorking,
        liked_most: likedMost.trim() || undefined,
        improve_first: improveFirst.trim() || undefined,
        future_features: futureFeatures.trim() || undefined,
        additional_suggestions: additionalSuggestions.trim() || undefined,
      };

      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback.');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-[#E85D9A]/20 text-center animate-fade-in">
          <div className="w-20 h-20 bg-gradient-to-tr from-[#E85D9A] to-[#D93F7D] rounded-full flex items-center justify-center text-white mx-auto mb-6 shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A1B3C] mb-3">Thank you for your feedback!</h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8 max-w-lg mx-auto">
            Your valuable insights help us continuously polish Luna into the most thoughtful and intuitive wellness companion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-full bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-95 text-center"
            >
              Return to Dashboard
            </Link>
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setFeaturesTested([]);
                setEaseOfUse(0);
                setDesignRating(0);
                setClarity('');
                setConfusingAspects('');
                setEnergySleepRating('');
                setBugsEncountered('');
                setNotificationsWorking('');
                setLikedMost('');
                setImproveFirst('');
                setFutureFeatures('');
                setAdditionalSuggestions('');
              }}
              className="px-6 py-3 rounded-full bg-[#FDF8F9] text-[#4A1B3C] font-semibold text-sm border border-[#E85D9A]/30 hover:bg-pink-50 transition-all text-center"
            >
              Submit Another Response
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mb-24">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF8F9] border border-[#E85D9A]/20 text-xs font-bold text-[#E85D9A] mb-3">
          <span>✨</span> Tester Questionnaire
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A1B3C] tracking-tight">Luna User Feedback</h1>
        <p className="text-sm text-gray-500 mt-1">
          Share your testing experience to help us identify bugs, improve usability, and build what matters most.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-medium animate-fade-in flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECTION A: Basic Information */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E85D9A]/15 space-y-6">
          <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#4A1B3C] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E85D9A]/10 text-[#E85D9A] text-xs flex items-center justify-center font-bold">A</span>
              Basic Information
            </h2>
            <span className="text-xs text-gray-400 font-medium">* Required fields</span>
          </div>

          {/* 1. Platform */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-2">
              1. Which platform did you use? <span className="text-[#E85D9A]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlatform(p)}
                  className={`py-3 px-4 rounded-2xl text-sm font-semibold transition-all border ${
                    platform === p
                      ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md scale-102'
                      : 'bg-[#FDF8F9] text-[#4A1B3C] border-[#E85D9A]/15 hover:border-[#E85D9A]/40'
                  }`}
                >
                  {p === 'Android' && '🤖 '}
                  {p === 'iPhone' && '🍎 '}
                  {p === 'Web' && '💻 '}
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Duration */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-2">
              2. How long did you test Luna? <span className="text-[#E85D9A]">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DURATIONS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setTestDuration(d)}
                  className={`py-3 px-4 rounded-2xl text-sm font-semibold transition-all border ${
                    testDuration === d
                      ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md'
                      : 'bg-[#FDF8F9] text-[#4A1B3C] border-[#E85D9A]/15 hover:border-[#E85D9A]/40'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Features Tested */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-1">
              3. Which features did you try? <span className="text-[#E85D9A]">*</span>
            </label>
            <p className="text-xs text-gray-500 mb-3">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {FEATURES.map(f => {
                const active = featuresTested.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFeature(f)}
                    className={`py-2 px-3.5 rounded-full text-xs font-semibold transition-all border ${
                      active
                        ? 'bg-[#4A1B3C] text-white border-[#4A1B3C] shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#E85D9A]/50'
                    }`}
                  >
                    {active ? '✓ ' : '+ '}
                    {f}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION B: Overall Experience */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E85D9A]/15 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#4A1B3C] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E85D9A]/10 text-[#E85D9A] text-xs flex items-center justify-center font-bold">B</span>
              Overall Experience
            </h2>
          </div>

          {/* 4. Ease of Use */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-[#4A1B3C]">
                4. How easy was Luna to use? <span className="text-[#E85D9A]">*</span>
              </label>
              {easeOfUse > 0 && (
                <span className="text-xs font-bold text-[#E85D9A]">
                  {easeOfUse === 1 && 'Very Difficult'}
                  {easeOfUse === 2 && 'Difficult'}
                  {easeOfUse === 3 && 'Moderate'}
                  {easeOfUse === 4 && 'Easy'}
                  {easeOfUse === 5 && 'Very Easy / Intuitive'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setEaseOfUse(score)}
                  className={`py-3.5 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                    easeOfUse === score
                      ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md scale-105'
                      : 'bg-[#FDF8F9] text-gray-600 border-gray-200 hover:bg-pink-50'
                  }`}
                >
                  <span className="text-lg">⭐</span>
                  <span className="text-xs font-bold mt-1">{score}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1 px-1">
              <span>1 - Very Difficult</span>
              <span>5 - Very Easy</span>
            </div>
          </div>

          {/* 5. Design Rating */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-[#4A1B3C]">
                5. How would you rate the overall design? <span className="text-[#E85D9A]">*</span>
              </label>
              {designRating > 0 && (
                <span className="text-xs font-bold text-[#E85D9A]">
                  {designRating === 1 && 'Needs Work'}
                  {designRating === 2 && 'Fair'}
                  {designRating === 3 && 'Good'}
                  {designRating === 4 && 'Great'}
                  {designRating === 5 && 'Stunning & Delightful'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setDesignRating(score)}
                  className={`py-3.5 rounded-2xl flex flex-col items-center justify-center transition-all border ${
                    designRating === score
                      ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md scale-105'
                      : 'bg-[#FDF8F9] text-gray-600 border-gray-200 hover:bg-pink-50'
                  }`}
                >
                  <span className="text-lg">🌸</span>
                  <span className="text-xs font-bold mt-1">{score}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[11px] text-gray-400 mt-1 px-1">
              <span>1 - Poor</span>
              <span>5 - Beautiful</span>
            </div>
          </div>

          {/* 6. Clarity */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-2">
              6. Were the features and instructions easy to understand? <span className="text-[#E85D9A]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {CLARITY_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setClarity(opt)}
                  className={`py-3 px-4 rounded-2xl text-sm font-semibold transition-all border ${
                    clarity === opt
                      ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md'
                      : 'bg-[#FDF8F9] text-[#4A1B3C] border-[#E85D9A]/15 hover:border-[#E85D9A]/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION C: Feature-Specific Feedback */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E85D9A]/15 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#4A1B3C] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E85D9A]/10 text-[#E85D9A] text-xs flex items-center justify-center font-bold">C</span>
              Feature-Specific Feedback
            </h2>
          </div>

          {/* 7. Confusing aspects */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-1">
              7. Was anything confusing while using Luna? <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={confusingAspects}
              onChange={e => setConfusingAspects(e.target.value)}
              placeholder="e.g. It wasn't obvious how to view past cycle logs..."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-sm text-[#4A1B3C] placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* 8. Energy and Sleep */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-2">
              8. Did Energy and Sleep selection work as expected? <span className="text-[#E85D9A]">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {ENERGY_SLEEP_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEnergySleepRating(opt)}
                  className={`py-3 px-3 rounded-2xl text-xs font-semibold transition-all border ${
                    energySleepRating === opt
                      ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md'
                      : 'bg-[#FDF8F9] text-[#4A1B3C] border-[#E85D9A]/15 hover:border-[#E85D9A]/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* 9. Bugs encountered */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-1">
              9. Did you encounter any bugs or errors? <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={bugsEncountered}
              onChange={e => setBugsEncountered(e.target.value)}
              placeholder="Describe any error messages, crashes, or visual glitches..."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-sm text-[#4A1B3C] placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* 10. Notifications */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-2">
              10. Did notifications work correctly, if tested? <span className="text-[#E85D9A]">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {NOTIFICATIONS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setNotificationsWorking(opt)}
                  className={`py-3 px-4 rounded-2xl text-sm font-semibold transition-all border ${
                    notificationsWorking === opt
                      ? 'bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white border-transparent shadow-md'
                      : 'bg-[#FDF8F9] text-[#4A1B3C] border-[#E85D9A]/15 hover:border-[#E85D9A]/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION D: Suggestions */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-[#E85D9A]/15 space-y-6">
          <div className="border-b border-gray-100 pb-3">
            <h2 className="text-lg font-bold text-[#4A1B3C] flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#E85D9A]/10 text-[#E85D9A] text-xs flex items-center justify-center font-bold">D</span>
              Suggestions & Improvements
            </h2>
          </div>

          {/* 11. Liked most */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-1">
              11. What did you like most about Luna? <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={likedMost}
              onChange={e => setLikedMost(e.target.value)}
              placeholder="e.g. The cycle wheel design, the warm tone of the insights..."
              rows={2}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-sm text-[#4A1B3C] placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* 12. Improve first */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-1">
              12. What would you improve first? <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={improveFirst}
              onChange={e => setImproveFirst(e.target.value)}
              placeholder="e.g. Faster symptom logging, customizable reminders..."
              rows={2}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-sm text-[#4A1B3C] placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* 13. Future features */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-1">
              13. What feature would you like Luna to have in the future? <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={futureFeatures}
              onChange={e => setFutureFeatures(e.target.value)}
              placeholder="e.g. Apple Health / Google Fit sync, temperature tracking..."
              rows={2}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-sm text-[#4A1B3C] placeholder:text-gray-400 transition-colors"
            />
          </div>

          {/* 14. Additional suggestions */}
          <div>
            <label className="block text-sm font-bold text-[#4A1B3C] mb-1">
              14. Any additional suggestions? <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              value={additionalSuggestions}
              onChange={e => setAdditionalSuggestions(e.target.value)}
              placeholder="Any other thoughts you would like to share with our team..."
              rows={2}
              maxLength={2000}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#E85D9A] focus:ring-2 focus:ring-[#E85D9A]/20 outline-none text-sm text-[#4A1B3C] placeholder:text-gray-400 transition-colors"
            />
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
          <p className="text-xs text-gray-500">
            🔒 Your feedback is submitted securely and contains no sensitive medical or personal identity data.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-[#E85D9A] to-[#D93F7D] text-white font-extrabold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Feedback ✨</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
