-- Make code column optional so we can store only metadata for accepted submissions
ALTER TABLE public.submissions
  ALTER COLUMN code DROP NOT NULL;

-- Optional: default code to NULL
ALTER TABLE public.submissions
  ALTER COLUMN code DROP DEFAULT;
