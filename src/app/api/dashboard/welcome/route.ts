import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPhaseDescription, CyclePhase } from '@/lib/cycle/predictor';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [{ data: profile }, { data: prediction }] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', user.id).single(),
      supabase.from('cycle_predictions').select('*').eq('user_id', user.id).single()
    ]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    
    // Default phase
    let currentPhase = 'unknown';
    let dayOfCycle = 0;
    
    if (prediction && prediction.predicted_start) {
      const predictedStart = new Date(prediction.predicted_start);
      const today = new Date();
      dayOfCycle = Math.ceil((today.getTime() - predictedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      if (dayOfCycle >= 1 && dayOfCycle <= 5) currentPhase = 'menstrual';
      else if (dayOfCycle > 5 && dayOfCycle <= 13) currentPhase = 'follicular';
      else if (dayOfCycle > 13 && dayOfCycle <= 15) currentPhase = 'ovulatory';
      else if (dayOfCycle > 15) currentPhase = 'luteal';
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
