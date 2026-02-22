-- Add missing columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add comment for documentation
COMMENT ON COLUMN public.users.phone IS 'User contact phone number';
COMMENT ON COLUMN public.users.updated_at IS 'Last time the user profile was updated';
