-- Badges and streaks system
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_key)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own badges" ON public.user_badges FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role badges" ON public.user_badges FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_badges_user ON public.user_badges(user_id);
