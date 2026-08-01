CREATE TABLE public.exercise_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  activity_type text NOT NULL,
  duration_seconds integer NOT NULL DEFAULT 0,
  distance_km numeric DEFAULT 0,
  steps integer DEFAULT 0,
  calories_burned integer DEFAULT 0,
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exercise_sessions TO authenticated;
GRANT ALL ON public.exercise_sessions TO service_role;
ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own exercise sessions" ON public.exercise_sessions
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.user_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  access_token text,
  refresh_token text,
  token_expiry timestamp with time zone,
  connected_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_integrations TO authenticated;
GRANT ALL ON public.user_integrations TO service_role;
ALTER TABLE public.user_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own integrations" ON public.user_integrations
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_integrations_updated_at BEFORE UPDATE ON public.user_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.user_credits
  ADD COLUMN IF NOT EXISTS referral_code text,
  ADD COLUMN IF NOT EXISTS referred_by uuid,
  ADD COLUMN IF NOT EXISTS last_refresh_date date,
  ADD COLUMN IF NOT EXISTS signup_date timestamp with time zone NOT NULL DEFAULT now();
CREATE UNIQUE INDEX IF NOT EXISTS user_credits_referral_code_key ON public.user_credits (referral_code) WHERE referral_code IS NOT NULL;