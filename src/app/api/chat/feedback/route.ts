import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { apiLimiter, getRealIP } from '@/lib/rate-limit/limiter';

const feedbackSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.union([z.literal(1), z.literal(-1)])
});

export async function POST(request: Request) {
  try {
    const rateLimit = await apiLimiter.limit(getRealIP(request));
    if (!rateLimit.success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const body = await request.json();
    const result = feedbackSchema.safeParse(body);
    if (!result.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const { sessionId, rating } = result.data;

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
             try {
                cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
             } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: prediction } = await supabase
       .from('cycle_predictions')
       .select('current_phase')
       .eq('user_id', user.id)
       .order('created_at', { ascending: false })
       .limit(1)
       .maybeSingle();

    const phase = prediction?.current_phase || 'unknown';

    await supabase.from('chat_feedback').upsert({
       user_id: user.id,
       session_id: sessionId,
       rating: rating,
       phase: phase
    }, { onConflict: 'user_id, session_id' });

    return NextResponse.json({ message: 'Thank you for your feedback' });
  } catch (error) {
    console.error('Feedback Error:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
