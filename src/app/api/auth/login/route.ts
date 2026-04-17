import { NextResponse } from 'next/server';
import { loginSchema } from '@/lib/validations/auth';
import { loginLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const { success } = await loginLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '900' } });
  }

  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const { email, password } = result.data;
    const supabase = await createClient();

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError || !signInData.user) {
      const adminClient = createAdminClient();
      await adminClient.from('auth_logs').insert({ event_type: 'login', ip_address: ip, success: false, metadata: { reason: 'Invalid credentials', email } });
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const userId = signInData.user.id;
    const adminClient = createAdminClient();

    const { data: profile } = await adminClient.from('profiles').select('id, email, display_name, role, email_verified_at').eq('id', userId).single();

    if (!profile?.email_verified_at) {
      await adminClient.from('auth_logs').insert({ user_id: userId, event_type: 'login', ip_address: ip, success: false, metadata: { reason: 'Email not verified' } });
      // Important to sign out because the SSR client just generated valid session cookies!
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'Please verify your email address' }, { status: 403 });
    }

    await adminClient.from('auth_logs').insert({ user_id: userId, event_type: 'login', ip_address: ip, success: true });

    return NextResponse.json({
      user: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role,
      },
      session: {
        accessToken: signInData.session.access_token,
        expiresAt: signInData.session.expires_at,
      }
    }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
