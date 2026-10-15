import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { userFeedbackSchema } from '@/lib/validations/feedback';

export async function POST(request: Request) {
  const ip = getRealIP(request);
  const authHeader = request.headers.get('authorization');
  let user: any = null;
  const admin = createAdminClient();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data } = await admin.auth.getUser(token);
    user = data?.user;
  } else {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } catch {
      // Unauthenticated tester
    }
  }

  // Rate limit by user id or ip
  const rateLimitKey = user ? `feedback:${user.id}` : `feedback:ip:${ip}`;
  const { success } = await apiLimiter.limit(rateLimitKey);
  if (!success) {
    return NextResponse.json({ error: 'Too many submissions. Please wait before submitting again.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const validated = userFeedbackSchema.parse(body);

    const feedbackPayload = {
      user_id: user?.id || null,
      platform: validated.platform,
      test_duration: validated.test_duration,
      features_tested: validated.features_tested,
      ease_of_use: validated.ease_of_use,
      design_rating: validated.design_rating,
      clarity: validated.clarity,
      confusing_aspects: validated.confusing_aspects || null,
      energy_sleep_rating: validated.energy_sleep_rating,
      bugs_encountered: validated.bugs_encountered || null,
      notifications_working: validated.notifications_working,
      liked_most: validated.liked_most || null,
      improve_first: validated.improve_first || null,
      future_features: validated.future_features || null,
      additional_suggestions: validated.additional_suggestions || null,
    };

    const { data, error } = await admin
      .from('user_feedback')
      .insert(feedbackPayload)
      .select('id, created_at')
      .single();

    if (error) {
      console.warn('[feedback] user_feedback table insert error:', error.message);
      // Resilient fallback if table does not exist yet: store in admin_audit_log
      if (error.code === '42P01' || error.message?.includes('user_feedback') || error.code === 'PGRST204') {
        const fallbackRes = await admin.from('admin_audit_log').insert({
          admin_id: user?.id || null,
          action: 'user_feedback_submission',
          target_type: 'user_feedback',
          target_id: user?.id || 'anonymous_tester',
          metadata: feedbackPayload,
          ip_address: ip,
        });
        if (fallbackRes.error) {
          console.error('[feedback] Fallback audit log insert failed:', fallbackRes.error);
        }
        return NextResponse.json({
          success: true,
          message: 'Thank you! Your feedback has been recorded.',
        }, { status: 201 });
      }

      return NextResponse.json({ error: 'Failed to record feedback' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your feedback has been recorded.',
      id: data?.id,
    }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      const messages = err.issues.map((issue) => issue.message).join(', ');
      return NextResponse.json({ error: messages }, { status: 400 });
    }
    console.error('[feedback] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  let user: any = null;
  const admin = createAdminClient();

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data } = await admin.auth.getUser(token);
    user = data?.user;
  } else {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    } catch {
      // Unauthenticated
    }
  }

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: feedback, error } = await admin
    .from('user_feedback')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  let feedbackItems = feedback || [];
  if (error) {
    // Check fallback in audit log if table not present
    if (error.code === '42P01' || error.message?.includes('user_feedback')) {
      const { data: fallbackLogs } = await admin
        .from('admin_audit_log')
        .select('*')
        .eq('action', 'user_feedback_submission')
        .order('created_at', { ascending: false })
        .limit(100);

      feedbackItems = (fallbackLogs || []).map((l: any) => ({
        id: l.id,
        user_id: l.admin_id,
        created_at: l.created_at,
        ...(l.metadata || {}),
      }));
    } else {
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }
  }

  // Enrich with user profile info (email, display name)
  const userIds = Array.from(new Set(feedbackItems.map((f: any) => f.user_id).filter(Boolean)));
  let profileMap: Record<string, { email?: string; display_name?: string }> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email, display_name')
      .in('id', userIds);

    if (profiles) {
      for (const p of profiles) {
        profileMap[p.id] = { email: p.email, display_name: p.display_name };
      }
    }
  }

  const enriched = feedbackItems.map((item: any) => ({
    ...item,
    user_email: item.user_id ? profileMap[item.user_id]?.email || null : null,
    user_name: item.user_id ? profileMap[item.user_id]?.display_name || null : null,
  }));

  return NextResponse.json({ feedback: enriched });
}
