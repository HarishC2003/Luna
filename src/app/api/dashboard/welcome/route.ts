import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { computePrediction, getPhaseDescription, CyclePhase } from '@/lib/cycle/predictor';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profileRes, recentCyclesRes, onboardRes] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', user.id).single(),
      supabase.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6),
      supabase.from('onboarding_data').select('*').eq('user_id', user.id).single()
    ]);

    const profile = profileRes.data;
    const recentCycles = recentCyclesRes.data || [];
    const onboard = onboardRes.data;

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    
    // Compute accurate phase and day of cycle
    let currentPhase = 'unknown';
    let dayOfCycle = 0;
    
    if (onboard) {
      const mappedCycles = recentCycles.map((c: { period_start: string; period_end: string | null; cycle_length: number | null }) => ({
        periodStart: new Date(c.period_start),
        periodEnd: c.period_end ? new Date(c.period_end) : undefined,
        cycleLength: c.cycle_length || undefined
      }));
      
      const computed = computePrediction(mappedCycles, {
        avgCycleLength: onboard.avg_cycle_length,
        avgPeriodLength: onboard.avg_period_length,
        lastPeriodStart: recentCycles.length > 0 
          ? new Date(recentCycles[0].period_start) 
          : (onboard.last_period_start ? new Date(onboard.last_period_start) : undefined)
      });
      
      currentPhase = computed.currentPhase || 'unknown';
      dayOfCycle = computed.dayOfCycle || 0;
    }

    const phaseTips: Record<string, { emoji: string; tip: string }> = {
      menstrual: {
        emoji: '🌸',
        tip: 'Your body is shedding the uterine lining. Rest is your superpower today — give yourself permission to slow down.',
      },
      follicular: {
        emoji: '🌱',
        tip: 'Estrogen is rising and so is your energy! This is a great time to try something new or tackle that challenging task.',
      },
      ovulatory: {
        emoji: '☀️',
        tip: 'You\'re at peak fertility and energy. Your communication skills are also at their best — great time for important conversations.',
      },
      luteal: {
        emoji: '🌙',
        tip: 'Progesterone is rising, which can make you feel more introspective. Listen to your body — it\'s okay to take things slower.',
      },
      unknown: {
        emoji: '💫',
        tip: 'Track your cycle for a few days and Luna will give you personalized insights about your body\'s rhythm.',
      },
    };

    const { emoji, tip } = phaseTips[currentPhase] || phaseTips.unknown;

    return NextResponse.json({
      displayName: profile?.display_name || 'Beautiful',
      dayOfCycle: Math.max(1, dayOfCycle),
      phase: currentPhase,
      phaseDescription: getPhaseDescription(currentPhase as CyclePhase),
      quickTip: tip,
      emoji,
      greeting,
    });
  } catch (error) {
    console.error('[welcome/route.ts] Error fetching welcome data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
