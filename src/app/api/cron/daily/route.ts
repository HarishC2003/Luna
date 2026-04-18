import { NextResponse } from 'next/server';
import { runDailyNotifications } from '@/lib/notifications/scheduler';
import { processPendingDeletions } from '@/lib/privacy/account-deletion';
const logger = console;

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('Starting daily cron job');
    const notifs = await runDailyNotifications();
    const deletions = await processPendingDeletions();
    
    logger.info({ action: 'cron_completed', notifications: notifs, deletions });
    return NextResponse.json({ 
      success: true, 
      notificationsSent: notifs.sent, 
      deletionsProcessed: deletions, 
      completedAt: new Date().toISOString() 
    });
  } catch (error) {
    logger.error({ action: 'cron_failed', error });
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 });
  }
}
