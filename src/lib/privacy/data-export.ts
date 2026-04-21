import { createAdminClient } from '../supabase/admin';
import { sendEmailNotification } from '../notifications/sender';
import { dataExportReadyEmail } from '../email/templates';

export async function generateUserDataExport(userId: string): Promise<string> {
  const admin = createAdminClient();
  
  const [
    { data: profile },
    { data: onboarding },
    { data: cycleLogs },
    { data: dailyLogs },
    { data: predictions },
    { data: notificationSettings },
    { data: chatFeedback }
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', userId).maybeSingle(),
    admin.from('onboarding_data').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('cycle_logs').select('*').eq('user_id', userId).order('period_start', { ascending: false }),
    admin.from('daily_logs').select('*').eq('user_id', userId).order('log_date', { ascending: false }),
    admin.from('cycle_predictions').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('notification_settings').select('*').eq('user_id', userId).maybeSingle(),
    admin.from('chat_feedback').select('rating, session_id, created_at').eq('user_id', userId)
  ]);

  const exportObj = {
    exportedAt: new Date().toISOString(),
    user: profile ? { email: profile.email, displayName: profile.display_name, dateOfBirth: profile.date_of_birth, createdAt: profile.created_at } : null,
    onboarding: onboarding ? { avgCycleLength: onboarding.avg_cycle_length, avgPeriodLength: onboarding.avg_period_length, conditions: onboarding.conditions, goals: onboarding.goals } : null,
    cycleLogs: cycleLogs || [],
    dailyLogs: dailyLogs || [],
    predictions: predictions || null,
    notificationSettings: notificationSettings || null,
    chatFeedback: chatFeedback || [],
    meta: {
      totalCycleLogs: cycleLogs?.length || 0,
      totalDailyLogs: dailyLogs?.length || 0,
      accountCreatedAt: profile?.created_at || null
    }
  };

  return JSON.stringify(exportObj, null, 2);
}

export async function createExportDownloadUrl(userId: string): Promise<string> {
  const admin = createAdminClient();
  const exportJson = await generateUserDataExport(userId);
  
  const timestamp = new Date().getTime();
  const filePath = `exports/${userId}/${timestamp}.json`;
  
  const { error: uploadError } = await admin.storage
    .from('privacy_exports') // Need to ensure bucket exists
    .upload(filePath, exportJson, { contentType: 'application/json' });
    
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  // Create signed URL valid for 24h
  const { data: signedData, error: signError } = await admin.storage
    .from('privacy_exports')
    .createSignedUrl(filePath, 60 * 60 * 24);
    
  if (signError || !signedData) throw new Error('Could not create signed URL');

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  await admin.from('data_export_requests').insert({
    user_id: userId,
    status: 'ready',
    download_url: signedData.signedUrl,
    expires_at: expiresAt
  });

  const { data: profile } = await admin.from('profiles').select('display_name').eq('id', userId).maybeSingle();
  
  await sendEmailNotification(userId, 'data_export', dataExportReadyEmail({
    displayName: profile?.display_name || 'there',
    downloadUrl: signedData.signedUrl,
    expiresAt: new Date(expiresAt).toLocaleString()
  }));

  return signedData.signedUrl;
}
