-- Apply critical fixes from migration 008_elite_schema_refactor.sql
-- This fixes the submit_quiz_secure function to use quizzes instead of papers

-- 1. Rename papers table to quizzes if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'papers') THEN
        ALTER TABLE public.papers RENAME TO quizzes;
    END IF;
END $$;

-- 2. Add missing columns to quizzes table
ALTER TABLE public.quizzes
ADD COLUMN IF NOT EXISTS subject TEXT NOT NULL DEFAULT 'General' CHECK (subject IN ('Biology', 'Chemistry', 'Physics', 'English', 'General')),
ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Update the submit_quiz_secure function to use the correct table
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

        -- Check if answer is correct
        v_is_correct := (UPPER(v_selected) = UPPER(v_correct_opt));

        -- Update counts
        IF v_is_correct THEN
            v_correct_count := v_correct_count + 1;
            v_score := v_score + 1;
        ELSE
            v_wrong_count := v_wrong_count + 1;
        END IF;

        -- Insert user answer
        INSERT INTO public.user_answers (attempt_id, question_id, selected_option, is_correct)
        VALUES (v_attempt_id, v_q_id, UPPER(v_selected), v_is_correct);
    END LOOP;

    -- Update attempt with final score
    UPDATE public.attempts
    SET score = v_score
    WHERE id = v_attempt_id;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Also update the function signature to match what the frontend expects
-- The frontend is calling with p_paper_id, so let's create an alias function
CREATE OR REPLACE FUNCTION public.submit_quiz_secure(
    p_answers JSONB,
    p_paper_id UUID,
    p_time_per_question JSONB,
    p_time_taken INT,
    p_user_id UUID
)
RETURNS UUID AS $$
BEGIN
    -- Call the main function with correct parameter order
    RETURN public.submit_quiz_secure(p_user_id, p_paper_id, p_time_taken, p_answers);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;