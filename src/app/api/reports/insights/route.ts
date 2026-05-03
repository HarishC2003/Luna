import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { generateInsightsReport } from '@/lib/reports/insights-report';

export async function POST(_request: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit: 1 report per day
    const { success } = await apiLimiter.limit(`insights_report:${user.id}`);
    if (!success) {
      return NextResponse.json({ error: 'Report limit reached. Try again tomorrow.' }, { status: 429 });
    }

    const report = await generateInsightsReport(user.id);
    
    return NextResponse.json({ report });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Treat "Not enough data" or "No logs" as a client validation error (400) rather than a server crash (500)
    if (message.includes('Not enough cycle data') || message.includes('No daily logs')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
