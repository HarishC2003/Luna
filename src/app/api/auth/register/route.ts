import { NextResponse } from 'next/server';
import { registerSchema } from '@/lib/validations/auth';
import { registerLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureToken, hashToken } from '@/lib/auth/password';
import { sendEmail } from '@/lib/email/client';
import { verificationEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const { success } = await registerLimiter.limit(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '3600' } });
  }

  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const { email, password, displayName } = result.data;
    const supabase = createAdminClient();

    // Check existing email
    const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).single();
    if (existingUser) {
      // Log event
      await supabase.from('auth_logs').insert({ event_type: 'register', ip_address: ip, success: false, metadata: { reason: 'Email already exists' } });
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }

    // Create user in Supabase auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // We handle verification manually
      user_metadata: { display_name: displayName }
    });

    if (authError || !authData.user) {
      await supabase.from('auth_logs').insert({ event_type: 'register', ip_address: ip, success: false, metadata: { reason: authError?.message } });
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const userId = authData.user.id;

    // Create profile
    await supabase.from('profiles').insert({
      id: userId,
      email,
      display_name: displayName,
      role: 'user',
    });

    // Verification token
    const token = generateSecureToken();
    const hashed = hashToken(token);
    
    await supabase.from('email_verification_tokens').insert({
      user_id: userId,
      token_hash: hashed,
    });

    // Send email
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${token}`;
    const { html, text } = verificationEmail({ displayName, verifyUrl });

    try {
      const result = await sendEmail({
        to: email,
        subject: 'Verify your Luna account',
        html,
        text
      });
      console.log('Email send result:', result);
      
      if (!result.success) {
        console.error('Email send failed:', result.error);
        // We still return 201 so the user gets created, but they might need to use the terminal link to verify
      }
    } catch (emailError) {
      console.error('Email send exception:', emailError);
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('VERIFICATION EMAIL (dev mode)');
      console.log('To:', email);
      console.log('Link:', verifyUrl);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    await supabase.from('auth_logs').insert({ user_id: userId, event_type: 'register', ip_address: ip, success: true });

    return NextResponse.json({ message: 'Check your email to verify your account' }, { status: 201 });

  } catch (error) {
    console.error('[register] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
