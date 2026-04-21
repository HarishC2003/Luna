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
    if (id === user.id) {
       return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const { role } = await request.json();
    if (role !== 'admin' && role !== 'user') return NextResponse.json({ error: 'Invalid role' }, { status: 400 });

    const { error } = await admin.from('profiles').update({ role }).eq('id', id);
    if (error) throw error;

    await logAdminAction({
      adminId: user.id,
      action: 'user_role_change',
      targetType: 'user',
      targetId: id,
      metadata: { newRole: role }
    });

    return NextResponse.json({ message: 'Role updated' });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
