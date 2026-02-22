-- AI Mistake Analyzer Schema Extensions

-- Add time_spent (in seconds) to track how long a student spent on a specific question
ALTER TABLE public.attempt_answers ADD COLUMN IF NOT EXISTS time_spent INT DEFAULT 0;

-- Add ai_analysis to store cached misconception insights and pattern reasoning
ALTER TABLE public.attempt_answers ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_attempt_answers_time_spent ON public.attempt_answers(time_spent);

COMMENT ON COLUMN public.attempt_answers.time_spent IS 'Seconds spent by the user on this specific question';
COMMENT ON COLUMN public.attempt_answers.ai_analysis IS 'AI-generated insights regarding misconceptions or reasoning patterns';

-- Redefine RPC to accept per-question timing
CREATE OR REPLACE FUNCTION public.submit_quiz_secure(
    p_user_id UUID,
    p_paper_id UUID,
    p_time_taken INT,
    p_answers JSONB, -- Map of {question_id: selected_option_id}
    p_time_per_question JSONB -- Map of {question_id: seconds_spent}
)
RETURNS UUID AS $$
DECLARE
    v_attempt_id UUID;
    v_score INT := 0;
    v_q_id UUID;
    v_opt_id UUID;
    v_time_spent INT;
    v_is_correct BOOLEAN;
BEGIN
    -- Verify paper exists
    IF NOT EXISTS (SELECT 1 FROM public.papers WHERE id = p_paper_id) THEN
        RAISE EXCEPTION 'Paper not found';
    END IF;

    -- Create Attempt
    INSERT INTO public.attempts (user_id, paper_id, score, time_taken)
    VALUES (p_user_id, p_paper_id, 0, p_time_taken)
    RETURNING id INTO v_attempt_id;

    -- Process answers
    FOR v_q_id, v_opt_id IN SELECT key::UUID, value::TEXT::UUID FROM jsonb_each_text(p_answers)
    LOOP
        -- Get time spent for this specific question
        v_time_spent := COALESCE((p_time_per_question->>(v_q_id::TEXT))::INT, 0);

        -- Check if correct
        SELECT is_correct INTO v_is_correct 
        FROM public.options 
        WHERE id = v_opt_id AND question_id = v_q_id;

        IF v_is_correct THEN
            v_score := v_score + 1;
        END IF;

        -- Insert Answer record with time_spent
        INSERT INTO public.attempt_answers (attempt_id, question_id, selected_option_id, is_correct, time_spent)
        VALUES (v_attempt_id, v_q_id, v_opt_id, COALESCE(v_is_correct, FALSE), v_time_spent);
    END LOOP;

    -- Update Attempt with final score
    UPDATE public.attempts SET score = v_score WHERE id = v_attempt_id;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
