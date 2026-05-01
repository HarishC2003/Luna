import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzePatterns } from '@/lib/insights/pattern-analyzer';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patterns = await analyzePatterns(user.id);

    return NextResponse.json({ patterns });
  } catch (error) {
    console.error('[patterns/route.ts] Error analyzing patterns:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
