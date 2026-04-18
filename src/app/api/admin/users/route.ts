import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { captureAPIError, trackAdminAction } from '@/lib/monitoring/sentry';

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

    trackAdminAction('fetch_users_list', user.id);

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') === 'asc' ? true : false;
    
    let query = admin.from('profiles').select('*', { count: 'exact' });
    if (search) {
      query = query.ilike('email', `${search}%`);
    }
    
    query = query.order(sort as any, { ascending: order }).range((page - 1) * limit, page * limit - 1);
    
    const { data: users, count, error } = await query;
    if (error) throw error;

    // Fetch relational data for the found users
    const userIds = users?.map(u => u.id) || [];
    let cycleLogs: any[] = [];
    let authLogs: any[] = [];
    let suspensions: any[] = [];
    
    if (userIds.length > 0) {
      const [{ data: cl }, { data: al }, { data: susp }] = await Promise.all([
        admin.from('cycle_logs').select('user_id').in('user_id', userIds),
        admin.from('auth_logs').select('user_id, created_at').in('user_id', userIds).order('created_at', { ascending: false }),
        admin.from('user_suspensions').select('user_id').in('user_id', userIds).is('lifted_at', null)
      ]);
      cycleLogs = cl || [];
      authLogs = al || [];
      suspensions = susp || [];
    }

    const enhancedUsers = (users || []).map(u => {
      return {
        id: u.id,
        email: u.email,
        display_name: u.display_name,
        role: u.role,
        email_verified_at: u.email_verified_at,
        created_at: u.created_at,
        onboarding_completed: u.onboarding_completed,
        cycle_log_count: cycleLogs.filter(cl => cl.user_id === u.id).length,
        last_active: authLogs.find(al => al.user_id === u.id)?.created_at || null,
        is_suspended: suspensions.some(s => s.user_id === u.id)
      };
    });

    return NextResponse.json({
      users: enhancedUsers,
      total: count || 0,
      page,
      totalPages: count ? Math.ceil(count / limit) : 0
    });
  } catch (error) {
    captureAPIError(error, { route: '/api/admin/users' });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
