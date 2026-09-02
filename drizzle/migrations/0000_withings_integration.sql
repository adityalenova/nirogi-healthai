ALTER TABLE public.user_integrations
  ADD COLUMN IF NOT EXISTS provider_user_id TEXT,
  ADD COLUMN IF NOT EXISTS scopes TEXT,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.withings_body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  weight_kg NUMERIC, bmi NUMERIC, fat_ratio NUMERIC, fat_mass_kg NUMERIC,
  fat_free_mass_kg NUMERIC, muscle_mass_kg NUMERIC, bone_mass_kg NUMERIC,
  hydration_kg NUMERIC, visceral_fat NUMERIC, pulse_wave_velocity NUMERIC,
  bp_systolic NUMERIC, bp_diastolic NUMERIC, heart_rate_bpm NUMERIC,
  spo2_percent NUMERIC, skin_temp_celsius NUMERIC, body_temp_celsius NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, measured_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withings_body_measurements TO authenticated;
GRANT ALL ON public.withings_body_measurements TO service_role;
ALTER TABLE public.withings_body_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own body measurements" ON public.withings_body_measurements
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.withings_sleep (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sleep_date DATE NOT NULL,
  start_time TIMESTAMPTZ, end_time TIMESTAMPTZ,
  duration_seconds INTEGER, sleep_score INTEGER,
  rem_duration INTEGER, light_duration INTEGER, deep_duration INTEGER,
  awake_count INTEGER, apnea_index NUMERIC, snoring_duration INTEGER,
  avg_heart_rate NUMERIC, hrv NUMERIC, respiratory_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, sleep_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withings_sleep TO authenticated;
GRANT ALL ON public.withings_sleep TO service_role;
ALTER TABLE public.withings_sleep ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sleep" ON public.withings_sleep
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.withings_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  steps INTEGER, distance_metres NUMERIC, calories_total NUMERIC, calories_active NUMERIC,
  active_duration_minutes NUMERIC, elevation_metres NUMERIC,
  soft_duration NUMERIC, moderate_duration NUMERIC, intense_duration NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withings_activity TO authenticated;
GRANT ALL ON public.withings_activity TO service_role;
ALTER TABLE public.withings_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.withings_activity
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.withings_heart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  afib_result TEXT, heart_sounds TEXT, resting_hr NUMERIC, hrv NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, recorded_at)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.withings_heart TO authenticated;
GRANT ALL ON public.withings_heart TO service_role;
ALTER TABLE public.withings_heart ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own heart" ON public.withings_heart
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);