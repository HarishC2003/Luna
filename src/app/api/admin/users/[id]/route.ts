import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { captureAPIError, trackAdminAction } from '@/lib/monitoring/sentry';
import { logAdminAction } from '@/lib/admin/audit-logger';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    let user;
    const admin = createAdminClient();

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data } = await admin.auth.getUser(token);
      user = data?.user;
    } else {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { id } = await params;
    trackAdminAction(`fetch_user_${id}`, user.id);
    await logAdminAction({ action: 'admin_viewed_user', targetType: 'user', targetId: id, adminId: user.id });

    const [{ data: userProfile }, { data: cycleLogs }, { data: recentAuthLogs }, { data: suspensionHistory }, { data: notifSettings }] = await Promise.all([
      admin.from('profiles').select('*').eq('id', id).maybeSingle(),
      admin.from('cycle_logs').select('cycle_length').eq('user_id', id),
      admin.from('auth_logs').select('*').eq('user_id', id).order('created_at', { ascending: false }).limit(5),
      admin.from('user_suspensions').select('*').eq('user_id', id).order('suspended_at', { ascending: false }),
      admin.from('notification_settings').select('*').eq('user_id', id).maybeSingle()
    ]);

    if (!userProfile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const clData = cycleLogs || [];
    const validLengths = clData.filter(cl => cl.cycle_length).map(cl => cl.cycle_length as number);
    const avgLen = validLengths.length ? Math.round(validLengths.reduce((a, b) => a + b, 0) / validLengths.length) : null;

    return NextResponse.json({
      ...userProfile,
      cycleStats: { count: clData.length, avgCycleLength: avgLen },
      recentAuthLogs: recentAuthLogs || [],
      suspensionHistory: suspensionHistory || [],
      notificationSettings: notifSettings || null
    });
  } catch (error) {
    captureAPIError(error, { route: '/api/admin/users/[id]' });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
