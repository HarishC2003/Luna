-- Feature flags
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default feature flags
INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('ai_chat_enabled', true, 'Enable the AI chatbot for all users'),
  ('new_registrations_open', true, 'Allow new user sign-ups'),
  ('push_notifications_active', true, 'Enable push notification sending'),
  ('maintenance_mode', false, 'Show maintenance page to all non-admin users'),
  ('data_export_enabled', true, 'Allow users to export their data'),
  ('cycle_predictions_enabled', true, 'Enable cycle prediction engine');

-- Admin audit log
CREATE TABLE public.admin_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User suspension log
CREATE TABLE public.user_suspensions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suspended_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) <= 500),
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_suspensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read feature flags" ON public.feature_flags
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Service role full feature flags" ON public.feature_flags
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins read audit log" ON public.admin_audit_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Service role full audit log" ON public.admin_audit_log
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins manage suspensions" ON public.user_suspensions
  FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Service role full suspensions" ON public.user_suspensions
  FOR ALL USING (auth.role() = 'service_role');

-- Allow all authenticated users to read feature flags (for middleware checks)
CREATE POLICY "Authenticated users read feature flags" ON public.feature_flags
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX idx_feature_flags_key ON public.feature_flags(key);
CREATE INDEX idx_admin_audit_log_admin ON public.admin_audit_log(admin_id);
CREATE INDEX idx_admin_audit_log_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_user_suspensions_user ON public.user_suspensions(user_id);
CREATE INDEX idx_user_suspensions_active ON public.user_suspensions(user_id) WHERE lifted_at IS NULL;
