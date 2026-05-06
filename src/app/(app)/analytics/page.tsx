import { BarChart3 } from "lucide-react";
import AnalyticsClient from "./analytics-client";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
    const token = await convexAuthNextjsToken();
    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500">Please log in to view analytics.</p>
            </div>
        );
    }

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-500">Please log in to view analytics.</p>
            </div>
        );
    }

    const attempts = await fetchQuery(api.attempts.getUserAttempts, { userId: me._id }, { token });
    const subjectStats = await fetchQuery(api.attempts.getSubjectPerformance, { userId: me._id }, { token });

    const subjectData = (subjectStats ?? [])
        .map((s) => ({
            subject: s.subject,
            correct: Number(s.correctAnswers ?? 0),
            total: Number(s.totalQuestions ?? 0),
            pct: Number(s.accuracy ?? 0),
        }))
        .sort((a, b) => b.pct - a.pct);

    const totalCorrect = subjectData.reduce((sum, s) => sum + s.correct, 0);
    const totalAnswered = subjectData.reduce((sum, s) => sum + s.total, 0);

    const totalAttempts = (attempts ?? []).length;
    const overallAccuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const totalIncorrect = Math.max(0, totalAnswered - totalCorrect);
    const avgTime = totalAttempts > 0
        ? Math.round((attempts ?? []).reduce((s, a) => s + Number(a.timeTaken ?? 0), 0) / totalAttempts)
        : 0;
    const bestScore = totalAttempts > 0
        ? Math.round(Math.max(...(attempts ?? []).map((a) => {
            const total = Number((a as any)?.paper?.totalQuestions ?? 0);
            return total > 0 ? (Number(a.score ?? 0) / total) * 100 : 0;
        })))
        : 0;

    const scoreTrend = (attempts ?? []).map((a) => {
        const total = Number((a as any)?.paper?.totalQuestions ?? 0);
        return {
            label: (a as any)?.paper?.title ?? "Quiz",
            pct: total > 0 ? Math.round((Number(a.score ?? 0) / total) * 100) : 0,
            date: new Date(a.createdAt ?? Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            timeTaken: Number(a.timeTaken ?? 0),
        };
    });

    const weakestSubject = subjectData.length > 0 ? subjectData[subjectData.length - 1] : null;
    const strongestSubject = subjectData.length > 0 ? subjectData[0] : null;

    const mistakesBySubject: Record<string, number> = {};
    for (const s of subjectData) {
        mistakesBySubject[s.subject] = Math.max(0, Math.round(s.total - s.correct));
    }

    const aiMistakes = {
        total_mistakes: totalIncorrect,
        by_subject: mistakesBySubject,
        insights: [
            weakestSubject ? `Focus on ${weakestSubject.subject} first—small daily practice beats cramming.` : "Do a few quizzes to unlock personalized insights.",
            "Review wrong answers right after each quiz to lock in the concept.",
        ],
    };

    const aiRadar = {
        radar_data: subjectData.map((s) => ({ subject: s.subject, score: Math.round(s.pct), fullMark: 100 })),
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-indigo-600 via-blue-700 to-primary-800 p-8 text-white shadow-lg">
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
                aiMistakes={aiMistakes}
                aiRadar={aiRadar}
            />
        </div>
    );
}
