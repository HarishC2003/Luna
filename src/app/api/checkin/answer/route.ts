import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { clearUserContextCache } from '@/lib/chat/context-builder';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { success } = await apiLimiter.limit(user.id);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  try {
    const { answer, logField } = await request.json();
    if (!answer || !logField) return NextResponse.json({ error: 'Missing answer or logField' }, { status: 400 });

    const admin = createAdminClient();
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    // Fetch existing log
    const { data: log } = await admin.from('daily_logs').select('*').eq('user_id', user.id).eq('log_date', todayStr).maybeSingle();

    const updates: Record<string, any> = {
      user_id: user.id,
      log_date: todayStr
    };

    if (logField === 'mood') {
       if (['Terrible', 'Worse'].includes(answer)) updates.mood = 'terrible';
       else if (['Low', 'Withdrawn'].includes(answer)) updates.mood = 'low';
       else if (['Okay', 'Same', 'Not yet'].includes(answer)) updates.mood = 'okay';
       else if (['Good', 'Social', 'Yes, ready'].includes(answer)) updates.mood = 'good';
       else if (['Great', 'Much better'].includes(answer)) updates.mood = 'great';
       else updates.mood = 'okay'; // fallback
    } else if (logField === 'energy') {
       if (['Low', 'Worse'].includes(answer)) updates.energy = 1;
       else if (['Medium', 'Same'].includes(answer)) updates.energy = 3;
       else if (['High'].includes(answer)) updates.energy = 4;
       else if (['Very high', 'Much better'].includes(answer)) updates.energy = 5;
       else updates.energy = 3;
    } else if (logField === 'flow') {
       updates.flow = answer.toLowerCase();
    } else if (logField === 'symptoms') {
       if (answer !== 'None') {
          const symptomKey = answer.toLowerCase().replace(' ', '_');
          const existingSymptoms = log?.symptoms || [];
          if (!existingSymptoms.includes(symptomKey)) {
             updates.symptoms = [...existingSymptoms, symptomKey];
          }
       }
    }

    if (log) {
       await admin.from('daily_logs').update(updates).eq('id', log.id);
    } else {
       await admin.from('daily_logs').insert(updates);
    }

    clearUserContextCache(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
