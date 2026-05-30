'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhaseStatusCard } from '@/components/cycle/PhaseStatusCard';
import { CalendarGrid } from '@/components/cycle/CalendarGrid';
import { InsightCard } from '@/components/cycle/InsightCard';
import { DailyFeelingsModal } from '@/components/cycle/DailyFeelingsModal';
import { PeriodLogModal } from '@/components/cycle/PeriodLogModal';
import { CheckInCard } from '@/components/cycle/CheckInCard';

import { StreakWidget } from '@/components/streaks/StreakWidget';
import { MilestoneCelebration } from '@/components/streaks/MilestoneCelebration';
import { TodayLogQuickCard } from '@/components/cycle/TodayLogQuickCard';
import WelcomePopup from '@/components/dashboard/WelcomePopup';
import UpcomingSymptomAlerts from '@/components/predictions/UpcomingSymptomAlerts';

import { DailyAffirmation } from '@/components/dashboard/DailyAffirmation';
import { Prediction, CycleLog, DailyLog, Insight } from '@/types/cycle';

// Premium component imports
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import Confetti from '@/components/ui/Confetti';
import { HydrationWidget } from '@/components/hydration/HydrationWidget';
import { useToast } from '@/components/ui/Toast';
import { Plus } from 'lucide-react';

interface DashboardData {
  prediction?: Prediction;
  recentCycles?: CycleLog[];
  todayLog?: DailyLog;
  insights?: Insight[];
  allLogs?: DailyLog[];
  needsOnboarding?: boolean;
  displayName?: string;
}

