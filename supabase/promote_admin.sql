-- Promote a user to admin
-- Run this in the Supabase SQL Editor after the user has signed up
--
-- 1. First, sign up through the app at /signup
-- 2. Then run this query with your email to get admin access

UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';

-- Verify it worked:
SELECT id, name, email, role FROM public.users WHERE role = 'admin';
