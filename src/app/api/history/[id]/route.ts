import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { dailyLogSchema } from '@/lib/validations/cycle';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params;

  // 1. Validate id as UUID
  const uuidSchema = z.string().uuid();
  const idResult = uuidSchema.safeParse(id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
  }

  // 2. Authenticate
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3. Rate limit
  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  // 4. Parse and validate body
  const body = await request.json();
  const partialSchema = dailyLogSchema.partial();
  const result = partialSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: 'Validation failed', details: result.error.flatten() }, { status: 400 });
  }

  // 5. Ownership check — fetch before update
  const adminSupabase = createAdminClient();
  const { data: existing, error: fetchError } = await adminSupabase
    .from('daily_logs')
    .select('user_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Log not found' }, { status: 404 });
  }
  if (existing.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 6. Build update object — only fields present in body
  const updateData: Record<string, unknown> = {};
  if (result.data.mood !== undefined) updateData.mood = result.data.mood;
  if (result.data.energy !== undefined) updateData.energy = result.data.energy;
  if (result.data.flow !== undefined) updateData.flow = result.data.flow;
  if (result.data.symptoms !== undefined) updateData.symptoms = result.data.symptoms;
  if (result.data.notes !== undefined) updateData.notes = result.data.notes;
  if (result.data.waterGlasses !== undefined && result.data.waterGlasses !== null) updateData.water_glasses = result.data.waterGlasses;
  if (result.data.sleep_quality !== undefined && result.data.sleep_quality !== null) updateData.sleep_quality = result.data.sleep_quality;
  if (result.data.stress_level !== undefined && result.data.stress_level !== null) updateData.stress_level = result.data.stress_level;
  if (result.data.exercise !== undefined && result.data.exercise !== null) updateData.exercise = result.data.exercise;
  if (result.data.exercise_type !== undefined && result.data.exercise_type !== null) updateData.exercise_type = result.data.exercise_type;
  if (result.data.slept_well !== undefined && result.data.slept_well !== null) updateData.slept_well = result.data.slept_well;
  if (result.data.hydration_goal !== undefined && result.data.hydration_goal !== null) updateData.hydration_goal = result.data.hydration_goal;
  if (result.data.moved_body !== undefined && result.data.moved_body !== null) updateData.moved_body = result.data.moved_body;
  if (result.data.image_url !== undefined && result.data.image_url !== null) updateData.image_url = result.data.image_url;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // 7. Update
  const optionalColumns = [
    'water_glasses', 'sleep_quality', 'stress_level', 'exercise',
    'exercise_type', 'slept_well', 'hydration_goal', 'moved_body', 'image_url'
  ];

  let { data: updated, error: updateError } = await adminSupabase
    .from('daily_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError && updateError.message?.includes('column')) {
    const safeData = { ...updateData };
    optionalColumns.forEach(c => delete safeData[c]);
    const retry = await adminSupabase
      .from('daily_logs')
      .update(safeData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();
    updated = retry.data;
    updateError = retry.error;
  }

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }

  return NextResponse.json({ dailyLog: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  try {
    const { id } = await params;

    // 1. Validate UUID
    const uuidSchema = z.string().uuid();
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // 2. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Rate limit
    const { success } = await apiLimiter.limit(user.id);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    // 4. Ownership check — verify the log belongs to this user
    const adminSupabase = createAdminClient();
    const { data: existing, error: fetchError } = await adminSupabase
      .from('daily_logs')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Log not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 5. Delete
    const { error: deleteError } = await adminSupabase
      .from('daily_logs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete log' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Log deleted', id });
  } catch (error) {
    console.error('DELETE /api/history/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
