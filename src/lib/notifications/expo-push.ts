import { createAdminClient } from '@/lib/supabase/admin';

type ExpoPushMessage = {
  to: string | string[];
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
  badge?: number;
};

export async function sendExpoPushNotification(messages: ExpoPushMessage[]) {
  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    
    if (!response.ok) {
      console.error('Error sending Expo push notification:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send push notification:', error);
  }
}

export async function sendAdminNotification(title: string, body: string, data: Record<string, unknown> = {}) {
  try {
    const adminClient = createAdminClient();
    
    // Get all admin users
    const { data: admins } = await adminClient.from('profiles').select('id').eq('role', 'admin');
    
    if (!admins || admins.length === 0) return;
    
    const adminIds = admins.map(a => a.id);

    // Filter admins by those who have push_admin_alerts enabled
    const { data: adminSettings } = await adminClient
      .from('notification_settings')
      .select('user_id, push_admin_alerts')
      .in('user_id', adminIds);

    const enabledAdminIds = (adminSettings || [])
      .filter(s => s.push_admin_alerts !== false) // default to true if null
      .map(s => s.user_id);

    // If no admins have alerts enabled, return
    if (enabledAdminIds.length === 0) return;
    
    // Get their push tokens
    const { data: tokensData } = await adminClient
      .from('push_tokens')
      .select('token')
      .in('user_id', enabledAdminIds);
      
    if (!tokensData || tokensData.length === 0) return;
    
    const tokens = tokensData.map(t => t.token);
    
    // Construct messages
    const messages: ExpoPushMessage[] = tokens.map(token => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
    }));
    
    await sendExpoPushNotification(messages);
  } catch (error) {
    console.error('Failed to broadcast admin notification:', error);
  }
}
