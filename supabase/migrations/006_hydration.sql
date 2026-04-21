-- Add water_glasses column to daily_logs for hydration tracking
ALTER TABLE public.daily_logs
ADD COLUMN water_glasses INTEGER DEFAULT 0 CHECK (water_glasses >= 0 AND water_glasses <= 20);
