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
    if (pd.emailPeriodReminder !== undefined) upsertData.email_period_reminder = pd.emailPeriodReminder;
    if (pd.emailFertileWindow !== undefined) upsertData.email_fertile_window = pd.emailFertileWindow;
    if (pd.emailLogStreak !== undefined) upsertData.email_log_streak = pd.emailLogStreak;
    if (pd.emailWeeklyInsights !== undefined) upsertData.email_weekly_insights = pd.emailWeeklyInsights;
    if (pd.emailTips !== undefined) upsertData.email_tips = pd.emailTips;
    if (pd.pushPeriodReminder !== undefined) upsertData.push_period_reminder = pd.pushPeriodReminder;
    if (pd.pushFertileWindow !== undefined) upsertData.push_fertile_window = pd.pushFertileWindow;
    if (pd.pushLogReminder !== undefined) upsertData.push_log_reminder = pd.pushLogReminder;
    if (pd.notifyHour !== undefined) upsertData.notify_hour = pd.notifyHour;
    if (pd.notifyDaysBefore !== undefined) upsertData.notify_days_before = pd.notifyDaysBefore;

    const { data, error } = await admin.from('notification_settings').upsert(upsertData, { onConflict: 'user_id' }).select().single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
