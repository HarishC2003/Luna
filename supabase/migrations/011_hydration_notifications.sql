ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS push_hydration_reminder BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hydration_notify_hour INT DEFAULT 14,
ADD COLUMN IF NOT EXISTS notify_minute INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS hydration_notify_minute INT DEFAULT 0;
