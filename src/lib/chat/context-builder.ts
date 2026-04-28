import { createAdminClient } from '@/lib/supabase/admin';
import { computePrediction } from '@/lib/cycle/predictor';

export interface UserHealthContext {
  today: {
    date: string;
    dayOfCycle: number | null;
    phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' | 'unknown';
    daysUntilNextPeriod: number | null;
    isLate: boolean;
  };
  recentSymptoms: {
    symptom: string;
    daysAgo: number;
    severity?: number;
  }[];
  recentMoods: {
    mood: string;
    energy: number | null;
    date: string;
  }[];
  recentFlow: {
    flow: string;
    date: string;
  }[];
  cycleStats: {
    avgCycleLength: number;
    avgPeriodLength: number;
    lastPeriodStart: string | null;
    totalCyclesLogged: number;
    isIrregular: boolean;
  };
  conditions: string[];
  goals: string[];
  topSymptoms: string[];
  currentPrediction: {
    predictedStart: string | null;
    fertileStart: string | null;
    fertileEnd: string | null;
    ovulationDate: string | null;
    confidence: number;
  } | null;
  notes: string[];
  historicalCycles: { start: string; end: string | null; length: number | null; avgFlow: string | null }[];
  allLogs: { date: string; mood: string | null; energy: number | null; symptoms: string[]; flow: string | null }[];
}

// Simple in-memory cache
const contextCache = new Map<string, { data: UserHealthContext; timestamp: number }>();

export function clearUserContextCache(userId: string) {
  contextCache.delete(userId);
}

