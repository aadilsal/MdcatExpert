-- ============================================
-- ENTERPRISE LOGIC: RPCs & VIEWS
-- Fixes: N+1 queries, Atomicity, and OOM Risks
-- ============================================

-- 1. Optimized View for User Subject Performance
-- Aggregates correct/total counts in DB to avoid fetching raw rows to Node.js
CREATE OR REPLACE VIEW public.user_subject_performance AS
SELECT 
    a.user_id,
    q.subject,
    COUNT(aa.id) as total_questions,
    COUNT(aa.id) FILTER (WHERE aa.is_correct = TRUE) as correct_answers,
    CASE 
        WHEN COUNT(aa.id) > 0 
        THEN ROUND((COUNT(aa.id) FILTER (WHERE aa.is_correct = TRUE)::DECIMAL / COUNT(aa.id)) * 100)
        ELSE 0 
    END as accuracy_pct
FROM public.attempts a
JOIN public.attempt_answers aa ON a.id = aa.attempt_id
JOIN public.questions q ON aa.question_id = q.id
GROUP BY a.user_id, q.subject;

-- 2. RPC: Batch Upload Paper
-- Fixes N+1 and ensures atomicity for paper creation
CREATE OR REPLACE FUNCTION public.upload_paper_batch(
    p_title TEXT,
    p_year INT,
    p_total_questions INT,
    p_questions JSONB -- Array of {question_text, subject, image_url, options: [{text, is_correct}]}
)
RETURNS UUID AS $$
DECLARE
    v_paper_id UUID;
    v_q_record JSONB;
    v_opt_record JSONB;
    v_question_id UUID;
BEGIN
    -- Insert Paper
    INSERT INTO public.papers (title, year, total_questions)
    VALUES (p_title, p_year, p_total_questions)
    RETURNING id INTO v_paper_id;

    -- Loop through questions
    FOR v_q_record IN SELECT * FROM jsonb_array_elements(p_questions)
    LOOP
        -- Insert Question
        INSERT INTO public.questions (paper_id, question_text, subject, image_url)
        VALUES (
            v_paper_id, 
            v_q_record->>'question_text', 
            v_q_record->>'subject', 
            v_q_record->>'image_url'
        )
        RETURNING id INTO v_question_id;

        -- Insert Options
        FOR v_opt_record IN SELECT * FROM jsonb_array_elements(v_q_record->'options')
        LOOP
            INSERT INTO public.options (question_id, option_text, is_correct)
            VALUES (
                v_question_id, 
                v_opt_record->>'text', 
                (v_opt_record->>'is_correct')::BOOLEAN
            );
        END LOOP;
    END LOOP;

    RETURN v_paper_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Submit Quiz Securely
-- Ensures score calculation and storage happen in one transaction
CREATE OR REPLACE FUNCTION public.submit_quiz_secure(
    p_user_id UUID,
    p_paper_id UUID,
    p_time_taken INT,
    p_answers JSONB -- Map of {question_id: selected_option_id}
)
RETURNS UUID AS $$
DECLARE
    v_attempt_id UUID;
    v_score INT := 0;
    v_q_id UUID;
    v_opt_id UUID;
    v_is_correct BOOLEAN;
BEGIN
    -- Verify paper exists
    IF NOT EXISTS (SELECT 1 FROM public.papers WHERE id = p_paper_id) THEN
        RAISE EXCEPTION 'Paper not found';
    END IF;

    -- Create Attempt (placeholder score)
    INSERT INTO public.attempts (user_id, paper_id, score, time_taken)
    VALUES (p_user_id, p_paper_id, 0, p_time_taken)
    RETURNING id INTO v_attempt_id;

    -- Process answers and calculate real score
    FOR v_q_id, v_opt_id IN SELECT key::UUID, value::TEXT::UUID FROM jsonb_each_text(p_answers)
    LOOP
        -- Check if correct
        SELECT is_correct INTO v_is_correct 
        FROM public.options 
        WHERE id = v_opt_id AND question_id = v_q_id;

        IF v_is_correct THEN
            v_score := v_score + 1;
        END IF;

        -- Insert Answer record
        INSERT INTO public.attempt_answers (attempt_id, question_id, selected_option_id, is_correct)
        VALUES (v_attempt_id, v_q_id, v_opt_id, COALESCE(v_is_correct, FALSE));
    END LOOP;

    -- Update Attempt with final score
    UPDATE public.attempts SET score = v_score WHERE id = v_attempt_id;

    RETURN v_attempt_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
