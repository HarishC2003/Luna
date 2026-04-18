import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { pushSubscriptionSchema } from '@/lib/validations/settings';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await request.json();
    const parsed = pushSubscriptionSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', fields: parsed.error.flatten() }, { status: 400 });
    }

    const admin = createAdminClient();

    // Ensure notification settings exist
    const { data: settings } = await admin.from('notification_settings').select('id').eq('user_id', user.id).maybeSingle();
    if (!settings) {
      await admin.from('notification_settings').insert({ user_id: user.id });
    }

    await admin.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: parsed.data.endpoint,
      p256dh: parsed.data.p256dh,
      auth_key: parsed.data.auth,
      user_agent: parsed.data.userAgent || null
    }, { onConflict: 'endpoint' });

    return NextResponse.json({ message: 'Push notifications enabled' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
