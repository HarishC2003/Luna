import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const { success } = await apiLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  try {
    const authHeader = request.headers.get('authorization');
    let user;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const admin = createAdminClient();
      const token = authHeader.split(' ')[1];
      const { data } = await admin.auth.getUser(token);
      user = data?.user;
    } else {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await request.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    // We use ON CONFLICT to avoid duplicate entries.
    // Supabase JS insert doesn't directly support on_conflict well without an upsert on unique constraint.
    const { error } = await adminClient.from('push_tokens').upsert(
      { user_id: user.id, token, last_used_at: new Date().toISOString() },
      { onConflict: 'user_id, token' }
    );

    if (error) {
      console.error('Error saving push token:', error);
      return NextResponse.json({ error: 'Failed to save token' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('Push token registration error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
