import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { computePrediction, getPhaseDescription } from '@/lib/cycle/predictor';
import { generateInsights } from '@/lib/cycle/insights';
import { analyzePatterns } from '@/lib/insights/pattern-analyzer';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const admin = createAdminClient();
  
  // Fetch profiles table to check if onboarding is complete
  const { data: profile } = await admin.from('profiles').select('onboarding_completed, display_name').eq('id', user.id).single();
  
  if (!profile?.onboarding_completed) {
      return NextResponse.json({ needsOnboarding: true }, { status: 200 });
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  // Pad the month + day to YYYY-MM-DD local time equivalent for exact day match
  const todayStr = 
    today.getFullYear() + '-' + 
    String(today.getMonth() + 1).padStart(2, '0') + '-' + 
    String(today.getDate()).padStart(2, '0');

  const [predictionRes, recentCyclesRes, todayLogRes, allLogsRes, onboardRes] = await Promise.all([
      admin.from('cycle_predictions').select('*').eq('user_id', user.id).single(),
      admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6),
      admin.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', todayStr).single(),
      admin.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(90),
      admin.from('onboarding_data').select('*').eq('user_id', user.id).single()
  ]);

  const predictionObj = predictionRes.data;

  if (onboardRes.data) {
      const mappedCycles = (recentCyclesRes.data || []).map((c: Record<string, unknown>) => ({
          periodStart: new Date(c.period_start as string),
          periodEnd: c.period_end ? new Date(c.period_end as string) : undefined,
          cycleLength: (c.cycle_length as number) || undefined
      }));
      
      const computed = computePrediction(mappedCycles, {
          avgCycleLength: onboardRes.data.avg_cycle_length,
          avgPeriodLength: onboardRes.data.avg_period_length,
          lastPeriodStart: recentCyclesRes.data && recentCyclesRes.data.length > 0 ? new Date(recentCyclesRes.data[0].period_start) : (onboardRes.data.last_period_start ? new Date(onboardRes.data.last_period_start) : undefined)
      });
      
      if (predictionObj) {
        Object.assign(predictionObj, computed, {
          phaseDescription: getPhaseDescription(computed.currentPhase)
        });
      }
  }

  const [allInsights, realPatterns] = await Promise.all([
    generateInsights(recentCyclesRes.data || [], allLogsRes.data || []),
    analyzePatterns(user.id)
  ]);

  // Map Pattern[] to Insight[] for the UI
  const patternInsights = realPatterns.map(p => ({
    id: p.id,
    type: 'pattern',
    title: p.title,
    body: p.description,
    priority: p.confidence * 10
  }));

  const combinedInsights = [...patternInsights, ...allInsights];
  const topInsights = combinedInsights.slice(0, 3);

  // calculate streak
  let streakDays = 0;
  if (allLogsRes.data && allLogsRes.data.length > 0) {
      const sortedDates = allLogsRes.data.map((l: Record<string, unknown>) => new Date(l.log_date as string).getTime()).sort((a: number, b: number) => b - a);
      let currentDate = Date.now();
      for (let i = 0; i < sortedDates.length; i++) {
          const date = sortedDates[i];
          const diffDays = Math.floor((currentDate - date) / (1000 * 3600 * 24));
          if (diffDays === 0 || diffDays === 1) {
              streakDays++;
              currentDate = date; // shift window back
          } else if (diffDays > 1) {
              break;
          }
      }
  }

  return NextResponse.json({ 
      prediction: predictionObj,
      recentCycles: (recentCyclesRes.data || []).slice(0,3),
      todayLog: todayLogRes.data || null,
      allLogs: allLogsRes.data || [],
      insights: topInsights,
      streakDays,
      displayName: profile?.display_name
  }, { status: 200 });
}
