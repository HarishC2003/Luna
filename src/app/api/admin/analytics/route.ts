import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';

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
    const period = parseInt(searchParams.get('period') || '30');
    if (![7, 14, 30].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - period);
    const cutoffStr = cutoffDate.toISOString();

    const [
      { data: newUsers },
       { data: cycleLogs },
       { data: notifications },
       { data: conditionsData },
       { data: authLogs7d },
       { data: authLogs30d },
       { data: allLengths }
    ] = await Promise.all([
      admin.from('profiles').select('created_at').gte('created_at', cutoffStr),
      admin.from('cycle_logs').select('created_at').gte('created_at', cutoffStr),
      admin.from('notification_log').select('sent_at').gte('sent_at', cutoffStr),
      admin.from('onboarding_data').select('conditions, goals'),
      admin.from('auth_logs').select('user_id').gte('created_at', new Date(Date.now() - 7*24*60*60*1000).toISOString()),
      admin.from('auth_logs').select('user_id').gte('created_at', new Date(Date.now() - 30*24*60*60*1000).toISOString()),
      admin.from('cycle_logs').select('cycle_length')
    ]);

    // Grouping helper
    const groupByDate = (items: Record<string, unknown>[], dateField: string) => {
      const counts: Record<string, number> = {};
      items.forEach(item => {
         const val = item[dateField];
         if (typeof val === 'string') {
           const d = val.split('T')[0];
           counts[d] = (counts[d] || 0) + 1;
         }
      });
      return Object.entries(counts).map(([date, count]) => ({ date, count })).sort((a,b) => a.date.localeCompare(b.date));
    };

    const newUsersPerDay = groupByDate(newUsers || [], 'created_at');
    const cycleLogsPerDay = groupByDate(cycleLogs || [], 'created_at');
    const notificationsPerDay = groupByDate(notifications || [], 'sent_at');

    const conditionsCount: Record<string, number> = {};
    const goalsCount: Record<string, number> = {};
    let totalOnboarded = 0;

    (conditionsData || []).forEach(od => {
      if (od.conditions) {
        od.conditions.forEach((c: string) => conditionsCount[c] = (conditionsCount[c] || 0) + 1);
      }
      if (od.goals) {
        od.goals.forEach((g: string) => goalsCount[g] = (goalsCount[g] || 0) + 1);
      }
      totalOnboarded++;
    });

    const conditionsBreakdown = Object.entries(conditionsCount).map(([label, value]) => ({
      label, value, percentage: totalOnboarded ? Math.round((value / totalOnboarded) * 100) : 0
    }));

    const goalsBreakdown = Object.entries(goalsCount).map(([label, value]) => ({
      label, value, percentage: totalOnboarded ? Math.round((value / totalOnboarded) * 100) : 0
    }));

    const retention7d = new Set((authLogs7d || []).map(a => a.user_id)).size;
    const retention30d = new Set((authLogs30d || []).map(a => a.user_id)).size;

    const lengthDist: Record<string, number> = {};
    (allLengths || []).forEach(l => {
      if (l.cycle_length && l.cycle_length >= 21 && l.cycle_length <= 35) {
        const key = `${l.cycle_length}`;
        lengthDist[key] = (lengthDist[key] || 0) + 1;
      }
    });

    const cycleDistribution = Object.entries(lengthDist).map(([label, value]) => ({ label, value })).sort((a,b) => parseInt(a.label) - parseInt(b.label));

    return NextResponse.json({
      period,
      newUsersPerDay,
      cycleLogsPerDay,
      notificationsPerDay,
      conditionsBreakdown,
      goalsBreakdown,
      retention7d,
      retention30d,
      cycleDistribution
    });
  } catch {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
