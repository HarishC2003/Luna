import { NextResponse } from 'next/server';
import { verifyEmailSchema } from '@/lib/validations/auth';
import { apiLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/auth/password';

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const { success } = await apiLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const body = await request.json();
    const result = verifyEmailSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const { token } = result.data;
    const hashed = hashToken(token);
    const supabase = createAdminClient();

    const { data: tokenRecord } = await supabase
      .from('email_verification_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', hashed)
      .single();

    if (!tokenRecord || tokenRecord.used_at || new Date(tokenRecord.expires_at) < new Date()) {
      await supabase.from('auth_logs').insert({ event_type: 'verify_email', ip_address: ip, success: false, metadata: { reason: 'Invalid or expired token' } });
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const userId = tokenRecord.user_id;

    // Update profile
    await supabase.from('profiles').update({ email_verified_at: new Date().toISOString() }).eq('id', userId);
    
    // Mark token used
    await supabase.from('email_verification_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRecord.id);

    await supabase.from('auth_logs').insert({ user_id: userId, event_type: 'verify_email', ip_address: ip, success: true });

    return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
