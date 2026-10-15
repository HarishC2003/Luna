-- User Feedback Questionnaire table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  platform TEXT NOT NULL CHECK (platform IN ('Android', 'iPhone', 'Web')),
  test_duration TEXT NOT NULL CHECK (test_duration IN ('Less than 5 minutes', '5–15 minutes', 'More than 15 minutes')),
  features_tested TEXT[] NOT NULL DEFAULT '{}',
  ease_of_use INTEGER NOT NULL CHECK (ease_of_use BETWEEN 1 AND 5),
  design_rating INTEGER NOT NULL CHECK (design_rating BETWEEN 1 AND 5),
  clarity TEXT NOT NULL CHECK (clarity IN ('Yes', 'Partly', 'No')),
  confusing_aspects TEXT,
  energy_sleep_rating TEXT NOT NULL CHECK (energy_sleep_rating IN ('Yes', 'Partly', 'No', 'Didn''t test')),
  bugs_encountered TEXT,
  notifications_working TEXT NOT NULL CHECK (notifications_working IN ('Yes', 'No', 'Didn''t test')),
  liked_most TEXT,
  improve_first TEXT,
  future_features TEXT,
  additional_suggestions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Allow anyone (authenticated or anonymous testers) to insert feedback
CREATE POLICY "Anyone can insert feedback" ON public.user_feedback
  FOR INSERT WITH CHECK (true);

-- Allow admins to read all feedback
CREATE POLICY "Admins read feedback" ON public.user_feedback
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Service role full access
CREATE POLICY "Service role full feedback" ON public.user_feedback
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
