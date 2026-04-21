import { NextResponse } from 'next/server';
import ReactPDF from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { reportLimiter } from '@/lib/rate-limit/limiter';
import { CycleReportTemplate } from '@/lib/reports/cycle-report';
import { generateInsights } from '@/lib/cycle/insights';
import { calculateCurrentStreak } from '@/lib/streaks/calculator';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 1. Rate Limiting
  const { success } = await reportLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'You have reached the limit of 2 reports per day. Please try again tomorrow.' }, { status: 429 });

  try {
    const { month, year } = await request.json();
    const nowTimestamp = Date.now();
    
    // Validate
    const currentYear = new Date(nowTimestamp).getFullYear();
    if (!month || month < 1 || month > 12) return NextResponse.json({ error: 'Invalid month' }, { status: 400 });
    if (!year || (year !== currentYear && year !== currentYear - 1)) return NextResponse.json({ error: 'Invalid year' }, { status: 400 });

    const admin = createAdminClient();

    // 2. Fetch Data
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(nowTimestamp - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [profileRes, recentCyclesRes, dailyLogsRes, last30LogsRes, onboardRes] = await Promise.all([
      admin.from('profiles').select('display_name, email').eq('id', user.id).single(),
      admin.from('cycle_logs').select('*').eq('user_id', user.id).gte('period_start', startDate).lte('period_start', endDate).order('period_start', { ascending: false }).limit(6),
      admin.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', startDate).lte('log_date', endDate).order('log_date', { ascending: false }),
      admin.from('daily_logs').select('*').eq('user_id', user.id).gte('log_date', thirtyDaysAgo).order('log_date', { ascending: false }),
      admin.from('onboarding_data').select('*').eq('user_id', user.id).single()
    ]);

    const streak = await calculateCurrentStreak(user.id);
    const insightsArr = generateInsights(recentCyclesRes.data || [], last30LogsRes.data || []).slice(0, 5);

    // 3. Compute Stats
    const logs = dailyLogsRes.data || [];
    const symCounts: Record<string, number> = {};
    const moodCounts: Record<string, number> = {};
    
    logs.forEach(l => {
      (l.symptoms || []).forEach((s: string) => symCounts[s] = (symCounts[s] || 0) + 1);
      if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    });

    const topSymptoms = Object.entries(symCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0].replace('_', ' '));
    const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

    const statsData = {
      avgCycleLength: onboardRes.data?.avg_cycle_length || 28,
      avgPeriodLength: onboardRes.data?.avg_period_length || 5,
      topSymptoms,
      topMood,
      streak
    };

    const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

    // 4. Generate PDF
    const template = (
      <CycleReportTemplate 
        userName={profileRes.data?.display_name || user.email || 'User'}
        monthName={monthName}
        year={year}
        generatedAt={new Date(nowTimestamp).toLocaleDateString()}
        cycles={recentCyclesRes.data || []}
        logs={logs.slice(0, 31)}
        stats={statsData}
        insights={insightsArr}
      />
    );
    const pdfBuffer = await ReactPDF.renderToBuffer(template);

    // 5. Upload to Supabase Storage
    const fileName = `${year}-${month}.pdf`;
    const filePath = `${user.id}/${fileName}`;
    
    // Ensure bucket exists (best effort)
    try {
       await admin.storage.createBucket('reports', { public: false });
    } catch(e) { /* ignore */ }

    const { error: uploadError } = await admin.storage
      .from('reports')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw new Error(uploadError.message);

    // 6. Generate Signed URL (48 hours)
    const { data: signData, error: signError } = await admin.storage
      .from('reports')
      .createSignedUrl(filePath, 48 * 60 * 60);

    if (signError) throw new Error(signError.message || 'Failed to sign URL');

    const expiresAt = new Date(nowTimestamp + 48 * 60 * 60 * 1000).toISOString();

    // 7. Store in data_export_requests
    await admin.from('data_export_requests').upsert({
      user_id: user.id,
      status: 'ready',
      download_url: signData.signedUrl,
      expires_at: expiresAt,
      created_at: new Date(nowTimestamp).toISOString()
    });

    return NextResponse.json({ downloadUrl: signData.signedUrl, expiresAt });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('[reports/generate] Internal server error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
