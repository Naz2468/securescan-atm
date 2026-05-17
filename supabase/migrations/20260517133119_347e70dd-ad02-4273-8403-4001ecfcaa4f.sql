
-- Tables
CREATE TABLE public.atm_users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     VARCHAR(100) NOT NULL,
  account_no    VARCHAR(20) UNIQUE NOT NULL,
  balance       DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
  created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.biometrics (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.atm_users(id) ON DELETE CASCADE,
  face_descriptor     TEXT NOT NULL,
  fingerprint_url     TEXT NOT NULL,
  fingerprint_path    TEXT NOT NULL,
  registered_at       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.auth_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES public.atm_users(id) ON DELETE SET NULL,
  account_no      VARCHAR(20),
  face_match      BOOLEAN,
  finger_match    BOOLEAN,
  face_score      FLOAT,
  finger_score    FLOAT,
  auth_result     TEXT CHECK (auth_result IN ('GRANTED','DENIED')),
  attempted_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.atm_users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('WITHDRAWAL','BALANCE','TRANSFER','DEPOSIT')),
  amount      DECIMAL(12,2),
  recipient   VARCHAR(20),
  status      TEXT NOT NULL DEFAULT 'SUCCESS',
  reference   TEXT,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE public.atm_sessions (
  token       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.atm_users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Permissive RLS for this academic prototype (all reads/writes allowed).
-- NOTE: tighten before production use.
ALTER TABLE public.atm_users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometrics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atm_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proto all" ON public.atm_users    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "proto all" ON public.biometrics   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "proto all" ON public.auth_logs    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "proto all" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "proto all" ON public.atm_sessions FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for fingerprint images (private; signed URLs used in app)
INSERT INTO storage.buckets (id, name, public) VALUES ('biometrics','biometrics', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "biometrics read"  ON storage.objects FOR SELECT USING (bucket_id = 'biometrics');
CREATE POLICY "biometrics write" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'biometrics');
CREATE POLICY "biometrics upd"   ON storage.objects FOR UPDATE USING (bucket_id = 'biometrics');
CREATE POLICY "biometrics del"   ON storage.objects FOR DELETE USING (bucket_id = 'biometrics');

-- Seed demo users
INSERT INTO public.atm_users (full_name, account_no, balance) VALUES
  ('Obed Meshach','0123456789',75000.00),
  ('Ada Okonkwo','0987654321',120000.00),
  ('Emeka Bello','1122334455',45000.00)
ON CONFLICT (account_no) DO NOTHING;
