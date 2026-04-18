import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { logCycleSchema } from '@/lib/validations/cycle';
import { computePrediction } from '@/lib/cycle/predictor';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const admin = createAdminClient();
    const { data: existing, error: existingError } = await admin.from('cycle_logs').select('user_id').eq('id', id).maybeSingle();
    if (!existing || existing.user_id !== user.id) {
      if (existingError) console.error('Existing error:', existingError);
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const result = logCycleSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (result.data.periodStart) updateData.period_start = result.data.periodStart;
    if (result.data.periodEnd !== undefined) updateData.period_end = result.data.periodEnd;
    if (result.data.avgFlow !== undefined) updateData.avg_flow = result.data.avgFlow;
    if (result.data.notes !== undefined) updateData.notes = result.data.notes;

    const { data: updated, error } = await admin.from('cycle_logs').update(updateData).eq('id', id).select().maybeSingle();
    if (error) {
       console.error('Update error:', error);
       return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    // Recompute
    const { data: last6 } = await admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6);
    const { data: onboard } = await admin.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle();

    if (onboard && last6 && last6.length > 0) {
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
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error('[cycles/log/id] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const admin = createAdminClient();
    const { data: existing } = await admin.from('cycle_logs').select('user_id').eq('id', id).maybeSingle();
    
    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    const { error } = await admin.from('cycle_logs').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

    // Recompute predictions
    const { data: last6 } = await admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6);
    const { data: onboard } = await admin.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle();

    if (onboard && last6 && last6.length > 0) {
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
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[cycles/log/id] DELETE Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

