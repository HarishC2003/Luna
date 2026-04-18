-- Chat feedback (optional thumbs up/down per session — no message content stored)
CREATE TABLE public.chat_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating IN (1, -1)),
  phase TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- Chat abuse log (flagged sessions only — no message content)
CREATE TABLE public.chat_abuse_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chat_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_abuse_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own feedback" ON public.chat_feedback FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role feedback" ON public.chat_feedback FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role abuse log" ON public.chat_abuse_log FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins read abuse log" ON public.chat_abuse_log
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE INDEX idx_chat_feedback_user ON public.chat_feedback(user_id);
CREATE INDEX idx_chat_abuse_log_user ON public.chat_abuse_log(user_id);
CREATE INDEX idx_chat_abuse_log_created ON public.chat_abuse_log(created_at DESC);
