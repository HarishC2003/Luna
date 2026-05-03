import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { predictUpcomingSymptoms } from '@/lib/predictions/symptom-predictor';

export async function GET(_request: Request): Promise<Response> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const predictions = await predictUpcomingSymptoms(user.id);
    
    return NextResponse.json({ predictions });
  } catch (error) {
    console.error('Symptom predictions error:', error);
    return NextResponse.json({ error: 'Failed to generate predictions' }, { status: 500 });
  }
}
