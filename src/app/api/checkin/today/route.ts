import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { buildUserHealthContext } from '@/lib/chat/context-builder';
import { generateCheckinQuestion } from '@/lib/checkin/question-generator';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const admin = createAdminClient();
  
  const today = new Date();
  today.setHours(0,0,0,0);
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

  const { data: log } = await admin.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', todayStr).maybeSingle();

  const userContext = await buildUserHealthContext(user.id);
  const checkinData = generateCheckinQuestion(userContext);

  let hasAnswered = false;
  if (log) {
    if (checkinData.logField === 'mood' && log.mood) hasAnswered = true;
    if (checkinData.logField === 'energy' && log.energy) hasAnswered = true;
    if (checkinData.logField === 'flow' && (log.flow && log.flow !== 'none')) hasAnswered = true;
    // For symptoms checkin we check if any symptom is logged
    if (checkinData.logField === 'symptoms' && log.symptoms && log.symptoms.length > 0) hasAnswered = true;
  }

  return NextResponse.json({ checkin: checkinData, hasAnswered });
}
