import { z } from 'zod';

const stripHtml = (val: string) => !/<[^>]*>?/gm.test(val);

export const notificationSettingsSchema = z.object({
  email_period_reminder: z.boolean().optional(),
  email_fertile_window: z.boolean().optional(),
  email_log_streak: z.boolean().optional(),
  email_weekly_insights: z.boolean().optional(),
  email_tips: z.boolean().optional(),
  push_period_reminder: z.boolean().optional(),
  push_fertile_window: z.boolean().optional(),
  push_log_reminder: z.boolean().optional(),
  notify_hour: z.union([z.string(), z.number()]).transform(Number).optional(),
  notify_days_before: z.union([z.string(), z.number()]).transform(Number).optional(),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().startsWith('https://'),
  p256dh: z.string().min(10).max(200),
  auth: z.string().min(10).max(100),
  userAgent: z.string().max(200).optional(),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).max(50).trim().refine((val) => stripHtml(val), 'HTML tags not allowed').optional(),
  dateOfBirth: z.string()
    .refine((val) => {
      const date = new Date(val);
      const now = new Date();
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(now.getFullYear() - 10);
      const centuryAgo = new Date();
      centuryAgo.setFullYear(now.getFullYear() - 100);
      return date <= tenYearsAgo && date >= centuryAgo;
    }, 'Must be at least 10 years old and max 100 years ago')
    .optional(),
  conditions: z.array(z.enum(['pcos', 'endometriosis', 'irregular', 'none'])).max(4).optional(),
  goals: z.array(z.enum(['track', 'conceive', 'avoid', 'health'])).max(4).optional(),
});
