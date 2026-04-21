import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { computePrediction, getPhaseDescription } from '@/lib/cycle/predictor';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const admin = createAdminClient();
  
  const { data: pred } = await admin.from('cycle_predictions').select('*').eq('user_id', user.id).single();
  if (!pred) {
      return NextResponse.json({ prediction: null, message: 'Log your first period to get predictions' }, { status: 200 });
  }

  const { data: last6 } = await admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6);
  const { data: onboard } = await admin.from('onboarding_data').select('*').eq('user_id', user.id).single();

  let fullPrediction = pred;
  if (onboard) {
      const mappedCycles = last6 ? last6.map((c: Record<string, unknown>) => ({
          periodStart: new Date(c.period_start as string),
          periodEnd: c.period_end ? new Date(c.period_end as string) : undefined
      })) : [];
      
      const computed = computePrediction(mappedCycles, {
          avgCycleLength: onboard.avg_cycle_length,
          avgPeriodLength: onboard.avg_period_length,
          lastPeriodStart: last6 && last6.length > 0 ? new Date(last6[0].period_start) : (onboard.last_period_start ? new Date(onboard.last_period_start) : undefined)
      });
      fullPrediction = { ...pred, ...computed };
  }

  return NextResponse.json({ 
      prediction: fullPrediction, 
      currentPhase: fullPrediction.currentPhase || 'unknown', 
      phaseDescription: getPhaseDescription(fullPrediction.currentPhase || 'unknown') 
  }, { status: 200 });
}
