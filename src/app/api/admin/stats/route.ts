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

    trackAdminAction('fetch_stats', user.id);

    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString();
    
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekStr = weekAgo.toISOString();

    const [
      { count: totalUsers },
      { count: newUsersToday },
      { data: activeThisWeek },
      { count: totalCycleLogs },
      { count: totalDailyLogs },
      { count: notifsToday },
      { count: chatFeedback },
      { count: crisisCount },
      { count: pendingDel },
      { count: suspUsers }
    ] = await Promise.all([
      admin.from('profiles').select('*', { count: 'exact', head: true }),
      admin.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', todayStr),
      admin.from('auth_logs').select('user_id').gte('created_at', weekStr),
      admin.from('cycle_logs').select('*', { count: 'exact', head: true }),
      admin.from('daily_logs').select('*', { count: 'exact', head: true }),
      admin.from('notification_log').select('*', { count: 'exact', head: true }).gte('sent_at', todayStr),
      admin.from('chat_feedback').select('*', { count: 'exact', head: true }),
      admin.from('chat_abuse_log').select('*', { count: 'exact', head: true }).eq('reason', 'crisis_detected'),
      admin.from('account_deletion_requests').select('*', { count: 'exact', head: true }).is('completed_at', null).is('cancelled_at', null),
      admin.from('user_suspensions').select('*', { count: 'exact', head: true }).is('lifted_at', null),
    ]);

    const uniqueActiveUsers = new Set((activeThisWeek || []).map(r => r.user_id)).size;

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      newUsersToday: newUsersToday || 0,
      activeThisWeek: uniqueActiveUsers,
      totalCycleLogs: totalCycleLogs || 0,
      totalDailyLogs: totalDailyLogs || 0,
      notificationsSentToday: notifsToday || 0,
      chatFeedbackCount: chatFeedback || 0,
      crisisDetectedTotal: crisisCount || 0,
      pendingDeletions: pendingDel || 0,
      suspendedUsers: suspUsers || 0
    });
  } catch (error) {
    captureAPIError(error, { route: '/api/admin/stats' });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
