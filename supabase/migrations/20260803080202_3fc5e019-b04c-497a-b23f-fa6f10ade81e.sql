CREATE TABLE public.sleep_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  member_id UUID REFERENCES public.family_members(id) ON DELETE CASCADE,
  report_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_hours NUMERIC,
  target_hours NUMERIC,
  quality_score INTEGER,
  snoring_severity TEXT,
  apnea_detected BOOLEAN NOT NULL DEFAULT false,
  apnea_events INTEGER NOT NULL DEFAULT 0,
  movement_events INTEGER NOT NULL DEFAULT 0,
  sound_events INTEGER NOT NULL DEFAULT 0,
  urgency_level TEXT,
  disturbances JSONB,
  recommendations JSONB,
  timeline JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_reports TO authenticated;
GRANT ALL ON public.sleep_reports TO service_role;
ALTER TABLE public.sleep_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sleep reports" ON public.sleep_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own badges" ON public.user_badges FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.mood_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  mood_level INTEGER NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_logs TO authenticated;
GRANT ALL ON public.mood_logs TO service_role;
ALTER TABLE public.mood_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mood logs" ON public.mood_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.gratitude_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  entry TEXT NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gratitude_journal TO authenticated;
GRANT ALL ON public.gratitude_journal TO service_role;
ALTER TABLE public.gratitude_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gratitude" ON public.gratitude_journal FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.gut_health_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  bowel_movement BOOLEAN,
  bloated BOOLEAN,
  stomach_pain BOOLEAN,
  appetite_normal BOOLEAN,
  hydrated BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gut_health_logs TO authenticated;
GRANT ALL ON public.gut_health_logs TO service_role;
ALTER TABLE public.gut_health_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own gut logs" ON public.gut_health_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.energy_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  energy_level INTEGER NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.energy_logs TO authenticated;
GRANT ALL ON public.energy_logs TO service_role;
ALTER TABLE public.energy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own energy logs" ON public.energy_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.wellness_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  activity_key TEXT NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_key, log_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wellness_completions TO authenticated;
GRANT ALL ON public.wellness_completions TO service_role;
ALTER TABLE public.wellness_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wellness completions" ON public.wellness_completions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);