'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
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
import { WellnessTracker } from '@/components/dashboard/WellnessTracker';
import { QuickMoodLogger } from '@/components/dashboard/QuickMoodLogger';
import { DailyAffirmation } from '@/components/dashboard/DailyAffirmation';
import { Prediction, CycleLog, DailyLog, Insight } from '@/types/cycle';

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
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDailyFeelingsModalOpen, setDailyFeelingsModalOpen] = useState(false);
  const [isPeriodModalOpen, setPeriodModalOpen] = useState(false);
  const [earnedBadgeKeys, setEarnedBadgeKeys] = useState<string[]>([]);
  const [isFabMenuOpen, setFabMenuOpen] = useState(false);
  const fabTimerRef = useRef<NodeJS.Timeout | null>(null);

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
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    /* eslint-disable-next-line react-hooks/set-state-in-effect */
    void fetchDashboard();
  }, [fetchDashboard]);

  // FAB Long Press logic
  const handleFabDown = () => {
    fabTimerRef.current = setTimeout(() => {
      setFabMenuOpen(true);
    }, 500);
  };
  const handleFabUp = () => {
    if (fabTimerRef.current) clearTimeout(fabTimerRef.current);
    if (!isFabMenuOpen) setDailyFeelingsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-6 animate-pulse pt-4">
        <div className="w-full h-[60px] bg-gray-200 rounded-[20px]" />
        <div className="w-full h-[200px] bg-gray-200 rounded-[20px]" />
        <div className="w-full h-[80px] bg-gray-200 rounded-[20px]" />
      </div>
    );
  }

  if (!data) return null;


  const isOnPeriod = data.prediction?.currentPhase === 'menstrual';

  return (
    <div className="flex flex-col gap-[24px]">
      
      {earnedBadgeKeys.length > 0 && (
        <MilestoneCelebration 
          badgeKeys={earnedBadgeKeys} 
          onDismiss={() => setEarnedBadgeKeys([])} 
        />
      )}

      <WelcomePopup />
      
      <UpcomingSymptomAlerts />

      <DailyAffirmation phase={data.prediction?.currentPhase || 'unknown'} />

      <CheckInCard onAnswered={fetchDashboard} />

      <div className="grid grid-cols-1 md:grid-cols-12 gap-[16px] md:gap-[24px]">
        {/* Left Column (Primary Cycle Info) */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-[16px]">
          {/* Phase Card */}
          {data.prediction ? (
            <PhaseStatusCard 
              phase={data.prediction.currentPhase || 'unknown'}
              daysUntilNext={data.prediction.daysUntilNextPeriod || 0}
              dayOfCycle={data.prediction.dayOfCycle || 0}
              avgCycleLength={data.recentCycles && data.recentCycles.length > 0 ? (data.recentCycles[0].cycle_length || 28) : 28}
              avgPeriodLength={5}
            />
          ) : (
            <div className="w-full p-8 rounded-[20px] bg-white border-[0.5px] border-[#E85D9A]/10 text-center shadow-sm">
              <h2 className="text-[16px] font-semibold text-[#1A0A12] mb-2">Welcome to Luna</h2>
              <p className="text-[14px] text-[#4A3040]">Log your first period to activate cycle predictions.</p>
            </div>
          )}

          {/* Calendar Grid */}
          <CalendarGrid 
            prediction={data.prediction ?? null}
            cycles={data.recentCycles ?? []}
            logs={data.allLogs ?? []}
            onRefresh={fetchDashboard}
          />


          {/* Insights Strip */}
          {data.insights && data.insights.length > 0 && (
            <div className="mt-[8px]">
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
          {/* Quick Mood Logger */}
          <QuickMoodLogger onLogged={fetchDashboard} />

          {/* Today's Log Quick-Card */}
          <TodayLogQuickCard 
            todayLog={data.todayLog || null} 
            isOnPeriod={isOnPeriod}
            onLogDaily={() => setDailyFeelingsModalOpen(true)}
            onLogPeriod={() => setPeriodModalOpen(true)}
          />

          {/* Daily Wellness Tracker */}
          <WellnessTracker 
            initialData={data.todayLog ? { 
            hydration_goal: !!data.todayLog.hydration_goal, 
            slept_well: !!data.todayLog.slept_well, 
            moved_body: !!data.todayLog.moved_body 
          } : undefined} 
            onUpdate={fetchDashboard} 
          />

          {/* Streak Widget */}
          <StreakWidget allLogs={data.allLogs} />
        </div>
      </div>

      {/* FAB */}
      <div className="fixed bottom-[80px] left-0 right-0 mx-auto pointer-events-none z-40 w-full max-w-[480px] md:max-w-5xl">
        <div className="absolute bottom-0 right-[20px] pointer-events-auto flex flex-col items-end gap-2">
          {isFabMenuOpen && (
            <div className="flex flex-col gap-2 mb-2 animate-fade-in items-end">
              <button onClick={() => { setFabMenuOpen(false); setDailyFeelingsModalOpen(true); }} className="bg-white text-[#1A0A12] text-[12px] font-semibold px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(232,93,154,0.15)] transition-transform active:scale-95">Log today</button>
              <button onClick={() => { setFabMenuOpen(false); setPeriodModalOpen(true); }} className="bg-white text-[#1A0A12] text-[12px] font-semibold px-4 py-2 rounded-full shadow-[0_4px_12px_rgba(232,93,154,0.15)] transition-transform active:scale-95">Log period</button>
            </div>
          )}
          <button 
            onPointerDown={handleFabDown}
            onPointerUp={handleFabUp}
            onPointerLeave={() => { if (fabTimerRef.current) clearTimeout(fabTimerRef.current); }}
            className={`w-[52px] h-[52px] bg-[#E85D9A] text-white rounded-full shadow-[0_4px_16px_rgba(232,93,154,0.35)] flex items-center justify-center transition-all duration-150 ease-out hover:scale-[1.08] active:scale-[0.95] ${isFabMenuOpen ? 'rotate-45' : ''}`}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          </button>
        </div>
      </div>

      <DailyFeelingsModal 
        isOpen={isDailyFeelingsModalOpen} 
        onClose={() => setDailyFeelingsModalOpen(false)} 
        onSuccess={(newBadges?: string[]) => { 
          setDailyFeelingsModalOpen(false); 
          if (newBadges && newBadges.length > 0) {
            setEarnedBadgeKeys(newBadges);
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
          fetchDashboard(); 
        }}
        initialData={data.recentCycles ? data.recentCycles[0] : undefined}
      />
    </div>
  );
}
