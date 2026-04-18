import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSuggestedQuestions } from '@/lib/chat/suggestions';
import { apiLimiter, getRealIP } from '@/lib/rate-limit/limiter';

export async function GET(request: Request) {
  try {
    const rateLimit = await apiLimiter.limit(getRealIP(request));
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: onboarding } = await supabase
      .from('onboarding_data')
      .select('conditions, goals')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: prediction } = await supabase
      .from('cycle_predictions')
      .select('current_phase, days_until_next_period')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const phase = prediction?.current_phase || 'unknown';
    const conditions = onboarding?.conditions || [];
    const daysUntilNext = prediction?.days_until_next_period ?? null;

    const suggestions = getSuggestedQuestions(phase, conditions, daysUntilNext);

    return NextResponse.json({ suggestions }, {
      headers: {
        'Cache-Control': 'private, max-age=300'
      }
    });

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
