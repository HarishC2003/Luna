import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { dailyLogSchema } from '@/lib/validations/cycle';
import { clearUserContextCache } from '@/lib/chat/context-builder';
import { checkAndAwardBadges } from '@/lib/streaks/calculator';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const body = await request.json();
    const result = dailyLogSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: 'Validation failed', fields: result.error.flatten() }, { status: 400 });
    }

    const admin = createAdminClient();
    
    // Ensure the log belongs to the user
    const { data: existing } = await admin
      .from('daily_logs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    const { data: updatedLog, error } = await admin
      .from('daily_logs')
      .update({
        mood: result.data.mood || null,
        energy: result.data.energy || null,
        flow: result.data.flow || null,
        symptoms: result.data.symptoms || [],
        notes: result.data.notes || null,
        water_glasses: result.data.waterGlasses ?? 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    clearUserContextCache(user.id);
    const newBadges = await checkAndAwardBadges(user.id);

    return NextResponse.json({ dailyLog: updatedLog, newBadges }, { status: 200 });
  } catch (error) {
    console.error('[history-put] error:', error);
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  
  try {
    // Ensure the log belongs to the user
    const { data: existing } = await admin
      .from('daily_logs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    const { error } = await admin
      .from('daily_logs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    clearUserContextCache(user.id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[history-delete] error:', error);
    return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
  }
}