export async function buildUserHealthContext(userId: string): Promise<UserHealthContext> {
  const CACHE_TTL = 60 * 1000;
  const now = Date.now();
  const cached = contextCache.get(userId);
  if (cached && (now - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  const supabase = createAdminClient();
  const oneYearAgo = new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: predictionData },
    { data: onboardingData },
    { data: dailyLogsData },
    { data: cycleLogsData }
  ] = await Promise.all([
    supabase.from('cycle_predictions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('onboarding_data').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('daily_logs').select('*').eq('user_id', userId).gte('log_date', oneYearAgo).order('log_date', { ascending: false }),
    supabase.from('cycle_logs').select('*').eq('user_id', userId).order('period_start', { ascending: false })
  ]);

  const allDailyLogs = dailyLogsData || [];
  const cycleLogs = cycleLogsData || [];

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  const sevenDaysAgoTime = todayDate.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoTime = todayDate.getTime() - 30 * 24 * 60 * 60 * 1000;

  const recentLogs = allDailyLogs.filter(l => new Date(l.log_date).getTime() >= sevenDaysAgoTime);
  const thirtyDayLogs = allDailyLogs.filter(l => new Date(l.log_date).getTime() >= thirtyDaysAgoTime);

  const recentSymptoms: UserHealthContext['recentSymptoms'] = [];
  const recentMoods: UserHealthContext['recentMoods'] = [];
  const recentFlow: UserHealthContext['recentFlow'] = [];
  const notes: string[] = [];

  recentLogs.forEach(log => {
    const logDate = new Date(log.log_date);
    logDate.setHours(0, 0, 0, 0);
    const daysAgo = Math.floor((todayDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

    if (log.symptoms) {
      log.symptoms.forEach((symptom: string) => {
        recentSymptoms.push({ symptom, daysAgo });
      });
    }
    if (log.mood || log.energy !== null) {
      recentMoods.push({ mood: log.mood || 'unknown', energy: log.energy, date: log.log_date });
    }
    if (log.flow && log.flow !== 'none') {
      recentFlow.push({ flow: log.flow, date: log.log_date });
    }
    if (log.notes && log.notes.trim() !== '') {
      notes.push(log.notes);
    }
  });

  const symCounts: Record<string, number> = {};
  thirtyDayLogs.forEach(log => {
    (log.symptoms || []).forEach((s: string) => { symCounts[s] = (symCounts[s] || 0) + 1; });
  });
  const topSymptoms = Object.entries(symCounts).sort((a,b) => b[1] - a[1]).slice(0,3).map(e => e[0]);

  let isIrregular = false;
  if (onboardingData?.conditions?.includes('irregular')) {
    isIrregular = true;
  } else if (cycleLogs.length >= 3) {
    const lengths = cycleLogs.map(c => c.cycle_length).filter(l => l !== null) as number[];
    if (lengths.length >= 3) {
      const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lengths.length;
      if (Math.sqrt(variance) > 7) isIrregular = true;
    }
  }

  const mappedCycles = cycleLogs.map(c => ({
    periodStart: new Date(c.period_start),
    periodEnd: c.period_end ? new Date(c.period_end) : undefined
  }));
  const currentPrediction = computePrediction(mappedCycles, {
    avgCycleLength: onboardingData?.avg_cycle_length || 28,
    avgPeriodLength: onboardingData?.avg_period_length || 5,
    lastPeriodStart: cycleLogs.length > 0 ? new Date(cycleLogs[0].period_start) : onboardingData?.last_period_start ? new Date(onboardingData.last_period_start) : undefined
  });

  const context: UserHealthContext = {
    today: {
      date: new Date().toISOString().split('T')[0],
      dayOfCycle: currentPrediction.dayOfCycle,
      phase: currentPrediction.currentPhase,
      daysUntilNextPeriod: currentPrediction.daysUntilNextPeriod,
      isLate: currentPrediction.isLate
    },
    recentSymptoms,
    recentMoods,
    recentFlow: recentFlow.slice(0, 5),
    cycleStats: {
      avgCycleLength: onboardingData?.avg_cycle_length || 28,
      avgPeriodLength: onboardingData?.avg_period_length || 5,
      lastPeriodStart: cycleLogs.length > 0 ? cycleLogs[0].period_start : null,
      totalCyclesLogged: cycleLogs.length,
      isIrregular
    },
    conditions: onboardingData?.conditions || [],
    goals: onboardingData?.goals || [],
    topSymptoms,
    currentPrediction: predictionData ? {
      predictedStart: predictionData.predicted_start,
      fertileStart: predictionData.fertile_start,
      fertileEnd: predictionData.fertile_end,
      ovulationDate: predictionData.ovulation_date,
      confidence: predictionData.confidence
    } : null,
    notes: notes.slice(0, 3),
    historicalCycles: cycleLogs.map(c => ({
      start: c.period_start,
      end: c.period_end,
      length: c.cycle_length,
      avgFlow: c.avg_flow
    })),
    allLogs: allDailyLogs.map(l => ({
      date: l.log_date,
      mood: l.mood,
      energy: l.energy,
      symptoms: l.symptoms || [],
      flow: l.flow
    }))
  };

  contextCache.set(userId, { data: context, timestamp: now });
  return context;
}

export function formatContextForPrompt(ctx: UserHealthContext): string {
  const d2r = (daysAgo: number) => daysAgo === 0 ? 'today' : daysAgo === 1 ? 'yesterday' : `${daysAgo} days ago`;
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'unknown';
    const d = new Date(dateStr);
    return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}`;
  };

  const todayStr = `TODAY: Day ${ctx.today.dayOfCycle || '?'} of cycle. ${ctx.today.phase} phase. ` + 
    (ctx.today.isLate ? `Period is LATE by ${Math.abs(ctx.today.daysUntilNextPeriod!)} days.` : 
    (ctx.today.daysUntilNextPeriod !== null ? `Period predicted in ${ctx.today.daysUntilNextPeriod} days.` : ''));

  let symptomsStr = 'RECENT SYMPTOMS: none logging recently.';
  if (ctx.recentSymptoms.length > 0) {
    const syms = ctx.recentSymptoms.map(s => `${s.symptom} (${d2r(s.daysAgo)})`);
    symptomsStr = `RECENT SYMPTOMS (last 7 days): ${syms.join(', ')}.`;
  }

  let moodStr = 'RECENT MOOD: no data.';
  if (ctx.recentMoods.length > 0) {
    const moods = ctx.recentMoods.map(m => {
       const todayDate = new Date();
       todayDate.setHours(0,0,0,0);
       const logDate = new Date(m.date);
       logDate.setHours(0,0,0,0);
       const diff = Math.floor((todayDate.getTime() - logDate.getTime()) / (1000*3600*24));
       return `${m.mood} ${d2r(diff)} (energy ${m.energy || '?'}/5)`;
    });
    moodStr = `RECENT MOOD: ${moods.join(', ')}.`;
  }

  const cycleStr = `CYCLE: avg ${ctx.cycleStats.avgCycleLength} days, last started ${formatDate(ctx.cycleStats.lastPeriodStart)}. ${ctx.cycleStats.totalCyclesLogged} cycles logged. ${ctx.cycleStats.isIrregular ? 'Irregular' : 'Regular'}.`;
  
  const conds = ctx.conditions.length > 0 ? ctx.conditions.join(', ') : 'none';
  const goals = ctx.goals.length > 0 ? ctx.goals.join(', ') : 'none';
  const medStr = `CONDITIONS: ${conds}. GOALS: ${goals}.`;

  let fertileStr = '';
  if (ctx.currentPrediction) {
    fertileStr = `FERTILE WINDOW: ${formatDate(ctx.currentPrediction.fertileStart)}–${formatDate(ctx.currentPrediction.fertileEnd)}. Ovulation: ${formatDate(ctx.currentPrediction.ovulationDate)}.`;
  }

  // Include comprehensive history
  const historyStr = `HISTORICAL CYCLES: ${JSON.stringify(ctx.historicalCycles)}. DAILY LOGS (1 YEAR): ${JSON.stringify(ctx.allLogs)}.`;

  return [todayStr, symptomsStr, moodStr, cycleStr, medStr, fertileStr, historyStr].filter(Boolean).join('\n');
}
