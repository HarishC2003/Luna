import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { calculateCurrentStreak, calculateLongestStreak, getBadgeDefinition } from '@/lib/streaks/calculator';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const admin = createAdminClient();
    
    const [currentStreak, longestStreak] = await Promise.all([
      calculateCurrentStreak(user.id),
      calculateLongestStreak(user.id),
    ]);

    const { data: badgeRows } = await admin
      .from('user_badges')
      .select('badge_key, earned_at')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: true });

    const badges = (badgeRows || []).map(row => ({
      ...getBadgeDefinition(row.badge_key),
      earnedAt: row.earned_at,
    }));

    return NextResponse.json({
      currentStreak,
      longestStreak,
      badges,
    });
  } catch (error) {
    console.error('[streak] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
