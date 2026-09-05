import { NextResponse } from 'next/server';
import { z } from 'zod';
import { registerLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken, hashToken } from '@/lib/auth/password';
import { sendEmail } from '@/lib/email/gmail-sender';
import { verificationEmail } from '@/lib/email/templates';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const { success } = await registerLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '3600' } });
  }

  try {
    const body = await request.json();
    const result = resendSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const { email } = result.data;
    const supabase = createAdminClient();

    // Look up user by email in auth.users
    const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError || !usersData || !usersData.users) {
      console.error('[resend-verification] Error listing users:', usersError);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const user = usersData.users.find(u => u.email === email);

    if (!user) {
      return NextResponse.json({ error: 'Please register first.' }, { status: 404 });
    }

    if (user.email_confirmed_at) {
      return NextResponse.json({ error: 'Email is already verified. You can log in.' }, { status: 400 });
    }

    // Get display name from profiles
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
    const displayName = profile?.display_name || 'User';

    // Generate new token
    const token = generateSecureToken();
    const hashed = hashToken(token);
    
    // Invalidate old tokens (optional, but good practice. We can just delete existing tokens for this user)
    await supabase.from('email_verification_tokens').delete().eq('user_id', user.id);

    // Insert new token
    await supabase.from('email_verification_tokens').insert({
      user_id: user.id,
      token_hash: hashed,
    });

    // Send email
    const reqUrl = new URL(request.url);
    const origin = reqUrl.origin;
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
    
    // Fix for Vercel: If env var is mistakenly left as localhost in production, use the actual request origin
    if (appUrl.includes('localhost') && !origin.includes('localhost')) {
      appUrl = origin;
    }

    const verifyUrl = `${appUrl}/verify-email?token=${token}`;
    const { html, text } = verificationEmail({ displayName, verifyUrl });

    try {
      const emailSent = await sendEmail({
        to: email,
        subject: 'Verify your Luna account',
        html,
        text
      });
      
      if (!emailSent) {
        console.error('Email send failed');
      }
    } catch (emailError) {
      console.error('Email send exception:', emailError);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('RESEND VERIFICATION EMAIL (dev mode)');
      console.log('To:', email);
      console.log('Link:', verifyUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    await supabase.from('auth_logs').insert({ user_id: user.id, event_type: 'resend_verification', ip_address: ip, success: true });

    return NextResponse.json({ message: 'Verification email sent' }, { status: 200 });

  } catch (error) {
    console.error('[resend-verification] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