export default function DashboardClient() {
  const router = useRouter();
  const toast = useToast();
  
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDailyFeelingsModalOpen, setDailyFeelingsModalOpen] = useState(false);
  const [isPeriodModalOpen, setPeriodModalOpen] = useState(false);
  const [earnedBadgeKeys, setEarnedBadgeKeys] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/summary');
      const json = await res.json();
      
      if (json.needsOnboarding) {
        router.push('/onboarding');
        return;
      }
      
      setData(json);
    } catch (e) {
      console.error(e);
      toast('error', 'Failed to load data', 'Could not refresh cycle predictions.');
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    void fetchDashboard();
  }, [fetchDashboard]);



  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) return null;

  const isOnPeriod = data.prediction?.currentPhase === 'menstrual';

  return (
    <div className="flex flex-col gap-[24px] relative pb-20">
      <Confetti trigger={showConfetti} />

      {earnedBadgeKeys.length > 0 && (
        <MilestoneCelebration 
          badgeKeys={earnedBadgeKeys} 
          onDismiss={() => setEarnedBadgeKeys([])} 
        />
      )}

      <WelcomePopup />
      
      <div className="animate-slide-up stagger-1">
        <UpcomingSymptomAlerts />
      </div>

      <div className="animate-slide-up stagger-2">
        <DailyAffirmation phase={data.prediction?.currentPhase || 'unknown'} />
      </div>

      <div className="animate-slide-up stagger-2">
        <CheckInCard onAnswered={fetchDashboard} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[16px] md:gap-[24px]">
        {/* Left Column (Primary Cycle Info) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-[16px]">
          {/* Phase Card */}
          <div className="animate-slide-up stagger-3">
            {data.prediction ? (
              <PhaseStatusCard 
                phase={data.prediction.currentPhase || 'unknown'}
                dayOfCycle={data.prediction.dayOfCycle || 0}
                avgCycleLength={data.recentCycles && data.recentCycles.length > 0 ? (data.recentCycles[0].cycle_length || 28) : 28}
                daysUntilNextPeriod={data.prediction.daysUntilNextPeriod || 0}
                isLate={data.prediction.isLate || (data.prediction.daysUntilNextPeriod !== undefined && data.prediction.daysUntilNextPeriod < 0)}
              />
            ) : (
              <div className="w-full p-8 rounded-[20px] bg-white border-[0.5px] border-[#E85D9A]/10 text-center shadow-sm">
                <h2 className="text-[16px] font-semibold text-[#1A0A12] mb-2">Welcome to Luna</h2>
                <p className="text-[14px] text-[#4A3040]">Log your first period to activate cycle predictions.</p>
              </div>
            )}
          </div>

          {/* Calendar Grid */}
          <div className="animate-slide-up stagger-4">
            <CalendarGrid 
              prediction={data.prediction ?? null}
              cycles={data.recentCycles ?? []}
              logs={data.allLogs ?? []}
              onRefresh={fetchDashboard}
            />
          </div>

          {/* Insights Strip */}
          {data.insights && data.insights.length > 0 && (
            <div className="mt-[8px] animate-slide-up stagger-5">
              <div className="flex justify-between items-end mb-[12px]">
                <h3 className="text-[16px] font-semibold text-[#1A0A12]">For you</h3>
                <Link href="/insights" className="text-[12px] text-[#E85D9A] font-medium cursor-pointer hover:underline">See all</Link>
              </div>
              <div className="flex gap-[16px] overflow-x-auto pb-[16px] snap-x hide-scrollbar pointer-events-auto -mx-[16px] px-[16px] md:mx-0 md:px-0">
                {data.insights.map((insight: Insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (Daily Logging & Widgets) */}
        <div className="md:col-span-5 lg:col-span-4 flex flex-col gap-[16px]">
          {/* Hydration Widget */}
          <div className="animate-slide-up stagger-3">
            <HydrationWidget phase={data.prediction?.currentPhase || 'unknown'} />
          </div>

          {/* Today's Log Quick-Card */}
          <div className="animate-slide-up stagger-4">
            <TodayLogQuickCard 
              todayLog={data.todayLog || null} 
              isOnPeriod={isOnPeriod}
              onLogDaily={() => setDailyFeelingsModalOpen(true)}
              onLogPeriod={() => setPeriodModalOpen(true)}
            />
          </div>

          {/* App Benefits Card */}
          <div className="bg-white rounded-[20px] p-6 border-[0.5px] border-[#E85D9A]/10 shadow-sm relative overflow-hidden group hover:border-[#E85D9A]/30 transition-all duration-300 animate-slide-up stagger-5">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-pink-50 to-transparent rounded-bl-[100px] pointer-events-none -z-10 group-hover:scale-110 transition-transform duration-300" />
            <h3 className="text-[16px] font-bold text-[#1A0A12] mb-4 flex items-center gap-2">
              ✨ Luna Benefits
            </h3>
            <ul className="space-y-3.5">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-pink-50 text-[#E85D9A] flex items-center justify-center text-xs font-bold">🔒</span>
                <div>
                  <span className="text-[13px] font-bold text-[#4A1B3C] block">100% Secure & Private</span>
                  <span className="text-[11px] text-[#4A1B3C]/70">Your health data is encrypted and completely under your control.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center text-xs font-bold">🤖</span>
                <div>
                  <span className="text-[13px] font-bold text-[#4A1B3C] block">AI Insights & Predictions</span>
                  <span className="text-[11px] text-[#4A1B3C]/70">Get custom predictions for your upcoming phase, fertile windows, and symptom alerts.</span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-50 text-teal-500 flex items-center justify-center text-xs font-bold">🤝</span>
                <div>
                  <span className="text-[13px] font-bold text-[#4A1B3C] block">Secure Partner Sharing</span>
                  <span className="text-[11px] text-[#4A1B3C]/70">Share read-only phase predictions and support guides with your partner securely.</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Streak Widget */}
          <div className="animate-slide-up stagger-6">
            <StreakWidget allLogs={data.allLogs} />
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full text-white flex items-center justify-center z-30 active:scale-90 transition-transform cursor-pointer outline-none"
        style={{
          background: 'linear-gradient(135deg, #E85D9A, #7F77DD)',
          boxShadow: '0 8px 24px rgba(232,93,154,0.4)',
          animation: 'floatUp 3s ease-in-out infinite',
        }}
        onClick={() => setDailyFeelingsModalOpen(true)}
      >
        <Plus size={24} />
      </button>

      <DailyFeelingsModal 
        isOpen={isDailyFeelingsModalOpen} 
        onClose={() => setDailyFeelingsModalOpen(false)} 
        onSuccess={(newBadges?: string[]) => { 
          setDailyFeelingsModalOpen(false); 
          toast('success', 'Daily log saved', 'Your feelings have been logged.');
          if (newBadges && newBadges.length > 0) {
            setEarnedBadgeKeys(newBadges);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 100);
          }
          fetchDashboard(); 
        }}
        initialData={data.todayLog}
      />

      <PeriodLogModal 
        isOpen={isPeriodModalOpen} 
        onClose={() => setPeriodModalOpen(false)} 
        onSuccess={() => { 
          setPeriodModalOpen(false); 
          toast('success', 'Period logged', 'Your cycle dates have been updated.');
          fetchDashboard(); 
        }}
        initialData={data.recentCycles ? data.recentCycles[0] : undefined}
      />
    </div>
  );
}
