import { createAdminClient } from '../supabase/admin';
import { sendEmailNotification, sendPushNotification } from './sender';
import { periodReminderEmail, fertileWindowEmail } from '../email/templates';
import { buildUserHealthContext } from '../chat/context-builder';
import { generateCheckinQuestion } from '../checkin/question-generator';
import { computePrediction } from '../cycle/predictor';
import { getDailyWaterGoal } from '../hydration/goal';

export async function runDailyNotifications(): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;
  const admin = createAdminClient();
  const today = new Date();
  today.setHours(today.getHours() + 5); // Add 5h 30m for IST roughly, or just use UTC/server local
  const currentHour = today.getHours();
  
  // 1. Query all settings
  const { data: allSettings, error: setsErr } = await admin.from('notification_settings').select('*');
  if (setsErr || !allSettings) return { sent, failed };

  for (const settings of allSettings) {
    try {
      const userId = settings.user_id;

      // Ensure it's the right time to send
      if (settings.notify_hour !== currentHour) continue;

      const [{ data: prediction }, { data: onboard }, { data: profile }] = await Promise.all([
        admin.from('cycle_predictions').select('*').eq('user_id', userId).maybeSingle(),
        admin.from('onboarding_data').select('*').eq('user_id', userId).maybeSingle(),
        admin.from('profiles').select('*').eq('id', userId).maybeSingle()
      ]);

      if (!profile || !prediction) continue;

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const displayName = profile.display_name || 'there';

      // Check period reminder
      if (settings.email_period_reminder || settings.push_period_reminder) {
        const predictedStart = new Date(prediction.predicted_start);
        const daysUntil = Math.floor((predictedStart.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
        
        if (daysUntil === settings.notify_days_before) {
          // Check log to prevent dupes today
          const { data: logs } = await admin.from('notification_log')
            .select('id').eq('user_id', userId).eq('notification_type', 'period_reminder')
            .gte('sent_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
            
          if (!logs || logs.length === 0) {
            if (settings.email_period_reminder) {
              const res = await sendEmailNotification(userId, 'period_reminder', periodReminderEmail({
                displayName, daysUntil, predictedDate: predictedStart.toLocaleDateString(), appUrl
              }));
              if (res) { sent++; } else { failed++; }
            }
            if (settings.push_period_reminder) {
              const res = await sendPushNotification(userId, 'period_reminder', {
                title: 'Your period is coming soon',
                body: `Predicted to start in ${daysUntil} days.`,
                url: '/dashboard'
              });
              if (res) { sent++; } else { failed++; }
            }
          }
        }
      }

      // Check fertile window
      if (settings.email_fertile_window || settings.push_fertile_window) {
        const fertileStart = new Date(prediction.fertile_start);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0,0,0,0);
        fertileStart.setHours(0,0,0,0);

        if (fertileStart.getTime() === tomorrow.getTime()) {
           const wantsToConceive = onboard?.goals?.includes('conceive');
           if (wantsToConceive || settings.email_fertile_window) {
             const { data: logs } = await admin.from('notification_log')
              .select('id').eq('user_id', userId).eq('notification_type', 'fertile_window')
              .gte('sent_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
              
              if (!logs || logs.length === 0) {
                 if (settings.email_fertile_window) {
                    const res = await sendEmailNotification(userId, 'fertile_window', fertileWindowEmail({
                      displayName, fertileStart: fertileStart.toLocaleDateString(),
                      fertileEnd: new Date(prediction.fertile_end).toLocaleDateString(),
                      ovulationDate: new Date(prediction.ovulation_date).toLocaleDateString(), appUrl
                    }));
                    if (res) { sent++; } else { failed++; }
                 }
                 if (settings.push_fertile_window) {
                    const res = await sendPushNotification(userId, 'fertile_window', {
                      title: 'Fertile window starts tomorrow',
                      body: 'Your predicted fertile window begins tomorrow.',
                      url: '/dashboard'
                    });
                    if (res) { sent++; } else { failed++; }
                 }
              }
           }
        }
      }

      // Check check-in (e.g. at 9AM or whatever hour they want it, but if user wants push notifications)
      if (settings.push_period_reminder || settings.push_fertile_window) { // Assume if they want pushes, send check-in at their notify hour
        // For simplicity, we send check-in push if it's their notify hour and they haven't answered
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: todayLog } = await admin.from('daily_logs').select('id').eq('user_id', userId).eq('log_date', todayStr).maybeSingle();
        
        if (!todayLog) {
          // They haven't logged anything today = check-in unanswered
          const ctx = await buildUserHealthContext(userId);
          const checkin = generateCheckinQuestion(ctx);
          
          const { data: checkinLogs } = await admin.from('notification_log')
            .select('id').eq('user_id', userId).eq('notification_type', 'daily_checkin')
            .gte('sent_at', new Date(new Date().setHours(0,0,0,0)).toISOString());
            
          if (!checkinLogs || checkinLogs.length === 0) {
            const res = await sendPushNotification(userId, 'daily_checkin', {
              title: 'Luna check-in',
              body: checkin.question,
              url: '/dashboard?checkin=true'
            });
            if (res) { sent++; } else { failed++; }
          }
        }
      }

      // Hydration reminder at 2pm IST (14:00)
      const istHour = (new Date().getUTCHours() + 5) % 24; // rough IST conversion
      if (istHour === 14 && (settings.push_period_reminder || settings.push_fertile_window)) {
        const todayStr = new Date().toISOString().split('T')[0];
        const { data: todayLog } = await admin.from('daily_logs')
          .select('water_glasses')
          .eq('user_id', userId)
          .eq('log_date', todayStr)
          .maybeSingle();

        // Compute the user's phase-based goal
        const { data: cycleLogs } = await admin.from('cycle_logs').select('*').eq('user_id', userId).order('period_start', { ascending: false }).limit(6);
        const mappedCycles = (cycleLogs || []).map((c: Record<string, unknown>) => ({
          periodStart: new Date(c.period_start as string),
          periodEnd: c.period_end ? new Date(c.period_end as string) : undefined
        }));
        const computed = computePrediction(mappedCycles, {
          avgCycleLength: onboard?.avg_cycle_length || 28,
          avgPeriodLength: onboard?.avg_period_length || 5,
          lastPeriodStart: cycleLogs && cycleLogs.length > 0 ? new Date(cycleLogs[0].period_start) : undefined
        });
        const hydrationGoal = getDailyWaterGoal(computed.currentPhase);
        const currentGlasses = todayLog?.water_glasses ?? 0;

        if (currentGlasses < Math.floor(hydrationGoal.glasses / 2)) {
          const { data: hydrationLogs } = await admin.from('notification_log')
            .select('id').eq('user_id', userId).eq('notification_type', 'hydration_reminder')
            .gte('sent_at', new Date(new Date().setHours(0,0,0,0)).toISOString());

          if (!hydrationLogs || hydrationLogs.length === 0) {
            const res = await sendPushNotification(userId, 'hydration_reminder', {
              title: 'Hydration check-in',
              body: `You've had ${currentGlasses} glasses today. Goal is ${hydrationGoal.glasses}. Keep going! 💧`,
              url: '/dashboard'
            });
            if (res) { sent++; } else { failed++; }
          }
        }
      }

    } catch (err) {
      console.error(`Error processing notifications for user ${settings.user_id}:`, err);
      failed++;
    }
  }

  return { sent, failed };
}
