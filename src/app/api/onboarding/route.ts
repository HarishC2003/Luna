import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { onboardingSchema } from '@/lib/validations/cycle';
import { computePrediction } from '@/lib/cycle/predictor';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await apiLimiter.limit(user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const result = onboardingSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const admin = createAdminClient();
    
    // Upsert onboarding data
    const { error: insertError } = await admin.from('onboarding_data').upsert({
      user_id: user.id,
      avg_cycle_length: result.data.avgCycleLength,
      avg_period_length: result.data.avgPeriodLength,
      last_period_start: result.data.lastPeriodStart || null,
      conditions: result.data.conditions,
      goals: result.data.goals
    }, { onConflict: 'user_id' });

    if (insertError) throw insertError;

    // Mark onboarding complete
    await admin.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);

    // Compute initial prediction
    const prediction = computePrediction([], {
      avgCycleLength: result.data.avgCycleLength,
      avgPeriodLength: result.data.avgPeriodLength,
      lastPeriodStart: result.data.lastPeriodStart ? new Date(result.data.lastPeriodStart) : undefined
    });

    // Save prediction
    await admin.from('cycle_predictions').upsert({
      user_id: user.id,
      predicted_start: prediction.predictedStart.toISOString(),
      predicted_end: prediction.predictedEnd.toISOString(),
      fertile_start: prediction.fertileStart.toISOString(),
      fertile_end: prediction.fertileEnd.toISOString(),
      ovulation_date: prediction.ovulationDate.toISOString(),
      confidence: prediction.confidence,
      based_on_cycles: prediction.basedOnCycles,
      computed_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    return NextResponse.json({ message: 'Onboarding complete' }, { status: 200 });

  } catch (error) {
    console.error('[onboarding] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
