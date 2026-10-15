import { z } from 'zod';

const stripHtml = (val: string) => !/<[^>]*>?/gm.test(val);

export const userFeedbackSchema = z.object({
  // A. Basic information
  platform: z.enum(['Android', 'iPhone', 'Web']),
  test_duration: z.enum(['Less than 5 minutes', '5–15 minutes', 'More than 15 minutes']),
  features_tested: z.array(z.string()).min(1, 'Please select at least one feature you tried.'),

  // B. Overall experience
  ease_of_use: z.number().int().min(1).max(5, 'Rating must be between 1 and 5.'),
  design_rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5.'),
  clarity: z.enum(['Yes', 'Partly', 'No']),

  // C. Feature-specific feedback
  confusing_aspects: z.string().max(2000).refine(stripHtml, 'HTML tags not allowed').optional().nullable(),
  energy_sleep_rating: z.enum(['Yes', 'Partly', 'No', "Didn't test"]),
  bugs_encountered: z.string().max(2000).refine(stripHtml, 'HTML tags not allowed').optional().nullable(),
  notifications_working: z.enum(['Yes', 'No', "Didn't test"]),

  // D. Suggestions
  liked_most: z.string().max(2000).refine(stripHtml, 'HTML tags not allowed').optional().nullable(),
  improve_first: z.string().max(2000).refine(stripHtml, 'HTML tags not allowed').optional().nullable(),
  future_features: z.string().max(2000).refine(stripHtml, 'HTML tags not allowed').optional().nullable(),
  additional_suggestions: z.string().max(2000).refine(stripHtml, 'HTML tags not allowed').optional().nullable(),
});

export type UserFeedbackInput = z.infer<typeof userFeedbackSchema>;
