export type UserRole = "student" | "admin";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    subscription_type?: "free" | "premium";
    premium_until?: string | null;
    created_at: string;
}

export interface Quiz {
    id: string;
    title: string;
    year: number;
    subject: string;
    is_premium: boolean;
    total_questions: number;
    created_at: string;
}

export interface Question {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: "A" | "B" | "C" | "D";
    subject: string;
    explanation: string | null;
    image_url: string | null;
    year: number;
    created_at: string;
}

// Option is now deprecated as it is flattened into Question, but kept for legacy if needed
// export interface Option { ... }

export interface Attempt {
    id: string;
    user_id: string;
    quiz_id: string;
    score: number;
    correct_answers: number;
    wrong_answers: number;
    time_taken: number;
    created_at: string;
}

export interface UserAnswer {
    id: string;
    attempt_id: string;
    question_id: string;
    selected_option: "A" | "B" | "C" | "D";
    is_correct: boolean;
    created_at: string;
}

// Extended types for joins
export interface QuizQuestion {
    id: string;
    quiz_id: string;
    question_id: string;
    order: number;
}

export interface AttemptWithQuiz extends Attempt {
    quiz: Quiz;
}

export interface UserAnswerWithDetails extends UserAnswer {
    question: Question;
}
