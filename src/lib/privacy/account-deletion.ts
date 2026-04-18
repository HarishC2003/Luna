import { createAdminClient } from '../supabase/admin';
import { sendEmailNotification } from '../notifications/sender';
import { accountDeletionConfirmEmail } from '../email/templates';
import crypto from 'crypto';

const logger = console;

export async function scheduleAccountDeletion(userId: string): Promise<void> {
  const admin = createAdminClient();
  
  const { data: existing } = await admin.from('account_deletion_requests')
    .select('*').eq('user_id', userId).is('cancelled_at', null).is('completed_at', null).maybeSingle();
    
  if (existing) throw new Error('A deletion request is already pending.');

  const { data: request, error } = await admin.from('account_deletion_requests').insert({
    user_id: userId
  }).select().single();

  if (error || !request) throw error;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { data: profile } = await admin.from('profiles').select('display_name').eq('id', userId).maybeSingle();

  await sendEmailNotification(userId, 'account_deletion_warning', accountDeletionConfirmEmail({
    displayName: profile?.display_name || 'there',
    scheduledAt: new Date(request.scheduled_deletion_at).toLocaleString(),
    cancellationUrl: `${appUrl}/api/cron/cancel-deletion?token=${request.id}`
  }));
}

export async function cancelAccountDeletion(tokenId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: request } = await admin.from('account_deletion_requests').select('*').eq('id', tokenId).maybeSingle();
  
  if (!request || request.cancelled_at || request.completed_at) return false;

  await admin.from('account_deletion_requests').update({ cancelled_at: new Date().toISOString() }).eq('id', tokenId);
  return true;
}

export async function processPendingDeletions(): Promise<number> {
  let count = 0;
  const admin = createAdminClient();
  
  const { data: pending } = await admin.from('account_deletion_requests')
    .select('*')
    .is('cancelled_at', null)
    .is('completed_at', null)
    .lte('scheduled_deletion_at', new Date().toISOString());

  if (!pending || pending.length === 0) return 0;

  for (const req of pending) {
    try {
      const uid = req.user_id;

      // 1. Delete storage exports & avatars
      await admin.storage.emptyBucket(`privacy_exports/${uid}`); // Pseudocode depending on setup, more explicit needed if complex
      
      // 2. Delete database rows (Many cascade, but we explicitly delete what might not)
      await admin.from('cycle_logs').delete().eq('user_id', uid);
      await admin.from('daily_logs').delete().eq('user_id', uid);
      await admin.from('cycle_predictions').delete().eq('user_id', uid);
      await admin.from('onboarding_data').delete().eq('user_id', uid);
      await admin.from('notification_settings').delete().eq('user_id', uid);
      await admin.from('push_subscriptions').delete().eq('user_id', uid);
      await admin.from('notification_log').delete().eq('user_id', uid);
      await admin.from('chat_feedback').delete().eq('user_id', uid);
      await admin.from('profiles').delete().eq('id', uid);
      
      // 3. Delete Auth User
      await admin.auth.admin.deleteUser(uid);

      // 4. Mark completed
      await admin.from('account_deletion_requests').update({ completed_at: new Date().toISOString() }).eq('id', req.id);

      const hash = crypto.createHash('sha256').update(uid).digest('hex');
      logger.info({ action: 'account_deleted', userIdHash: hash, timestamp: new Date().toISOString() });
      
      count++;
    } catch (err) {
      logger.error({ action: 'account_delete_failed', userId: req.user_id, error: err });
    }
  }

  return count;
}
