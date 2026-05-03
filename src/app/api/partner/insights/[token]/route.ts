import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generatePartnerInsights } from '@/lib/partner/insights-generator';
import { computePrediction } from '@/lib/cycle/predictor';

// Helper to calculate prediction locally based on latest data
async function getPrediction(userId: string) {
  const adminSupabase = createAdminClient();
  const [logsRes, onboardRes] = await Promise.all([
    adminSupabase.from('cycle_logs').select('*').eq('user_id', userId).order('period_start', { ascending: false }).limit(6),
    adminSupabase.from('onboarding_data').select('*').eq('user_id', userId).maybeSingle()
  ]);

  const last6 = logsRes.data || [];
  const onboard = onboardRes.data;

  const mappedCycles = last6.map(c => ({
    periodStart: new Date(c.period_start as string),
    periodEnd: c.period_end ? new Date(c.period_end as string) : undefined,
    cycleLength: (c.cycle_length as number) || undefined
  }));

  return computePrediction(mappedCycles, {
    avgCycleLength: onboard?.avg_cycle_length || 28,
    avgPeriodLength: onboard?.avg_period_length || 5,
    lastPeriodStart: last6[0]?.period_start ? new Date(last6[0].period_start) : undefined
  });
}

function moodToScore(mood: string): number {
  const map: Record<string, number> = { terrible: 1, low: 2, okay: 3, good: 4, great: 5 };
  return map[mood] || 3;
}

function getPhasePartnerDescription(phase: string): string {
  const descriptions: Record<string, string> = {
    menstrual: "She's on her period right now.",
    follicular: "Energy is building. This is usually her best week.",
    ovulatory: "She's at peak energy and social mood this week.",
    luteal: "Winding down phase. Mood and energy may be lower than usual.",
    unknown: "Still learning her cycle pattern.",
  };
  return descriptions[phase] || descriptions.unknown;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
): Promise<Response> {
  try {
    const { token } = await params;

    // 1. Find user by partner token
    const adminSupabase = createAdminClient();
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('id, display_name, partner_share_enabled')
      .eq('partner_share_token', token)
      .eq('partner_share_enabled', true)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Invalid or inactive share link' }, { status: 404 });
    }

    // 2. Get current prediction
    const prediction = await getPrediction(profile.id);

    // 3. Get recent mood trend (last 7 days) — just the general trend, not specific moods
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentLogs } = await adminSupabase
      .from('daily_logs')
      .select('mood, energy, log_date')
      .eq('user_id', profile.id)
      .gte('log_date', sevenDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });

    // 4. Compute general mood/energy trend
    const moodScores = recentLogs
      ?.filter(log => log.mood)
      .map(log => moodToScore(log.mood as string)) || [];
    const avgMood = moodScores.length
      ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
      : null;

    const energyScores = recentLogs
      ?.filter(log => log.energy)
      .map(log => log.energy as number) || [];
    const avgEnergy = energyScores.length
      ? energyScores.reduce((a, b) => a + b, 0) / energyScores.length
      : null;

    // 5. Generate partner-appropriate insights
    const insights = generatePartnerInsights({
      phase: prediction.currentPhase,
      dayOfCycle: prediction.dayOfCycle,
      daysUntilPeriod: prediction.daysUntilNextPeriod,
      avgMood,
      avgEnergy,
    });

    return NextResponse.json({
      displayName: profile.display_name,
      currentPhase: prediction.currentPhase,
      phaseDescription: getPhasePartnerDescription(prediction.currentPhase),
      dayOfCycle: prediction.dayOfCycle,
      daysUntilNextPeriod: prediction.daysUntilNextPeriod,
      generalMoodTrend: avgMood ? (avgMood >= 3.5 ? 'good' : avgMood >= 2.5 ? 'okay' : 'low') : 'unknown',
      generalEnergyTrend: avgEnergy ? (avgEnergy >= 3.5 ? 'high' : avgEnergy >= 2.5 ? 'moderate' : 'low') : 'unknown',
      supportTips: insights.tips,
      whatToExpect: insights.whatToExpect,
      dosDonts: insights.dosDonts,
    });
  } catch (error) {
    console.error('Partner insights error:', error);
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 500 });
  }
}
