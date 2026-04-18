import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    const [
      { count: cycleCount },
      { count: dailyCount },
      { count: pushCount },
      { count: chatCount },
      { data: profile },
      { data: deleteReq }
    ] = await Promise.all([
      admin.from('cycle_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('daily_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('push_subscriptions').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('chat_feedback').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
      admin.from('profiles').select('created_at').eq('id', user.id).maybeSingle(),
      admin.from('account_deletion_requests').select('scheduled_deletion_at').eq('user_id', user.id).is('cancelled_at', null).is('completed_at', null).maybeSingle()
    ]);

    // get last auth log active time if possible, else just use profile creation for now
    // Actually we don't have public auth_logs exposed, so leaving lastActiveAt null

    return NextResponse.json({
      cycleLogs: cycleCount || 0,
      dailyLogs: dailyCount || 0,
      pushSubscriptions: pushCount || 0,
      chatFeedback: chatCount || 0,
      accountCreatedAt: profile?.created_at || null,
      lastActiveAt: null,
      storageLocations: {
        cycleData: 'Supabase (encrypted)',
        chatHistory: 'Device only — not stored',
        predictions: 'Supabase (computed)'
      },
      pendingDeletion: !!deleteReq,
      pendingDeletionAt: deleteReq?.scheduled_deletion_at || null
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
