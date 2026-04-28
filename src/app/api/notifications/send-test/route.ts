import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/client';
import { periodReminderEmail } from '@/lib/email/templates';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'User ID is required' }, { status: 400 });

    const adminSupabase = createAdminClient();

    // Fetch user details
    const { data: user, error: userError } = await adminSupabase
      .from('profiles')
      .select('email, display_name')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send a test period reminder email assuming 2 days until next period
    const { html, text } = periodReminderEmail({
      displayName: user.display_name || 'User',
      daysUntil: 2,
      predictedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://lunalife.app',
    });

    const result = await sendEmail({
      to: user.email,
      subject: 'Luna: Your period is approaching',
      html,
      text
    });

    if (!result.success) {
      console.error('Test notification send error:', result.error);
      return NextResponse.json({ sent: false, error: result.error });
    }

    return NextResponse.json({ sent: true, message: 'Test notification sent' });
  } catch (error) {
    console.error('Test notification error:', error);
    return NextResponse.json({ sent: false, error: 'Internal server error' }, { status: 500 });
  }
}
