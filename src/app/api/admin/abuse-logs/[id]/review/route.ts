import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { logAdminAction } from '@/lib/admin/audit-logger';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { id } = await params;
    const { action, notes } = await request.json();

    if (action !== 'reviewed' && action !== 'escalated') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (notes && notes.length > 300) {
      return NextResponse.json({ error: 'Notes too long' }, { status: 400 });
    }

    const { data: existing } = await admin.from('chat_abuse_log').select('metadata').eq('id', id).maybeSingle();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updatedMetadata = {
      ...existing.metadata,
      reviewed: true,
      reviewedBy: user.id,
      reviewedAt: new Date().toISOString(),
      action,
      notes: notes || null
    };

    const { error } = await admin.from('chat_abuse_log').update({ metadata: updatedMetadata }).eq('id', id);
    if (error) throw error;

    await logAdminAction({
      adminId: user.id,
      action: action === 'escalated' ? 'abuse_log_escalated' : 'abuse_log_reviewed',
      targetType: 'abuse_log',
      targetId: id
    });

    return NextResponse.json({ message: 'Reviewed successfully' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
