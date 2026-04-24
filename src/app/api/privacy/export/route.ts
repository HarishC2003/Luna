import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { generateUserDataExport } from '@/lib/privacy/data-export';

export async function POST(_request: Request) {
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

    const exportJson = await generateUserDataExport(user.id);

    await admin.from('data_export_requests').insert({
      user_id: user.id,
      status: 'ready',
      download_url: 'direct_download',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return new Response(exportJson, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="luna-privacy-export.json"'
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Export Error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: message }, { status: 500 });
  }
}
