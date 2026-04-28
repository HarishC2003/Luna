import { NextResponse } from 'next/server';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { passwordLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken, hashToken } from '@/lib/auth/password';
import { sendEmail } from '@/lib/email/client';
import { passwordResetEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const { success } = await passwordLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '3600' } });
  }

  try {
    const body = await request.json();
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const { email } = result.data;
    const supabase = createAdminClient();

    const { data: user } = await supabase.from('profiles').select('id, display_name').eq('email', email).single();

    if (user) {
      const token = generateSecureToken();
      const hashed = hashToken(token);
      
      await supabase.from('password_reset_tokens').insert({
        user_id: user.id,
        token_hash: hashed,
      });

      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: email,
        subject: 'Reset your Luna password',
        html: passwordResetEmail({ displayName: user.display_name || 'there', resetUrl }),
        text: `Reset your password at: ${resetUrl}`
      });
      
      await supabase.from('auth_logs').insert({ user_id: user.id, event_type: 'forgot_password', ip_address: ip, success: true });
    } else {
      await supabase.from('auth_logs').insert({ event_type: 'forgot_password', ip_address: ip, success: false, metadata: { reason: 'User not found', email } });
    }

    // Always return 200
    return NextResponse.json({ message: 'If that email exists, we sent a link to reset your password' }, { status: 200 });

  } catch (error) {
    console.error('[forgot-password] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
