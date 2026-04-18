-- User notification settings
CREATE TABLE public.notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_period_reminder BOOLEAN DEFAULT TRUE,
  email_fertile_window BOOLEAN DEFAULT TRUE,
  email_log_streak BOOLEAN DEFAULT FALSE,
  email_weekly_insights BOOLEAN DEFAULT TRUE,
  email_tips BOOLEAN DEFAULT FALSE,
  push_period_reminder BOOLEAN DEFAULT FALSE,
  push_fertile_window BOOLEAN DEFAULT FALSE,
  push_log_reminder BOOLEAN DEFAULT FALSE,
  notify_hour INTEGER DEFAULT 8 CHECK (notify_hour BETWEEN 0 AND 23),
  notify_days_before INTEGER DEFAULT 2 CHECK (notify_days_before BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions (Web Push API endpoint + keys per device)
CREATE TABLE public.push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification log (sent notifications, no message content stored for privacy)
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email','push')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN NOT NULL
);

-- Data export requests
CREATE TABLE public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','failed')),
  download_url TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account deletion requests
CREATE TABLE public.account_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  scheduled_deletion_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_export_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own notification settings" ON public.notification_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own push subscriptions" ON public.push_subscriptions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own notification log" ON public.notification_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Own export requests" ON public.data_export_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own deletion requests" ON public.account_deletion_requests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access notifications" ON public.notification_settings FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access push" ON public.push_subscriptions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access log" ON public.notification_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access exports" ON public.data_export_requests FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access deletions" ON public.account_deletion_requests FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER notification_settings_updated_at BEFORE UPDATE ON public.notification_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_push_subscriptions_user ON public.push_subscriptions(user_id);
CREATE INDEX idx_notification_log_user ON public.notification_log(user_id);
CREATE INDEX idx_notification_log_sent_at ON public.notification_log(sent_at DESC);
CREATE INDEX idx_data_export_requests_user ON public.data_export_requests(user_id);
CREATE INDEX idx_account_deletion_requests_scheduled ON public.account_deletion_requests(scheduled_deletion_at) WHERE completed_at IS NULL AND cancelled_at IS NULL;
