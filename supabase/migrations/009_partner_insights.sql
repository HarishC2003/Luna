ALTER TABLE public.profiles ADD COLUMN partner_share_token TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN partner_share_enabled BOOLEAN DEFAULT FALSE;
