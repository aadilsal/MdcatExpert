-- ============================================
-- PERFORMANCE INDEXES
-- Run this in Supabase SQL Editor
-- ============================================

-- Questions table: filter by paper_id
CREATE INDEX IF NOT EXISTS idx_questions_paper_id ON public.questions(paper_id);

-- Options table: filter by question_id
CREATE INDEX IF NOT EXISTS idx_options_question_id ON public.options(question_id);

-- Attempts table: filter by user_id for dashboard and analytics
CREATE INDEX IF NOT EXISTS idx_attempts_user_id ON public.attempts(user_id);

-- Attempt Answers table: filter by attempt_id for result pages
CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id ON public.attempt_answers(attempt_id);

-- Users table: filter by email for auth/profile checks
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
