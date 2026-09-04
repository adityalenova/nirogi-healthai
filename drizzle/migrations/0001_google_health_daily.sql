CREATE TABLE public.google_fit_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  steps integer,
  calories integer,
  distance_m integer,
  active_minutes integer,
  heart_rate_avg integer,
  sleep_minutes integer,
  weight_kg numeric,
  spo2_avg integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.google_fit_daily TO authenticated;
GRANT ALL ON public.google_fit_daily TO service_role;

ALTER TABLE public.google_fit_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own google health data" ON public.google_fit_daily
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own google health data" ON public.google_fit_daily
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own google health data" ON public.google_fit_daily
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own google health data" ON public.google_fit_daily
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

ALTER TABLE public.family_invites ADD COLUMN IF NOT EXISTS email text;