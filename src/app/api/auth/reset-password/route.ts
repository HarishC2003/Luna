import { NextResponse } from 'next/server';
import { resetPasswordSchema } from '@/lib/validations/auth';
import { passwordLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { hashToken } from '@/lib/auth/password';

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const { success } = await passwordLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '3600' } });
  }

  try {
    const body = await request.json();
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const { token, newPassword } = result.data;
    const hashed = hashToken(token);
    const supabase = createAdminClient();

    const { data: tokenRecord } = await supabase
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', hashed)
      .single();

    if (!tokenRecord || tokenRecord.used_at || new Date(tokenRecord.expires_at) < new Date()) {
      await supabase.from('auth_logs').insert({ event_type: 'reset_password', ip_address: ip, success: false, metadata: { reason: 'Invalid or expired token' } });
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const userId = tokenRecord.user_id;

    // Supabase auth update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });
    
    if (updateError) {
      await supabase.from('auth_logs').insert({ user_id: userId, event_type: 'reset_password', ip_address: ip, success: false, metadata: { reason: updateError.message } });
      return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
    
    // Mark token used
    await supabase.from('password_reset_tokens').update({ used_at: new Date().toISOString() }).eq('id', tokenRecord.id);

    await supabase.from('auth_logs').insert({ user_id: userId, event_type: 'reset_password', ip_address: ip, success: true });

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
