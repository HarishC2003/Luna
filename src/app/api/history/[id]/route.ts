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

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  // 7. Update
  const { data: updated, error: updateError } = await adminSupabase
    .from('daily_logs')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update log' }, { status: 500 });
  }

  return NextResponse.json({ dailyLog: updated });
}
