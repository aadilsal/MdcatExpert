-- 008_elite_schema_refactor.sql
-- Refactoring to the 14-point MDCAT Elite Platform specification

-- ============================================
-- 1. USERS TABLE UPDATES
-- ============================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_type TEXT NOT NULL DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS premium_until TIMESTAMPTZ;

-- ============================================
-- 2. QUIZZES TABLE (Formerly PAPERS)
-- ============================================
-- Rename existing table and update structure
ALTER TABLE public.papers RENAME TO quizzes;
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT 'General' CHECK (subject IN ('Biology', 'Chemistry', 'Physics', 'English', 'General')),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- ============================================
-- 3. QUESTIONS TABLE REFACTOR (FLATTENING)
-- ============================================
-- We will keep the original table but modify it to match the new flat structure
-- Note: paper_id is now replaced by quiz_questions mapping for flexibility
ALTER TABLE public.questions 
DROP CONSTRAINT IF EXISTS questions_paper_id_fkey,
DROP COLUMN IF EXISTS paper_id,
ADD COLUMN IF NOT EXISTS option_a TEXT,
ADD COLUMN IF NOT EXISTS option_b TEXT,
ADD COLUMN IF NOT EXISTS option_c TEXT,
ADD COLUMN IF NOT EXISTS option_d TEXT,
ADD COLUMN IF NOT EXISTS correct_option TEXT CHECK (correct_option IN ('A', 'B', 'C', 'D')),
ADD COLUMN IF NOT EXISTS explanation TEXT,
ADD COLUMN IF NOT EXISTS year INT;

-- ============================================
-- 4. QUIZ_QUESTIONS (MAPPING TABLE)
-- ============================================
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  "order" INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(quiz_id, question_id)
);

-- ============================================
-- 5. ATTEMPTS & USER ANSWERS
-- ============================================
-- Rename paper_id to quiz_id in attempts
ALTER TABLE public.attempts RENAME COLUMN paper_id TO quiz_id;
ALTER TABLE public.attempts 
ADD COLUMN IF NOT EXISTS correct_answers INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS wrong_answers INT NOT NULL DEFAULT 0;

-- Create new user_answers table as per spec (replacing attempt_answers)
CREATE TABLE IF NOT EXISTS public.user_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id UUID NOT NULL REFERENCES public.attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option TEXT CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 6. STAGING QUESTIONS (ADMIN REVIEW FLOW)
-- ============================================
CREATE TABLE IF NOT EXISTS public.staging_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID NOT NULL,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_option TEXT,
  subject TEXT,
  explanation TEXT,
  year INT,
  image_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. PAYMENT REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  transaction_id TEXT,
  screenshot_url TEXT,
  amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verified_by UUID REFERENCES public.users(id),
  review_reason TEXT,
  processed_at TIMESTAMPTZ,
  archive_title TEXT,
  archive_year TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 8. STORAGE BUCKETS
-- ============================================
-- Ensure buckets exist (Note: This is usually done via Supabase Dashboard or API, but SQL can help with some config)
-- For the agent: We'll assume storage.buckets insertion is handled via UI or edge logic usually.

-- ============================================
-- 9. RLS POLICIES
-- ============================================
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staging_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_requests ENABLE ROW LEVEL SECURITY;

-- Basic Policies (Admins can do everything)
CREATE POLICY "Admins full access quiz_questions" ON public.quiz_questions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins full access staging_questions" ON public.staging_questions FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins full access payment_requests" ON public.payment_requests FOR ALL USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- Student Policies
CREATE POLICY "Students read quizzes" ON public.quizzes FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Students read questions" ON public.questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Students read quiz_questions" ON public.quiz_questions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Students own user_answers" ON public.user_answers FOR ALL USING (EXISTS (SELECT 1 FROM public.attempts WHERE id = attempt_id AND user_id = auth.uid()));
CREATE POLICY "Students own payment_requests" ON public.payment_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Students insert payment_requests" ON public.payment_requests FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users own notifications" ON public.notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own notifications" ON public.notifications FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- 10. REFACTORED VIEWS & RPCs
-- ============================================

-- Refactored Performance View
CREATE OR REPLACE VIEW public.user_subject_performance AS
SELECT 
    a.user_id,
    q.subject,
    COUNT(ua.id) as total_questions,
    COUNT(ua.id) FILTER (WHERE ua.is_correct = TRUE) as correct_answers,
    CASE 
        WHEN COUNT(ua.id) > 0 
        THEN ROUND((COUNT(ua.id) FILTER (WHERE ua.is_correct = TRUE)::DECIMAL / COUNT(ua.id)) * 100)
        ELSE 0 
    END as accuracy_pct
FROM public.attempts a
JOIN public.user_answers ua ON a.id = ua.attempt_id
JOIN public.questions q ON ua.question_id = q.id
GROUP BY a.user_id, q.subject;

-- Refactored Secure Submission RPC
DROP FUNCTION IF EXISTS public.submit_quiz_secure(uuid,uuid,integer,jsonb);
CREATE OR REPLACE FUNCTION public.submit_quiz_secure(
    p_user_id UUID,
    p_quiz_id UUID,
    p_time_taken INT,
    p_answers JSONB -- Map of {question_id: selected_option_letter}
)
RETURNS UUID AS $$
DECLARE
    v_attempt_id UUID;
    v_score INT := 0;
    v_correct_count INT := 0;
    v_wrong_count INT := 0;
    v_q_id UUID;
    v_selected TEXT;
    v_correct_opt TEXT;
    v_is_correct BOOLEAN;
BEGIN
    -- Verify quiz exists
    IF NOT EXISTS (SELECT 1 FROM public.quizzes WHERE id = p_quiz_id) THEN
        RAISE EXCEPTION 'Quiz not found';
    END IF;

    -- Create Attempt
    INSERT INTO public.attempts (user_id, quiz_id, score, time_taken)
    VALUES (p_user_id, p_quiz_id, 0, p_time_taken)
    RETURNING id INTO v_attempt_id;

    -- Process answers
    FOR v_q_id, v_selected IN SELECT key::UUID, value::TEXT FROM jsonb_each_text(p_answers)
    LOOP
        -- Get correct option from flattened questions table
        SELECT correct_option INTO v_correct_opt 
        FROM public.questions 
        WHERE id = v_q_id;

        v_is_correct := (v_selected = v_correct_opt);

        IF v_is_correct THEN
            v_correct_count := v_correct_count + 1;
        ELSE
            v_wrong_count := v_wrong_count + 1;
        END IF;

        -- Insert into user_answers
        INSERT INTO public.user_answers (attempt_id, question_id, selected_option, is_correct)
        VALUES (v_attempt_id, v_q_id, v_selected, v_is_correct);
    END LOOP;

    -- Update Attempt with final metrics
    UPDATE public.attempts 
    SET score = v_correct_count, 
        correct_answers = v_correct_count, 
        wrong_answers = v_wrong_count 
    WHERE id = v_attempt_id;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
