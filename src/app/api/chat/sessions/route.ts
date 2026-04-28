import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';

// GET /api/chat/sessions — list user's sessions
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('chat_sessions')
      .select('id, title, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return NextResponse.json({ sessions: data || [] });
  } catch (err: unknown) {
    console.error('[chat/sessions GET]', err);
    return NextResponse.json({ error: 'Failed to load sessions' }, { status: 500 });
  }
}

// POST /api/chat/sessions — create a new session
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await request.json().catch(() => ({}));
    const title = typeof body.title === 'string' && body.title.trim()
      ? body.title.trim().slice(0, 80)
      : 'New Chat';

    const admin = createAdminClient();
    const { data, error } = await admin
      .from('chat_sessions')
      .insert({ user_id: user.id, title })
      .select('id, title, created_at, updated_at')
      .single();

    if (error) throw error;
    return NextResponse.json({ session: data }, { status: 201 });
  } catch (err: unknown) {
    console.error('[chat/sessions POST]', err);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

// DELETE /api/chat/sessions?id=xxx — delete a session
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(request.url);
    const sessionId = url.searchParams.get('id');
    if (!sessionId) return NextResponse.json({ error: 'Missing session id' }, { status: 400 });

    const admin = createAdminClient();

    // Verify ownership
    const { data: session } = await admin
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Delete cascades to messages
    const { error } = await admin.from('chat_sessions').delete().eq('id', sessionId);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('[chat/sessions DELETE]', err);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
