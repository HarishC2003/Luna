import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';

export async function GET(_request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    // Ensure we fetch from DB directly for full details instead of just the cached map
    const { data: flags } = await admin.from('feature_flags').select(`
      key, enabled, description, updated_at,
      profiles ( email )
    `).order('key');

    const mapped = (flags || []).map(f => ({
      key: f.key,
      enabled: f.enabled,
      description: f.description,
      updated_at: f.updated_at,
      updated_by_email: f.profiles ? (f.profiles as unknown as { email: string }).email : 'System'
    }));

    return NextResponse.json(mapped);
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
