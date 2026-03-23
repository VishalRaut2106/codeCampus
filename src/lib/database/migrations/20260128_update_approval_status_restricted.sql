-- Migration: Update approval status constraint and add ban_reason
-- Run this in your Supabase SQL editor

-- 1. Drop the existing check constraint
-- It might have different names depending on how it was created
DO $$ 
BEGIN
    -- Try to drop constraint with name 'check_approval_status'
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_approval_status') THEN
        ALTER TABLE public.users DROP CONSTRAINT check_approval_status;
    END IF;
    
    -- Try to drop constraint with name 'users_approval_status_check'
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_approval_status_check') THEN
        ALTER TABLE public.users DROP CONSTRAINT users_approval_status_check;
    END IF;
END $$;

-- 2. Add the updated check constraint including 'restricted'
ALTER TABLE public.users ADD CONSTRAINT check_approval_status 
CHECK (approval_status IN ('pending', 'approved', 'rejected', 'restricted'));

-- 3. Add ban_reason column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ban_reason TEXT;

-- 4. Add is_restricted column if it doesn't exist
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_restricted BOOLEAN DEFAULT false;

-- 5. Add index for better performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_ban_reason ON public.users(ban_reason);
CREATE INDEX IF NOT EXISTS idx_users_is_restricted ON public.users(is_restricted);
