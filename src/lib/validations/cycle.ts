import { z } from 'zod';

const stripHtml = (val: string) => !/<[^>]*>?/gm.test(val);

export const onboardingSchema = z.object({
  avgCycleLength: z.number().int().min(15).max(60),
  avgPeriodLength: z.number().int().min(1).max(15),
  lastPeriodStart: z.string().optional().refine((val) => {
    if (!val) return true;
    const date = new Date(val);
    const now = new Date();
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(now.getDate() - 90);
    return date <= now && date >= ninetyDaysAgo;
  }, 'Date must be within past 90 days and not in the future'),
  conditions: z.array(z.enum(['pcos', 'endometriosis', 'irregular', 'none'])).max(4).optional().default([]),
  goals: z.array(z.enum(['track', 'conceive', 'avoid', 'health'])).max(4).optional().default([]),
});

export const logCycleSchema = z.object({
  periodStart: z.string().refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    return date <= now && date >= oneYearAgo;
  }, 'Date must be within past year and not in the future'),
  periodEnd: z.string().optional().nullable(),
  avgFlow: z.enum(['spotting', 'light', 'medium', 'heavy']).optional().nullable(),
  notes: z.string().max(500).refine((val) => val === '' || stripHtml(val), 'HTML tags not allowed').optional().nullable(),
}).refine((data) => {
  if (data.periodEnd && data.periodStart) {
    const start = new Date(data.periodStart);
    const end = new Date(data.periodEnd);
    const diff = (end.getTime() - start.getTime()) / (1000 * 3600 * 24);
    return end >= start && diff <= 15;
  }
  return true;
}, { message: 'Period end must be after start and max 15 days duration', path: ['periodEnd'] });

export const dailyLogSchema = z.object({
  logDate: z.string().refine((val) => {
    const date = new Date(val);
    const now = new Date();
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 2);
    return date <= tomorrow && date >= sixtyDaysAgo;
  }, 'Date must be within past 60 days and not in the future'),
  mood: z.enum(['great', 'good', 'okay', 'low', 'terrible']).optional().nullable(),
  energy: z.number().int().min(1).max(5).optional().nullable(),
  flow: z.enum(['none', 'spotting', 'light', 'medium', 'heavy']).optional().nullable(),
  symptoms: z.array(z.enum(['cramps', 'headache', 'bloating', 'breast_tenderness', 'fatigue', 'acne', 'back_pain', 'nausea', 'mood_swings', 'insomnia'])).max(10).optional().nullable(),
  notes: z.string().max(300).refine((val) => val === null || val === '' || stripHtml(val), 'HTML tags not allowed').optional().nullable(),
  waterGlasses: z.number().int().min(0).max(20).optional().nullable(),
  sleep_quality: z.number().int().min(1).max(5).optional().nullable(),
  stress_level: z.number().int().min(1).max(5).optional().nullable(),
  exercise: z.boolean().optional().nullable(),
  exercise_type: z.enum(['walking', 'yoga', 'gym', 'none']).optional().nullable(),
  slept_well: z.boolean().optional().nullable(),
  hydration_goal: z.boolean().optional().nullable(),
  moved_body: z.boolean().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
});
