ALTER TABLE public.biometrics ADD COLUMN IF NOT EXISTS device_fp TEXT;
ALTER TABLE public.biometrics ALTER COLUMN fingerprint_url DROP NOT NULL;
ALTER TABLE public.biometrics ALTER COLUMN fingerprint_path DROP NOT NULL;