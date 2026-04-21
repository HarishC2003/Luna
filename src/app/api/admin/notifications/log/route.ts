import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')));
    const type = searchParams.get('type');
    const channel = searchParams.get('channel');
    const succ = searchParams.get('success');

    let query = admin.from('notification_log').select('*', { count: 'exact' });
    
    if (type) query = query.eq('notification_type', type);
    if (channel) query = query.eq('channel', channel);
    if (succ === 'true') query = query.eq('success', true);
    if (succ === 'false') query = query.eq('success', false);

    query = query.order('sent_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    
    const { data: logs, count } = await query;

    // Calculate overall success rate for the current view
    let successRate = 0;
    if (logs && logs.length > 0) {
      const successes = logs.filter(l => l.success).length;
      successRate = Math.round((successes / logs.length) * 100);
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      successRate
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
