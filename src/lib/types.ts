export type UserRole = "student" | "admin";

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    created_at: string;
}

export interface Paper {
    id: string;
    title: string;
    year: number;
    total_questions: number;
    created_at: string;
}

export interface Question {
    id: string;
    paper_id: string;
    question_text: string;
    subject: "Biology" | "Chemistry" | "Physics" | "English";
    image_url: string | null;
    created_at: string;
}

export interface Option {
    id: string;
    question_id: string;
    option_text: string;
    is_correct: boolean;
}

export interface Attempt {
    id: string;
    user_id: string;
    paper_id: string;
    score: number;
    time_taken: number;
    created_at: string;
}

export interface AttemptAnswer {
    id: string;
    attempt_id: string;
    question_id: string;
    selected_option_id: string;
    is_correct: boolean;
}

// Extended types for joins
export interface QuestionWithOptions extends Question {
    options: Option[];
}

export interface AttemptWithPaper extends Attempt {
    paper: Paper;
}

export interface AttemptAnswerWithDetails extends AttemptAnswer {
    question: Question;
    selected_option: Option;
}
