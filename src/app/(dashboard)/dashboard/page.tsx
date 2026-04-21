'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PhaseStatusCard } from '@/components/cycle/PhaseStatusCard';
import { CalendarGrid } from '@/components/cycle/CalendarGrid';
import { InsightCard } from '@/components/cycle/InsightCard';
import { DailyLogModal } from '@/components/cycle/DailyLogModal';
import { CheckInCard } from '@/components/cycle/CheckInCard';
import { HydrationWidget } from '@/components/hydration/HydrationWidget';
import { StreakWidget } from '@/components/streaks/StreakWidget';
import { MilestoneCelebration } from '@/components/streaks/MilestoneCelebration';
import { Prediction, CycleLog, DailyLog, Insight } from '@/types/cycle';

interface DashboardData {
  prediction?: Prediction;
  recentCycles?: CycleLog[];
  todayLog?: DailyLog;
  insights?: Insight[];
  allLogs?: DailyLog[];
  needsOnboarding?: boolean;
}

export default function DashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDailyModelOpen, setDailyModelOpen] = useState(false);
  const [earnedBadgeKeys, setEarnedBadgeKeys] = useState<string[]>([]);

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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetching on mount is a standard pattern
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col gap-6 animate-pulse">
        <div className="w-full h-40 bg-gray-200 rounded-3xl" />
        <div className="w-full h-96 bg-gray-200 rounded-3xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8 pb-10">
      
      {earnedBadgeKeys.length > 0 && (
        <MilestoneCelebration 
          badgeKeys={earnedBadgeKeys} 
          onDismiss={() => setEarnedBadgeKeys([])} 
        />
      )}

      <CheckInCard onAnswered={fetchDashboard} />

      {data.prediction ? (
        <PhaseStatusCard 
          phase={data.prediction.currentPhase || 'unknown'}
          daysUntilNext={data.prediction.daysUntilNextPeriod || 0}
          dayOfCycle={data.prediction.dayOfCycle || 0}
        />
      ) : (
        <div className="w-full p-8 rounded-3xl border bg-gray-50 border-gray-200 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-[#4A1B3C] mb-2">Welcome to Luna</h2>
          <p className="text-[#4A1B3C]/70">Log your first period to activate cycle predictions.</p>
        </div>
      )}

      <HydrationWidget phase={data.prediction?.currentPhase || 'unknown'} />

      <StreakWidget />

      <CalendarGrid 
        prediction={data.prediction ?? null}
        cycles={data.recentCycles ?? []}
        logs={data.allLogs ?? []}
        onRefresh={fetchDashboard}
      />

      {data.insights && data.insights.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-[#4A1B3C] mb-4">Insights</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar pointer-events-auto">
            {data.insights.map((insight: Insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={() => setDailyModelOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-[#E85D9A] hover:bg-[#d44d88] text-white rounded-full shadow-[0_8px_20px_rgba(232,93,154,0.4)] flex items-center justify-center transform transition-transform hover:scale-105 z-40"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
      </button>

      <DailyLogModal 
        isOpen={isDailyModelOpen} 
        onClose={() => setDailyModelOpen(false)} 
        onSuccess={(newBadges?: string[]) => { 
          setDailyModelOpen(false); 
          if (newBadges && newBadges.length > 0) {
            setEarnedBadgeKeys(newBadges);
          }
          fetchDashboard(); 
        }}
        initialData={data.todayLog}
      />
    </div>
  );
}
