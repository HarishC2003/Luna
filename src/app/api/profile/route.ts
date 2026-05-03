import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { profileUpdateSchema } from '@/lib/validations/settings';
import { computePrediction } from '@/lib/cycle/predictor';

export async function GET(_request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const [profileRes, onboardRes] = await Promise.all([
      admin.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      admin.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle()
    ]);

    return NextResponse.json({
      displayName: profileRes.data?.display_name || '',
      email: profileRes.data?.email || '',
      dateOfBirth: profileRes.data?.date_of_birth || null,
      avatarUrl: profileRes.data?.avatar_url || null,
      role: profileRes.data?.role || 'user',
      conditions: onboardRes.data?.conditions || [],
      goals: onboardRes.data?.goals || [],
      avgCycleLength: onboardRes.data?.avg_cycle_length || null,
      avgPeriodLength: onboardRes.data?.avg_period_length || null,
      onboardingCompleted: onboardRes.data?.completed || false,
      partner_share_enabled: profileRes.data?.partner_share_enabled || false,
      partner_share_token: profileRes.data?.partner_share_token || null
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await request.json();
    const parsed = profileUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation', fields: parsed.error.flatten() }, { status: 400 });
    }

    const pd = parsed.data;
    const admin = createAdminClient();
    let recompute = false;

    if (pd.displayName || pd.dateOfBirth !== undefined) {
      const updateObj: Record<string, unknown> = {};
      if (pd.displayName) updateObj.display_name = pd.displayName;
      if (pd.dateOfBirth !== undefined) updateObj.date_of_birth = pd.dateOfBirth;
      await admin.from('profiles').update(updateObj).eq('id', user.id);
    }

    if (pd.conditions || pd.goals) {
      const updateObj: Record<string, unknown> = {};
      if (pd.conditions) updateObj.conditions = pd.conditions;
      if (pd.goals) updateObj.goals = pd.goals;
      await admin.from('onboarding_data').update(updateObj).eq('user_id', user.id);
      recompute = true;
    }

    if (recompute) {
      // Recompute predictions
      const { data: last6 } = await admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6);
      const { data: onboard } = await admin.from('onboarding_data').select('*').eq('user_id', user.id).maybeSingle();

      if (onboard && last6 && last6.length > 0) {
          const mappedCycles = last6.map(c => ({
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
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
