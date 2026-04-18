import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { setFeatureFlag, FeatureFlagKey } from '@/lib/feature-flags';
const logger = console;

export async function PATCH(request: Request, { params }: { params: Promise<{ key: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { key } = await params;
    const { enabled } = await request.json();

    const allowedKeys: FeatureFlagKey[] = [
      'ai_chat_enabled', 'new_registrations_open', 'push_notifications_active',
      'maintenance_mode', 'data_export_enabled', 'cycle_predictions_enabled'
    ];
    
    if (!allowedKeys.includes(key as FeatureFlagKey)) {
      return NextResponse.json({ error: 'Invalid flag key' }, { status: 400 });
    }

    if (key === 'maintenance_mode' && enabled) {
      logger.warn({ msg: `Maintenance mode activated by admin ${user.id}`, adminId: user.id });
    }

    await setFeatureFlag(key as FeatureFlagKey, enabled, user.id);

    return NextResponse.json({ key, enabled });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
