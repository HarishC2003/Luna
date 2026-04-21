import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { logAdminAction } from '@/lib/admin/audit-logger';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
       return NextResponse.json({ error: 'Cannot suspend yourself' }, { status: 400 });
    }

    const { reason, action } = await request.json();
    if (action !== 'suspend' && action !== 'lift') return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    if (action === 'suspend') {
      if (!reason || reason.length < 10 || reason.length > 500) {
        return NextResponse.json({ error: 'Reason must be between 10 and 500 characters' }, { status: 400 });
      }
      const { error } = await admin.from('user_suspensions').insert({ user_id: id, suspended_by: user.id, reason });
      if (error) throw error;
      
      // Invalidate session
      await admin.auth.admin.signOut(id, 'global');
      
      await logAdminAction({ adminId: user.id, action: 'user_suspended', targetType: 'user', targetId: id, metadata: { reason } });
      return NextResponse.json({ message: 'User suspended' });
    } else {
      const { error } = await admin.from('user_suspensions').update({ lifted_at: new Date().toISOString(), lifted_by: user.id }).eq('user_id', id).is('lifted_at', null);
      if (error) throw error;

      await logAdminAction({ adminId: user.id, action: 'user_suspension_lifted', targetType: 'user', targetId: id, metadata: { reason } });
      return NextResponse.json({ message: 'Suspension lifted' });
    }
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
