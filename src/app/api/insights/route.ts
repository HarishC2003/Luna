import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { generateInsights } from '@/lib/cycle/insights';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const admin = createAdminClient();
  
  const [cyclesRes, logsRes] = await Promise.all([
      admin.from('cycle_logs').select('*').eq('user_id', user.id).order('period_start', { ascending: false }).limit(6),
      admin.from('daily_logs').select('*').eq('user_id', user.id).order('log_date', { ascending: false }).limit(90)
  ]);

  const insights = generateInsights(cyclesRes.data || [], logsRes.data || []);

  return NextResponse.json({ insights, generatedAt: new Date().toISOString() }, { status: 200 });
}
