import { redirect } from "next/navigation";
import Link from "next/link";
import SubscriptionStatusBanner from "@/components/subscription-status-banner";
import {
    Target,
    TrendingUp,
    Award,
    AlertTriangle,
    FileText,
    ArrowRight,
    Clock,
    Calendar,
    BookOpen,
} from "lucide-react";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";

export const dynamic = "force-dynamic";

interface Attempt {
    _id: string;
    score: number;
    timeTaken: number;
    createdAt: number;
    quizId: string;
    paper: {
        title: string;
        totalQuestions: number;
    } | null;
}

interface SubjectPerformance {
    subject: string;
    totalQuestions: number;
    correctAnswers: number;
    accuracy: number;
}

const subjectColors: Record<string, { bar: string }> = {
    Biology: { bar: "bg-emerald-500" },
    Chemistry: { bar: "bg-purple-500" },
    Physics: { bar: "bg-blue-500" },
    English: { bar: "bg-amber-500" },
};

export default async function StudentDashboardPage() {
    const token = await convexAuthNextjsToken();
    if (!token) {
        redirect("/login");
    }

    const user = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!user) {
        redirect("/login");
    }

    const [attemptsRaw, subjectStats] = await Promise.all([
        fetchQuery(api.attempts.getUserAttempts, { userId: user._id as Id<"users"> }, { token }),
        fetchQuery(api.attempts.getSubjectPerformance, { userId: user._id as Id<"users"> }, { token }),
    ]);

    const attempts = (attemptsRaw ?? []) as Attempt[];
    const subjectStatsList = (subjectStats ?? []) as SubjectPerformance[];

    const userName = user.name || "Student";
    const subscriptionType = user.subscriptionType || "free";
    const premiumUntil = user.premiumUntil ? String(user.premiumUntil) : null;
    const hasPendingPayment = false;
    const pendingPaymentId = null;

    const totalAttempts = attempts.length;
    const avgScore =
        totalAttempts > 0
            ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / totalAttempts)
            : 0;
    const bestScore = totalAttempts > 0 ? Math.max(...attempts.map((a) => a.score)) : 0;

    const weakest = [...subjectStatsList].sort((a, b) => a.accuracy - b.accuracy)[0];
    const weakestSubject = weakest?.subject || "—";
    const weakestPct = weakest?.accuracy || 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="animate-fade-in space-y-8">
            <SubscriptionStatusBanner
                subscriptionType={subscriptionType}
                premiumUntil={premiumUntil}
                hasPendingPayment={hasPendingPayment}
                paymentRequestId={pendingPaymentId ?? undefined}
            />

            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 via-primary-700 to-blue-800 p-6 sm:p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-56 h-56 bg-primary-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            Welcome back, {userName}! 👋
                        </h1>
                        <p className="mt-2 text-primary-100 max-w-lg">
                            {totalAttempts > 0
                                ? `You've completed ${totalAttempts} quiz${totalAttempts !== 1 ? "zes" : ""} so far. Keep it up!`
                                : "Start practicing to see your performance stats here."}
                        </p>
                    </div>
                    <Link
                        href="/quizzes"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white font-medium rounded-xl hover:bg-white/25 transition-all border border-white/20"
                    >
                        Browse Quizzes
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Total Attempts",
                        value: totalAttempts.toString(),
                        subtitle: "quizzes taken",
                        icon: Target,
                        bgLight: "bg-blue-50",
                        textColor: "text-blue-700",
                    },
                    {
                        label: "Average Score",
                        value: totalAttempts > 0 ? `${avgScore}%` : "—",
                        subtitle: "overall accuracy",
                        icon: TrendingUp,
                        bgLight: "bg-emerald-50",
                        textColor: "text-emerald-700",
                    },
                    {
                        label: "Best Score",
                        value: totalAttempts > 0 ? `${bestScore}%` : "—",
                        subtitle: "highest accuracy",
                        icon: Award,
                        bgLight: "bg-purple-50",
                        textColor: "text-purple-700",
                    },
                    {
                        label: "Weakest Subject",
                        value: weakestSubject,
                        subtitle: totalAttempts > 0 ? `${Math.round(weakestPct)}% accuracy` : "needs data",
                        icon: AlertTriangle,
                        bgLight: "bg-amber-50",
                        textColor: "text-amber-700",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                            <div
                                className={`w-10 h-10 rounded-xl ${stat.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                                <stat.icon className={`w-5 h-5 ${stat.textColor}`} />
                            </div>
                        </div>
                        <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{stat.subtitle}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900">Recent Attempts</h2>
                        {attempts.length > 5 && (
                            <span className="text-sm text-gray-400">Showing latest 5</span>
                        )}
                    </div>

                    {attempts.length === 0 ? (
                        <div className="p-10 text-center">
                            <div className="w-16 h-16 bg-linear-to-br from-gray-100 to-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <FileText className="w-8 h-8 text-gray-300" />
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1">No attempts yet</h3>
                            <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">
                                Start practicing by taking your first MDCAT quiz.
                            </p>
                            <Link
                                href="/quizzes"
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors shadow-sm text-sm"
                            >
                                Take a Quiz
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {attempts.slice(0, 5).map((attempt) => {
                                const totalQ = attempt.paper?.totalQuestions ?? 0;
                                const pct =
                                    totalQ > 0 ? Math.round((attempt.score / totalQ) * 100) : 0;
                                const title = attempt.paper?.title ?? "Quiz";
                                return (
                                    <Link
                                        key={attempt._id}
                                        href={`/results/${attempt._id}`}
                                        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <div
                                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${pct >= 70 ? "bg-green-100" : pct >= 50 ? "bg-amber-100" : "bg-red-100"}`}
                                        >
                                            <BookOpen
                                                className={`w-5 h-5 ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{title}</p>
                                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {new Date(attempt.createdAt).toLocaleDateString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatTime(attempt.timeTaken)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p
                                                className={`font-bold text-sm ${pct >= 70 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500"}`}
                                            >
                                                {attempt.score}/{totalQ || "—"}
                                            </p>
                                            <p className="text-xs text-gray-400">{totalQ ? `${pct}%` : "—"}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Subject Accuracy</h2>
                    </div>
                    <div className="p-5 space-y-4">
                        {["Biology", "Chemistry", "Physics", "English"].map((subject) => {
                            const stats = subjectStatsList.find((s) => s.subject === subject);
                            const pct = stats?.accuracy || 0;
                            const colors = subjectColors[subject];
                            const isWeakest = subject === weakestSubject && totalAttempts > 0;

                            return (
                                <div key={subject}>
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                        <span className="font-medium text-gray-700 flex items-center gap-1.5">
                                            {subject}
                                            {isWeakest && (
                                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase">
                                                    Weak
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-gray-400">{stats ? `${Math.round(pct)}%` : "—"}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${colors.bar} rounded-full transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {totalAttempts === 0 && (
                            <p className="text-xs text-gray-400 text-center pt-2">
                                Complete quizzes to see your subject accuracy
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
