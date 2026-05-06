-- Fix the submit_quiz_secure function to use the correct table name
-- Run this in Supabase SQL Editor

-- First, check if papers table exists and rename it to quizzes
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'papers') THEN
        ALTER TABLE public.papers RENAME TO quizzes;
        RAISE NOTICE 'Renamed papers table to quizzes';
    ELSE
        RAISE NOTICE 'Papers table does not exist, checking for quizzes table';
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'quizzes') THEN
            RAISE EXCEPTION 'Neither papers nor quizzes table exists';
        END IF;
    END IF;
END $$;

-- Add ai_analysis column to user_answers table if it doesn't exist
ALTER TABLE public.user_answers
ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Update the function to use quizzes instead of papers
CREATE OR REPLACE F;;UNCTION public.submit_quiz_secure(
    p_user_id UUID,
    p_quiz_id UUID,
    p_time_taken INT,
    p_answers JSONB
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
    -- Verify quiz exists (using quizzes table)
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
        -- Get correct option from questions table
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