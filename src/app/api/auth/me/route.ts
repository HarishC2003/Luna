import { NextResponse } from 'next/server';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabaseServer = await createClient();
  const { data: { session } } = await supabaseServer.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limiting by user id since they are authenticated
  const { success } = await apiLimiter.limit(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': '60' } });
  }

  try {
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, role, email_verified_at, onboarding_completed')
      .eq('id', session.user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      user: {
        id: profile.id,
        email: profile.email,
        displayName: profile.display_name,
        role: profile.role,
        emailVerifiedAt: profile.email_verified_at,
        onboardingCompleted: profile.onboarding_completed,
      } 
    }, { status: 200 });

  } catch (error) {
    console.error('[me] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
