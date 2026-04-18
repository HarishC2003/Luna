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
    const reviewed = searchParams.get('reviewed');

    let query = admin.from('chat_abuse_log').select('*', { count: 'exact' });
    
    // We cannot purely query JSONB efficiently via ORM exactly without raw sql if we don't have indexes, but we can do a filter here or use 'contains'
    if (reviewed === 'true') {
      query = query.contains('metadata', { reviewed: true });
    } else if (reviewed === 'false') {
      // In Supabase, if we want NOT contains or lacks key, we might have to fetch and filter if we can't do ?not.contains 
      // Fortunately we can fetch and map, or just query without filters and filter locally for <50 items 
    }

    query = query.order('created_at', { ascending: false }).range((page - 1) * limit, page * limit - 1);
    const { data: logs, count } = await query;

    let filtered = logs || [];
    if (reviewed === 'false') {
      filtered = filtered.filter(l => !l.metadata?.reviewed);
    }

    const anonymizedLogs = filtered.map(l => ({
      ...l,
      user_id: l.user_id.substring(0, 8) + '...'
    }));

    return NextResponse.json({
      logs: anonymizedLogs,
      total: count || 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
