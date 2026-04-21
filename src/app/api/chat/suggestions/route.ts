import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSuggestedQuestions } from '@/lib/chat/suggestions';
import { apiLimiter, getRealIP } from '@/lib/rate-limit/limiter';
import { buildUserHealthContext } from '@/lib/chat/context-builder';

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

    const ctx = await buildUserHealthContext(user.id);
    const suggestions = getSuggestedQuestions(ctx);

    const loggedToday = ctx.recentSymptoms.some(s => s.daysAgo === 0) || 
                        ctx.recentMoods.some(m => {
                          const logDate = new Date(m.date);
                          logDate.setHours(0,0,0,0);
                          const today = new Date();
                          today.setHours(0,0,0,0);
                          return logDate.getTime() === today.getTime();
                        });

    let contextPill = `Day ${ctx.today.dayOfCycle || '?'} · ${ctx.today.phase.charAt(0).toUpperCase() + ctx.today.phase.slice(1)}`;
    const todaySymptom = ctx.recentSymptoms.find(s => s.daysAgo === 0);
    if (todaySymptom) {
      contextPill += ` · ${todaySymptom.symptom}`;
    }

    return NextResponse.json({ suggestions, contextPill, loggedToday }, {
      headers: {
        'Cache-Control': 'private, max-age=300'
      }
    });

  } catch (error) {
    console.error('Suggestions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
