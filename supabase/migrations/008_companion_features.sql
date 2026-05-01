-- Add new companion columns to daily_logs
ALTER TABLE public.daily_logs
ADD COLUMN sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
ADD COLUMN stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),
ADD COLUMN exercise BOOLEAN DEFAULT false,
ADD COLUMN exercise_type TEXT CHECK (exercise_type IN ('walking', 'yoga', 'gym', 'none')),
ADD COLUMN slept_well BOOLEAN DEFAULT false,
ADD COLUMN hydration_goal BOOLEAN DEFAULT false,
ADD COLUMN moved_body BOOLEAN DEFAULT false,
ADD COLUMN image_url TEXT;

-- Create partner_links table for sharing
CREATE TABLE public.partner_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

ALTER TABLE public.partner_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own partner links" ON public.partner_links FOR ALL USING (auth.uid() = user_id);
-- Allow anonymous read by token if needed, or service_role access
CREATE POLICY "Public read by token" ON public.partner_links FOR SELECT USING (true);
CREATE POLICY "Service role partner links" ON public.partner_links FOR ALL USING (auth.role() = 'service_role');

-- Create medication_logs table for strict tracking
CREATE TABLE public.medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  medication_name TEXT NOT NULL,
  taken BOOLEAN DEFAULT true,
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT CHECK (char_length(notes) <= 300),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own medication logs" ON public.medication_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role medication logs" ON public.medication_logs FOR ALL USING (auth.role() = 'service_role');
CREATE INDEX idx_medication_logs_user_date ON public.medication_logs(user_id, log_date DESC);

CREATE TRIGGER medication_logs_updated_at BEFORE UPDATE ON public.medication_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Configure Supabase Storage for daily log images
INSERT INTO storage.buckets (id, name, public) VALUES ('luna_images', 'luna_images', true) ON CONFLICT DO NOTHING;

-- Storage policies for luna_images
-- Users can insert their own images
CREATE POLICY "Users can upload their own images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'luna_images' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can view any image they have access to (or public)
CREATE POLICY "Images are publicly accessible" ON storage.objects FOR SELECT TO public USING (
  bucket_id = 'luna_images'
);

-- Users can delete their own images
CREATE POLICY "Users can delete their own images" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'luna_images' AND (storage.foldername(name))[1] = auth.uid()::text
);
