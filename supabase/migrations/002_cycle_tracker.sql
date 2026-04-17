-- Onboarding data (collected on first login)
CREATE TABLE public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  avg_cycle_length INTEGER NOT NULL DEFAULT 28 CHECK (avg_cycle_length BETWEEN 15 AND 60),
  avg_period_length INTEGER NOT NULL DEFAULT 5 CHECK (avg_period_length BETWEEN 1 AND 15),
  last_period_start DATE,
  conditions JSONB DEFAULT '[]',
  goals JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cycle logs (one row per period)
CREATE TABLE public.cycle_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE,
  cycle_length INTEGER CHECK (cycle_length BETWEEN 15 AND 60),
  avg_flow TEXT CHECK (avg_flow IN ('spotting','light','medium','heavy')),
  notes TEXT CHECK (char_length(notes) <= 500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, period_start)
);

-- Daily logs (one row per user per day)
CREATE TABLE public.daily_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  mood TEXT CHECK (mood IN ('great','good','okay','low','terrible')),
  energy INTEGER CHECK (energy BETWEEN 1 AND 5),
  flow TEXT CHECK (flow IN ('none','spotting','light','medium','heavy')),
  symptoms JSONB DEFAULT '[]',
  notes TEXT CHECK (char_length(notes) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, log_date)
);

-- Cycle predictions (recomputed after every log entry)
CREATE TABLE public.cycle_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  predicted_start DATE,
  predicted_end DATE,
  fertile_start DATE,
  fertile_end DATE,
  ovulation_date DATE,
  confidence NUMERIC(4,2) CHECK (confidence BETWEEN 0 AND 1),
  based_on_cycles INTEGER DEFAULT 0,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS on all tables
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cycle_predictions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Own onboarding data" ON public.onboarding_data FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own cycle logs" ON public.cycle_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own daily logs" ON public.daily_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own predictions" ON public.cycle_predictions FOR ALL USING (auth.uid() = user_id);

-- Service role full access (for admin)
CREATE POLICY "Service role onboarding" ON public.onboarding_data FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role cycles" ON public.cycle_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role daily" ON public.daily_logs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role predictions" ON public.cycle_predictions FOR ALL USING (auth.role() = 'service_role');

-- Indexes
CREATE INDEX idx_cycle_logs_user_date ON public.cycle_logs(user_id, period_start DESC);
CREATE INDEX idx_daily_logs_user_date ON public.daily_logs(user_id, log_date DESC);
CREATE INDEX idx_predictions_user ON public.cycle_predictions(user_id);

-- Auto-update updated_at (reuse function from migration 001)
CREATE TRIGGER onboarding_updated_at BEFORE UPDATE ON public.onboarding_data FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER cycle_logs_updated_at BEFORE UPDATE ON public.cycle_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER daily_logs_updated_at BEFORE UPDATE ON public.daily_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
