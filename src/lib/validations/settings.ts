import { z } from 'zod';

const stripHtml = (val: string) => !/<[^>]*>?/gm.test(val);

export const notificationSettingsSchema = z.object({
  emailPeriodReminder: z.boolean().optional(),
  emailFertileWindow: z.boolean().optional(),
  emailLogStreak: z.boolean().optional(),
  emailWeeklyInsights: z.boolean().optional(),
  emailTips: z.boolean().optional(),
  pushPeriodReminder: z.boolean().optional(),
  pushFertileWindow: z.boolean().optional(),
  pushLogReminder: z.boolean().optional(),
  notifyHour: z.number().int().min(0).max(23).optional(),
  notifyDaysBefore: z.number().int().min(1).max(5).optional(),
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
