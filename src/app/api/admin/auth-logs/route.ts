import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { z } from 'zod';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const admin = createAdminClient();
    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const { searchParams } = new URL(request.url);
    const schema = z.object({
      page: z.string().optional().transform(v => Math.max(1, parseInt(v || '1'))),
      limit: z.string().optional().transform(v => Math.min(100, Math.max(1, parseInt(v || '50')))),
      eventType: z.string().optional(),
      successParam: z.string().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional()
    });

    const parsed = schema.safeParse(Object.fromEntries(searchParams));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
    const p = parsed.data;

    let query = admin.from('auth_logs').select('*', { count: 'exact' });
    if (p.eventType) query = query.eq('event_type', p.eventType);
    if (p.successParam === 'true') query = query.eq('success', true);
    if (p.successParam === 'false') query = query.eq('success', false);
    if (p.startDate) query = query.gte('created_at', p.startDate);
    if (p.endDate) query = query.lte('created_at', p.endDate);

    query = query.order('created_at', { ascending: false }).range((p.page - 1) * p.limit, p.page * p.limit - 1);
    
    const { data: logs, count } = await query;

    // Suspicious IPs calculation
    const suspiciousIps: string[] = [];
    if (logs) {
      const oneHourAgo = new Date(Date.now() - 60*60*1000).toISOString();
      const recentFails = logs.filter(l => !l.success && l.created_at >= oneHourAgo);
      const ipCounts: Record<string, number> = {};
      recentFails.forEach(l => {
        if (l.ip_address) {
          ipCounts[l.ip_address] = (ipCounts[l.ip_address] || 0) + 1;
        }
      });
      for (const [ip, ct] of Object.entries(ipCounts)) {
        if (ct >= 5) suspiciousIps.push(ip);
      }
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page: p.page,
      suspiciousIps
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
