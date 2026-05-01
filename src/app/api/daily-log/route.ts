import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { dailyLogSchema } from '@/lib/validations/cycle';
import { clearUserContextCache } from '@/lib/chat/context-builder';
import { checkAndAwardBadges } from '@/lib/streaks/calculator';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const body = await request.json();
    const result = dailyLogSchema.parse(body);

    const admin = createAdminClient();
    const logDateNormalized = new Date(result.logDate).toISOString().split('T')[0];

    const insertData: Record<string, unknown> = {
        user_id: user.id,
        log_date: logDateNormalized,
        mood: result.mood || null,
        energy: result.energy || null,
        flow: result.flow || null,
        symptoms: result.symptoms || [],
        notes: result.notes || null,
    };
    if (result.waterGlasses !== undefined && result.waterGlasses !== null) insertData.water_glasses = result.waterGlasses;
    if (result.sleep_quality !== undefined && result.sleep_quality !== null) insertData.sleep_quality = result.sleep_quality;
    if (result.stress_level !== undefined && result.stress_level !== null) insertData.stress_level = result.stress_level;
    if (result.exercise !== undefined && result.exercise !== null) insertData.exercise = result.exercise;
    if (result.exercise_type !== undefined && result.exercise_type !== null) insertData.exercise_type = result.exercise_type;
    if (result.slept_well !== undefined && result.slept_well !== null) insertData.slept_well = result.slept_well;
    if (result.hydration_goal !== undefined && result.hydration_goal !== null) insertData.hydration_goal = result.hydration_goal;
    if (result.moved_body !== undefined && result.moved_body !== null) insertData.moved_body = result.moved_body;
    if (result.image_url !== undefined && result.image_url !== null) insertData.image_url = result.image_url;

    // Optional columns from migration 008 — may not exist yet in the DB
    const optionalColumns = [
      'water_glasses', 'sleep_quality', 'stress_level', 'exercise',
      'exercise_type', 'slept_well', 'hydration_goal', 'moved_body', 'image_url'
    ];

    let newLog;
    const { data: firstAttemptData, error } = await admin.from('daily_logs').upsert(
        insertData,
        { onConflict: 'user_id,log_date' }
    ).select().single();

    if (error) {
        // PGRST204 = PostgREST schema-cache miss, 42703 = Postgres undefined_column
        if (error.code === 'PGRST204' || error.code === '42703') {
            console.warn(`[daily-log] Column missing (${error.code}): ${error.message}. Retrying without optional columns.`);
            // Strip every optional column and retry with core fields only
            for (const col of optionalColumns) {
              delete insertData[col];
            }
            const { data: fallbackData, error: fallbackError } = await admin.from('daily_logs').upsert(
                insertData,
                { onConflict: 'user_id,log_date' }
            ).select().single();
            
            if (fallbackError) {
                console.error('[daily-log] Fallback Supabase error:', fallbackError);
                return NextResponse.json({ error: 'Failed to save daily log' }, { status: 500 });
            }
            newLog = fallbackData;
        } else {
            console.error('[daily-log] Supabase error:', error);
            return NextResponse.json({ error: 'Failed to save daily log' }, { status: 500 });
        }
    } else {
        newLog = firstAttemptData;
    }
    
    // Invalidate chat context cache
    clearUserContextCache(user.id);

    // Check for new badges
    let newBadges: string[] = [];
    try {
      newBadges = await checkAndAwardBadges(user.id);
    } catch (e) {
      console.error('[daily-log] badge check failed:', e);
    }

    return NextResponse.json({ dailyLog: newLog, newBadges }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.flatten() }, { status: 400 });
    }
    console.error('[daily-log] Internal server error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');

  if (!startDate || !endDate) {
      return NextResponse.json({ error: 'startDate and endDate required' }, { status: 400 });
  }

  const s = new Date(startDate);
  const e = new Date(endDate);
  if ((e.getTime() - s.getTime()) / (1000*3600*24) > 95) { // 90 days roughly+
      return NextResponse.json({ error: 'max range is 90 days' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: logs } = await admin
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  return NextResponse.json({ logs: logs || [] }, { status: 200 });
}
