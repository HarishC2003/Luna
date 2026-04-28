import webpush from 'web-push';
import { sendEmail } from '../email/client';
import { createAdminClient } from '../supabase/admin';

if (process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:hello@lunawellness.app',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}


export async function sendEmailNotification(
  userId: string,
  type: string,
  templatePayload: { subject: string; html: string; text: string }
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('email').eq('id', userId).single();
    if (!profile?.email) return false;

    const res = await sendEmail({
      to: profile.email,
      subject: templatePayload.subject,
      html: templatePayload.html,
      text: templatePayload.text,
    });

    if (!res.success) throw new Error(String(res.error));

    await admin.from('notification_log').insert({
      user_id: userId,
      notification_type: type,
      channel: 'email',
      success: true,
    });

    return true;
  } catch (error) {
    console.error('[sendEmailNotification] error:', error);
    const admin = createAdminClient();
    await admin.from('notification_log').insert({
      user_id: userId,
      notification_type: type,
      channel: 'email',
      success: false,
    });
    return false;
  }
}

export async function sendPushNotification(
  userId: string,
  type: string,
  payload: { title: string; body: string; url?: string }
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId);
    if (!subs || subs.length === 0) return false;

    let anySuccess = false;
    const currentEndpoint = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const notificationPayload = JSON.stringify({ ...payload, url: payload.url || currentEndpoint });

    for (const sub of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          notificationPayload
        );
        anySuccess = true;
      } catch (err: unknown) {
        if (err && typeof err === 'object' && 'statusCode' in err) {
          const status = (err as { statusCode: number }).statusCode;
          if (status === 410 || status === 404) {
            // Expired subscription
            await admin.from('push_subscriptions').delete().eq('id', sub.id);
          }
        }
      }
    }

    await admin.from('notification_log').insert({
      user_id: userId,
      notification_type: type,
      channel: 'push',
      success: anySuccess,
    });

    return anySuccess;
  } catch (error) {
    console.error('[sendPushNotification] error:', error);
    const admin = createAdminClient();
    await admin.from('notification_log').insert({
      user_id: userId,
      notification_type: type,
      channel: 'push',
      success: false,
    });
    return false;
  }
}
