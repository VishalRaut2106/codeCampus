-- Safe migration: add platform and external_url columns to contests for external sync
ALTER TABLE public.contests
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT;

-- Unique constraint on external_url to allow upserts (ignore nulls)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'uniq_contests_external_url'
  ) THEN
    CREATE UNIQUE INDEX uniq_contests_external_url ON public.contests((lower(external_url))) WHERE external_url IS NOT NULL;
  END IF;
END $$;
