import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';


export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const limitStr = searchParams.get('limit') || '12';
  let limit = parseInt(limitStr, 10);
  if (isNaN(limit) || limit < 1 || limit > 24) limit = 12;

  const admin = createAdminClient();
  
  const { data: cycles, count } = await admin
    .from('cycle_logs')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('period_start', { ascending: false })
    .limit(limit);

  return NextResponse.json({ cycles: cycles || [], total: count || 0 }, { status: 200 });
}
