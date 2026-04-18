import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { createExportDownloadUrl } from '@/lib/privacy/data-export';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const admin = createAdminClient();

    // Check limit: 3 per 24 hours
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const { count } = await admin.from('data_export_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', yesterday.toISOString());

    if (count !== null && count >= 3) {
      return NextResponse.json({ error: 'Export limit reached. Maximum 3 exports per 24 hours.' }, { status: 429 });
    }

    const downloadUrl = await createExportDownloadUrl(user.id);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return NextResponse.json({ downloadUrl, expiresAt });
  } catch (error: any) {
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
