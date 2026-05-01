import { createAdminClient } from '@/lib/supabase/admin';
import { Pattern, CycleLog, DailyLog } from '@/types/cycle';

// Helper: convert mood string to numeric score
function moodToScore(mood: string): number {
  const map: Record<string, number> = { terrible: 1, low: 2, okay: 3, good: 4, great: 5 };
  return map[mood] || 3;
}

// Helper: calculate Pearson correlation coefficient
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function standardDeviation(arr: number[]): number {
  const n = arr.length;
  if (n === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / n;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
  return Math.sqrt(variance);
}

function daysBetween(d1: string | Date, d2: string | Date): number {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getDayOfCycle(logDate: string, cycles: CycleLog[]): number {
  // Find the most recent cycle that started before or on logDate
  const dDate = new Date(logDate);
  const validCycles = cycles.filter(c => new Date(c.period_start) <= dDate).sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime());
  if (validCycles.length > 0) {
    return daysBetween(validCycles[0].period_start, logDate) + 1;
  }
  return -1;
}

export async function analyzePatterns(userId: string): Promise<Pattern[]> {
  const supabase = createAdminClient();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const dateStr = ninetyDaysAgo.toISOString().split('T')[0];

  const [cyclesRes, dailyLogsRes, predictionRes] = await Promise.all([
    supabase.from('cycle_logs').select('*').eq('user_id', userId).order('period_start', { ascending: false }).limit(10),
    supabase.from('daily_logs').select('*').eq('user_id', userId).gte('log_date', dateStr).order('log_date', { ascending: true }),
    supabase.from('cycle_predictions').select('*').eq('user_id', userId).single()
  ]);

  const cycles = (cyclesRes.data || []) as CycleLog[];
  const dailyLogs = (dailyLogsRes.data || []) as DailyLog[];
  const prediction = predictionRes.data;

  const patterns: Pattern[] = [];

  // PATTERN 1 — Symptom-phase correlation
  const crampDays = dailyLogs
    .filter(log => log.symptoms?.includes('cramps'))
    .map(log => getDayOfCycle(log.log_date, cycles))
    .filter(d => d !== -1);
  
  if (crampDays.length > 3) {
    const avgDay = Math.round(crampDays.reduce((a, b) => a + b, 0) / crampDays.length);
    if (avgDay <= 3) {
      patterns.push({
        id: 'cramps_early',
        type: 'cycle_phase',
        title: 'Cramps pattern detected',
        description: `You typically get cramps on day ${avgDay} of your cycle. This is normal for the early menstrual phase.`,
        confidence: crampDays.length / 10 > 1 ? 1 : crampDays.length / 10,
        actionable: true,
        recommendation: 'Have ibuprofen ready the day before your period starts.',
      });
    }
  }

  // PATTERN 2 — Mood-energy correlation
  const moodEnergyPairs = dailyLogs
    .filter(log => log.mood && log.energy)
    .map(log => ({ mood: moodToScore(log.mood!), energy: log.energy! }));
  
  if (moodEnergyPairs.length > 10) {
    const correlation = calculateCorrelation(
      moodEnergyPairs.map(p => p.mood),
      moodEnergyPairs.map(p => p.energy)
    );
    if (correlation > 0.6) {
      patterns.push({
        id: 'mood_energy_link',
        type: 'correlation',
        title: 'Mood affects your energy',
        description: `When you feel low, your energy drops too. This happens ${Math.round(correlation * 100)}% of the time.`,
        confidence: correlation > 1 ? 1 : correlation,
        actionable: true,
        recommendation: 'On low mood days, gentle movement like a short walk can help boost energy.',
      });
    }
  }

  // PATTERN 3 — PMS symptoms timing (Bloating)
  const bloatingDays = dailyLogs
    .filter(log => log.symptoms?.includes('bloating'))
    .map(log => {
      // Find next period start after log.log_date
      const logDateObj = new Date(log.log_date);
      const nextCycle = cycles.find(c => new Date(c.period_start) > logDateObj);
      if (nextCycle) {
        return daysBetween(log.log_date, nextCycle.period_start);
      }
      return null;
    })
    .filter(d => d !== null) as number[];
  
  if (bloatingDays.length > 3) {
    const avgDaysBefore = Math.round(bloatingDays.reduce((a, b) => a + b, 0) / bloatingDays.length);
    if (avgDaysBefore > 0 && avgDaysBefore < 7) {
      patterns.push({
        id: 'bloating_pms',
        type: 'trigger',
        title: 'Bloating before your period',
        description: `You typically feel bloated ${avgDaysBefore} days before your period starts.`,
        confidence: bloatingDays.length / 6 > 1 ? 1 : bloatingDays.length / 6,
        actionable: true,
        recommendation: 'Reduce salt intake and drink extra water during this time.',
      });
    }
  }

  // PATTERN 4 — Cycle regularity trend
  if (cycles.length >= 4) {
    const cycleLengths = cycles.map(c => c.cycle_length).filter(l => l !== null) as number[];
    if (cycleLengths.length >= 6) {
      const recentStdDev = standardDeviation(cycleLengths.slice(0, 3));
      const olderStdDev = standardDeviation(cycleLengths.slice(3, 6));
      
      if (olderStdDev - recentStdDev > 2) {
        patterns.push({
          id: 'regularity_improving',
          type: 'trend',
          title: 'Your cycle is getting more regular',
          description: `Your last 3 cycles varied by only ${Math.round(recentStdDev)} days, compared to ${Math.round(olderStdDev)} days before.`,
          confidence: 0.8,
          actionable: false,
        });
      }
    }
  }

  // PATTERN 6 — Warning patterns
  if (prediction && prediction.predicted_start) {
    const predictedStart = new Date(prediction.predicted_start);
    const today = new Date();
    const diffTime = today.getTime() - predictedStart.getTime();
    const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLate > 7) {
      patterns.push({
        id: 'period_very_late',
        type: 'warning',
        title: 'Your period is quite late',
        description: `Your period was predicted ${daysLate} days ago. This could be normal cycle variation, stress, or other factors.`,
        confidence: 0.9,
        actionable: true,
        recommendation: 'If this continues or if you have pregnancy risk, consider taking a pregnancy test or consulting a doctor.',
      });
    }
  }

  return patterns.sort((a, b) => b.confidence - a.confidence);
}
