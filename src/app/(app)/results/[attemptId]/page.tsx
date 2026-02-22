import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    Trophy,
    Clock,
    ArrowLeft,
    RotateCcw,
    CheckCircle,
    XCircle,
    Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

const subjectColors: Record<string, { bg: string; text: string; bar: string }> = {
    Biology: { bg: "bg-green-50", text: "text-green-700", bar: "bg-green-500" },
    Chemistry: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500" },
    Physics: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-500" },
    English: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500" },
};

export default async function ResultsPage({
    params,
}: {
    params: Promise<{ attemptId: string }>;
}) {
    const { attemptId } = await params;
    const supabase = await createClient();

    // Fetch attempt
    const { data: attempt } = await supabase
        .from("attempts")
        .select("*, papers(*)")
        .eq("id", attemptId)
        .single();

    if (!attempt) {
        notFound();
    }

    const paper = attempt.papers as { id: string; title: string; year: number; total_questions: number };

    // Fetch answers with questions and options
    const { data: answers } = await supabase
        .from("attempt_answers")
        .select("*, questions(*, options(*))")
        .eq("attempt_id", attemptId);

    const answersList = answers || [];

    // Calculate stats
    const totalQuestions = paper.total_questions;
    const correctCount = attempt.score;
    const incorrectCount = totalQuestions - correctCount;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
        return `${mins}m ${secs}s`;
    };

    // Subject breakdown
    const subjectStats: Record<string, { correct: number; total: number }> = {};
    answersList.forEach((a) => {
        const question = a.questions as { subject: string };
        if (!question) return;
        const subject = question.subject;
        if (!subjectStats[subject]) {
            subjectStats[subject] = { correct: 0, total: 0 };
        }
        subjectStats[subject].total++;
        if (a.is_correct) subjectStats[subject].correct++;
    });

    // Grade
    const getGrade = (pct: number) => {
        if (pct >= 90) return { label: "Excellent!", color: "text-green-600", emoji: "🏆" };
        if (pct >= 75) return { label: "Great Job!", color: "text-blue-600", emoji: "🎉" };
        if (pct >= 60) return { label: "Good Effort", color: "text-primary-600", emoji: "💪" };
        if (pct >= 40) return { label: "Keep Trying", color: "text-amber-600", emoji: "📚" };
        return { label: "Needs Practice", color: "text-red-600", emoji: "🔄" };
    };

    const grade = getGrade(percentage);

    return (
        <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
            {/* Score Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 p-6 sm:p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative text-center">
                    <p className="text-5xl mb-2">{grade.emoji}</p>
                    <h1 className="text-3xl font-bold mb-1">{grade.label}</h1>
                    <p className="text-primary-200 mb-6">{paper.title}</p>

                    <div className="inline-flex items-baseline gap-1 bg-white/15 backdrop-blur-sm rounded-2xl px-8 py-4 border border-white/20">
                        <span className="text-5xl font-extrabold">{correctCount}</span>
                        <span className="text-2xl text-primary-200 font-medium">/ {totalQuestions}</span>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                        <span className="flex items-center gap-1.5">
                            <Target className="w-4 h-4" />
                            {percentage}% accuracy
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatTime(attempt.time_taken)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-card text-center">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-700">{correctCount}</p>
                    <p className="text-xs text-gray-500">Correct</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-card text-center">
                    <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <p className="text-2xl font-bold text-red-700">{incorrectCount}</p>
                    <p className="text-xs text-gray-500">Incorrect</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-card text-center">
                    <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                        <Trophy className="w-5 h-5 text-primary-600" />
                    </div>
                    <p className="text-2xl font-bold text-primary-700">{percentage}%</p>
                    <p className="text-xs text-gray-500">Score</p>
                </div>
            </div>

            {/* Subject Breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-card p-6">
                <h2 className="font-semibold text-gray-900 mb-5">Subject Performance</h2>
                <div className="space-y-4">
                    {Object.entries(subjectStats).map(([subject, stats]) => {
                        const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                        const colors = subjectColors[subject] || { bg: "bg-gray-50", text: "text-gray-700", bar: "bg-gray-500" };
                        return (
                            <div key={subject}>
                                <div className="flex items-center justify-between text-sm mb-2">
                                    <span className={`font-medium ${colors.text}`}>{subject}</span>
                                    <span className="text-gray-500">
                                        {stats.correct}/{stats.total} ({pct}%)
                                    </span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Question Review */}
            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h2>
                <div className="space-y-4">
                    {answersList.map((answer, idx) => {
                        const question = answer.questions as {
                            id: string;
                            question_text: string;
                            subject: string;
                            options: { id: string; option_text: string; is_correct: boolean }[];
                        };
                        if (!question) return null;

                        return (
                            <div
                                key={answer.id}
                                className={`bg-white rounded-xl border shadow-card overflow-hidden ${answer.is_correct ? "border-green-200" : "border-red-200"
                                    }`}
                            >
                                <div
                                    className={`px-5 py-3 border-b flex items-center justify-between ${answer.is_correct
                                        ? "bg-green-50 border-green-100"
                                        : "bg-red-50 border-red-100"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${answer.is_correct
                                                ? "bg-green-200 text-green-800"
                                                : "bg-red-200 text-red-800"
                                                }`}
                                        >
                                            {idx + 1}
                                        </span>
                                        {answer.is_correct ? (
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <XCircle className="w-4 h-4 text-red-600" />
                                        )}
                                        <span
                                            className={`text-xs font-medium ${answer.is_correct ? "text-green-700" : "text-red-700"
                                                }`}
                                        >
                                            {answer.is_correct ? "Correct" : "Incorrect"}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400">{question.subject}</span>
                                </div>
                                <div className="p-5">
                                    <p className="text-gray-900 font-medium mb-4">
                                        {question.question_text}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {question.options?.map((option, optIdx) => {
                                            const isSelected = answer.selected_option_id === option.id;
                                            const isCorrect = option.is_correct;
                                            let style = "bg-gray-50 border-gray-100 text-gray-600";
                                            if (isCorrect) {
                                                style = "bg-green-50 border-green-200 text-green-800";
                                            } else if (isSelected && !isCorrect) {
                                                style = "bg-red-50 border-red-200 text-red-800";
                                            }

                                            return (
                                                <div
                                                    key={option.id}
                                                    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm border ${style}`}
                                                >
                                                    <span
                                                        className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${isCorrect
                                                            ? "bg-green-200 text-green-800"
                                                            : isSelected
                                                                ? "bg-red-200 text-red-800"
                                                                : "bg-gray-200 text-gray-500"
                                                            }`}
                                                    >
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    <span className="flex-1">{option.option_text}</span>
                                                    {isCorrect && (
                                                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                                    )}
                                                    {isSelected && !isCorrect && (
                                                        <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 pb-8">
                <Link
                    href="/papers"
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Papers
                </Link>
                <Link
                    href={`/quiz/${paper.id}`}
                    className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Retake Quiz
                </Link>
            </div>
        </div>
    );
}
