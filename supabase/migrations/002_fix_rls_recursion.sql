-- ============================================
-- FIX: Infinite recursion in RLS policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Create a SECURITY DEFINER helper function
-- This bypasses RLS when checking admin status, breaking the recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 2: Fix USERS table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

-- ============================================
-- Step 3: Fix PAPERS table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage papers" ON public.papers;
CREATE POLICY "Admins can manage papers"
  ON public.papers FOR ALL
  USING (public.is_admin());

-- ============================================
-- Step 4: Fix QUESTIONS table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions"
  ON public.questions FOR ALL
  USING (public.is_admin());

-- ============================================
-- Step 5: Fix OPTIONS table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can manage options" ON public.options;
CREATE POLICY "Admins can manage options"
  ON public.options FOR ALL
  USING (public.is_admin());

-- ============================================
-- Step 6: Fix ATTEMPTS table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can read all attempts" ON public.attempts;
CREATE POLICY "Admins can read all attempts"
  ON public.attempts FOR SELECT
  USING (public.is_admin());

-- ============================================
-- Step 7: Fix ATTEMPT_ANSWERS table policies
-- ============================================
DROP POLICY IF EXISTS "Admins can read all attempt answers" ON public.attempt_answers;
CREATE POLICY "Admins can read all attempt answers"
  ON public.attempt_answers FOR SELECT
  USING (public.is_admin());
