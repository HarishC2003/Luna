import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiLimiter } from '@/lib/rate-limit/limiter';
import { scheduleAccountDeletion } from '@/lib/privacy/account-deletion';
import { z } from 'zod';

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { success } = await apiLimiter.limit(user.id);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const body = await request.json();
    const schema = z.object({ confirmPhrase: z.string() });
    const parsed = schema.safeParse(body);

    if (!parsed.success || parsed.data.confirmPhrase !== 'delete my account') {
      return NextResponse.json({ error: 'Confirmation phrase does not match.' }, { status: 400 });
    }

    await scheduleAccountDeletion(user.id);

    const scheduledAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return NextResponse.json({ message: 'Account scheduled for deletion in 24 hours', scheduledAt });
  } catch (error: any) {
    if (error.message?.includes('already pending')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
