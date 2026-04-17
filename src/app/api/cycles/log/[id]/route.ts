import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { logCycleSchema } from '@/lib/validations/cycle';
import { computePrediction } from '@/lib/cycle/predictor';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const admin = createAdminClient();
    const { data: existing } = await admin.from('cycle_logs').select('user_id').eq('id', id).single();
    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = logCycleSchema.partial().safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const updateData: any = {};
    if (result.data.periodStart) updateData.period_start = result.data.periodStart;
    if (result.data.periodEnd !== undefined) updateData.period_end = result.data.periodEnd;
    if (result.data.avgFlow !== undefined) updateData.avg_flow = result.data.avgFlow;
    if (result.data.notes !== undefined) updateData.notes = result.data.notes;

    const { data: updated, error } = await admin.from('cycle_logs').update(updateData).eq('id', id).select().single();
    if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

    // Recompute
    const { data: last6 } = await admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6);
    const { data: onboard } = await admin.from('onboarding_data').select('*').eq('user_id', user.id).single();

    if (onboard && last6) {
        const mappedCycles = last6.map((c: any) => ({
            periodStart: new Date(c.period_start),
            periodEnd: c.period_end ? new Date(c.period_end) : undefined,
            cycleLength: c.cycle_length || undefined
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
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
