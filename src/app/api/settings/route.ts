import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { notificationSettingsSchema } from '@/lib/validations/settings';

export async function GET(_request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data: settings } = await admin.from('notification_settings').select('*').eq('user_id', user.id).maybeSingle();

    if (settings) return NextResponse.json(settings);

    // Return defaults
    return NextResponse.json({
      email_period_reminder: true,
      email_fertile_window: true,
      email_log_streak: false,
      email_weekly_insights: true,
      email_tips: false,
      push_period_reminder: false,
      push_fertile_window: false,
      push_log_reminder: false,
      notify_hour: 8,
      notify_days_before: 2
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
    const parsed = notificationSettingsSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', fields: parsed.error.flatten() }, { status: 400 });
    }

    const pd = parsed.data;
    const admin = createAdminClient();

    const upsertData: Record<string, unknown> = { user_id: user.id };
    if (pd.email_period_reminder !== undefined) upsertData.email_period_reminder = pd.email_period_reminder;
    if (pd.email_fertile_window !== undefined) upsertData.email_fertile_window = pd.email_fertile_window;
    if (pd.email_log_streak !== undefined) upsertData.email_log_streak = pd.email_log_streak;
    if (pd.email_weekly_insights !== undefined) upsertData.email_weekly_insights = pd.email_weekly_insights;
    if (pd.email_tips !== undefined) upsertData.email_tips = pd.email_tips;
    if (pd.push_period_reminder !== undefined) upsertData.push_period_reminder = pd.push_period_reminder;
    if (pd.push_fertile_window !== undefined) upsertData.push_fertile_window = pd.push_fertile_window;
    if (pd.push_log_reminder !== undefined) upsertData.push_log_reminder = pd.push_log_reminder;
    if (pd.notify_hour !== undefined) upsertData.notify_hour = pd.notify_hour;
    if (pd.notify_days_before !== undefined) upsertData.notify_days_before = pd.notify_days_before;

    const { data, error } = await admin.from('notification_settings').upsert(upsertData, { onConflict: 'user_id' }).select().single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
