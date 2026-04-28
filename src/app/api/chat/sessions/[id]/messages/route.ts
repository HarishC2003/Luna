import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/chat/sessions/[id]/messages — load all messages for a session
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const admin = createAdminClient();

    // Verify ownership
    const { data: session } = await admin
      .from('chat_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const { data: messages, error } = await admin
      .from('chat_messages')
      .select('id, role, content, is_crisis, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;
    return NextResponse.json({ messages: messages || [] });
  } catch (err: unknown) {
    console.error('[chat/sessions/[id]/messages GET]', err);
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
  }
}
