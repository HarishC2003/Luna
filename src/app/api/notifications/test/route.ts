import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPushNotification } from '@/lib/notifications/sender';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Special rate limit for test notifications
let redis: Redis | null = null;
if (process.env.UPSTASH_REDIS_REST_URL) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });
}

export const testPushLimiter = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '1 h'),
  analytics: false,
}) : { limit: async () => ({ success: true }) };

export async function POST(_request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await testPushLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests. Allow 1 test per hour.' }, { status: 429 });

    const result = await sendPushNotification(user.id, 'test_notification', {
      title: 'Luna test',
      body: 'Push notifications are working!',
      url: '/dashboard'
    });

    return NextResponse.json({ sent: result ? 1 : 0 });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
