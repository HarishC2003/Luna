import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { logCycleSchema } from '@/lib/validations/cycle';
import { computePrediction } from '@/lib/cycle/predictor';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const body = await request.json();
    const result = logCycleSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const { periodStart, periodEnd, avgFlow, notes } = result.data;
    const admin = createAdminClient();

    // Calculate cycle length if there's a previous cycle
    const { data: existingCycles } = await admin
      .from('cycle_logs')
      .select('period_start')
      .eq('user_id', user.id)
      .order('period_start', { ascending: false })
      .limit(1);

    // cycleLength computed dynamically below
    if (existingCycles && existingCycles.length > 0) {
        const lastStart = new Date(existingCycles[0].period_start);
        const thisStart = new Date(periodStart);
        const diffMs = thisStart.getTime() - lastStart.getTime();
        const diffDays = Math.round(diffMs / (1000 * 3600 * 24));
        
        if (Math.abs(diffDays) <= 3) {
            return NextResponse.json({ error: 'A cycle log already exists within 3 days. Please edit it instead.' }, { status: 409 });
        }
        
        if (diffDays > 0) {
            // Update previous cycle length
            await admin.from('cycle_logs').update({ cycle_length: diffDays }).eq('user_id', user.id).eq('period_start', existingCycles[0].period_start);
        }
    }

    // Insert new cycle
    const { data: newCycle, error: insertError } = await admin.from('cycle_logs').insert({
        user_id: user.id,
        period_start: periodStart,
        period_end: periodEnd || null,
        avg_flow: avgFlow || null,
        notes: notes || null,
    }).select().single();

    if (insertError) return NextResponse.json({ error: 'Failed to save cycle log' }, { status: 500 });

    // Fetch up to 6 for prediction
    const { data: last6 } = await admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6);
    const { data: onboard } = await admin.from('onboarding_data').select('*').eq('user_id', user.id).single();

    if (onboard && last6) {
        const mappedCycles = last6.map((c: Record<string, unknown>) => ({
            periodStart: new Date(c.period_start as string),
            periodEnd: c.period_end ? new Date(c.period_end as string) : undefined,
            cycleLength: (c.cycle_length as number) || undefined
        }));

        const prediction = computePrediction(mappedCycles, {
            avgCycleLength: onboard.avg_cycle_length,
            avgPeriodLength: onboard.avg_period_length,
            lastPeriodStart: new Date(last6[0].period_start)
        });

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

        return NextResponse.json({ 
            cycleLog: newCycle, 
            prediction: { predictedStart: prediction.predictedStart, daysUntilNextPeriod: prediction.daysUntilNextPeriod }
        }, { status: 201 });
    }

    return NextResponse.json({ cycleLog: newCycle }, { status: 201 });
  } catch (error) {
    console.error('[cycles/log] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
