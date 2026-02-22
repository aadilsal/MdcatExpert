import { createClient } from "@/lib/supabase/server";
import { BarChart3 } from "lucide-react";
import AnalyticsClient from "./analytics-client";

export const dynamic = "force-dynamic";

interface Attempt {
    id: string;
    score: number;
    time_taken: number;
    created_at: string;
    papers: {
        title: string;
        year: number;
        total_questions: number;
    };
}

interface SubjectPerformance {
    subject: string;
    total_questions: number;
    correct_answers: number;
    accuracy_pct: number;
}

export default async function AnalyticsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500">Please log in to view analytics.</p>
            </div>
        );
    }

    // Fetch attempts with paper info
    const { data: attemptsRaw } = await supabase
        .from("attempts")
        .select("*, papers(title, year, total_questions)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

    const attempts = (attemptsRaw || []) as unknown as Attempt[];

    // Fetch aggregated subject stats directly from the DB view
    const { data: subjectStatsRaw } = await supabase
        .from("user_subject_performance")
        .select("*")
        .eq("user_id", user.id);

    const subjectStats = (subjectStatsRaw || []) as unknown as SubjectPerformance[];

    let totalCorrect = 0;
    let totalAnswered = 0;

    subjectStats.forEach((s) => {
        totalCorrect += s.correct_answers;
        totalAnswered += s.total_questions;
    });

    // Pre-calculate stats for the client
    const totalAttempts = attempts.length;
    const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const totalIncorrect = totalAnswered - totalCorrect;
    const avgTime = totalAttempts > 0
        ? Math.round(attempts.reduce((s, a) => s + a.time_taken, 0) / totalAttempts)
        : 0;
    const bestScore = totalAttempts > 0
        ? Math.round(Math.max(...attempts.map((a) => (a.score / a.papers.total_questions) * 100)))
        : 0;

    // Transform trend data for Recharts
    const scoreTrend = attempts.map((a) => ({
        label: a.papers.title,
        pct: Math.round((a.score / a.papers.total_questions) * 100),
        date: new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timeTaken: a.time_taken,
    }));

    // Subject data sorted by accuracy
    const subjectData = subjectStats
        .map((s) => ({
            subject: s.subject,
            correct: s.correct_answers,
            total: s.total_questions,
            pct: s.accuracy_pct,
        }))
        .sort((a, b) => b.pct - a.pct);

    const weakestSubject = subjectData.length > 0 ? subjectData[subjectData.length - 1] : null;
    const strongestSubject = subjectData.length > 0 ? subjectData[0] : null;

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-700 to-primary-800 p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-sm font-medium mb-4">
                        <BarChart3 className="w-4 h-4" />
                        Performance Analytics
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Your Analytics</h1>
                    <p className="mt-2 text-blue-100 max-w-lg">
                        {totalAttempts > 0
                            ? `Based on ${totalAttempts} quiz${totalAttempts !== 1 ? "zes" : ""} and ${totalAnswered} questions answered.`
                            : "Complete quizzes to start tracking your performance with advanced visualizations."}
                    </p>
                </div>
            </div>

            <AnalyticsClient
                stats={{
                    overallAccuracy,
                    bestScore,
                    avgTime,
                    totalAnswered,
                    totalCorrect,
                    totalIncorrect,
                }}
                scoreTrend={scoreTrend}
                subjectData={subjectData}
                weakestSubject={weakestSubject}
                strongestSubject={strongestSubject}
            />
        </div>
    );
}
