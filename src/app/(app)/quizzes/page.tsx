import Link from "next/link";
import {
    BookOpen,
    Clock,
    CheckCircle,
    ArrowRight,
    Hash,
    Sparkles,
    Search,
    TrendingUp,
    Lock,
} from "lucide-react";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export const dynamic = "force-dynamic";

export default async function QuizzesPage() {
    const token = await convexAuthNextjsToken();
    // Allow browsing even if logged out, but premium gating will require auth.
    const user = token ? await fetchQuery(api.users.getCurrentUserProfile, {}, { token }) : null;
    const isPremiumUser = user?.subscriptionType === "premium";

    const quizzesList = await fetchQuery(api.quizzes.getQuizzes, {});
    const sortedQuizzes = [...(quizzesList ?? [])].sort((a, b) => b.year - a.year);

    // Get attempt counts for this user
    const attemptCounts: Record<string, number> = {};
    if (token && user?._id) {
        const attempts = await fetchQuery(api.attempts.getUserAttempts, { userId: user._id }, { token });
        (attempts ?? []).forEach((a) => {
            const qid = (a.quizId as unknown as string) ?? "";
            if (!qid) return;
            attemptCounts[qid] = (attemptCounts[qid] || 0) + 1;
        });
    }

    const totalQuizzes = quizzesList.length;
    const attemptedUnique = Object.keys(attemptCounts).length;

    return (
        <div className="space-y-12 pb-20">
            {/* Catalog Header Hero */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 p-8 sm:p-12 text-white shadow-2xl">
                {/* Visual Orbs */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4" />

                <div className="relative grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-primary-400">
                            <Sparkles className="w-4 h-4" />
                            Academic Archives
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-none">
                            Preparation <br />
                            <span className="text-primary-500 italic">Library.</span>
                        </h1>
                        <p className="text-gray-400 font-medium max-w-md leading-relaxed">
                            Master Pakistan&apos;s toughest exams with real-time feedback and subject-wise precision.
                        </p>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
                            <p className="text-3xl font-black text-white">{totalQuizzes}</p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Available Quizzes</p>
                        </div>
                        <div className="bg-primary-600 p-6 rounded-3xl shadow-xl shadow-primary-600/20">
                            <p className="text-3xl font-black text-white">{attemptedUnique}</p>
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Mastered So Far</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Catalog Explorer */}
            <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-8">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Browse Quizzes</h2>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Found {totalQuizzes} Verified Exams</p>
                    </div>

                    <div className="relative group max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-primary-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Filter by year or title..."
                            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:border-primary-500 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {sortedQuizzes.length === 0 ? (
                    <div className="bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 p-20 text-center">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-gray-200/50">
                            <BookOpen className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 mb-2">The shelves are empty.</h3>
                        <p className="text-gray-400 font-medium max-w-sm mx-auto">No quizzes have been uploaded yet. Please check back later or contact an administrator.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {sortedQuizzes.map((quiz) => {
                            const quizId = quiz._id as unknown as string;
                            const userAttempts = attemptCounts[quizId] || 0;
                            const isAttempted = userAttempts > 0;
                            const isLocked = quiz.isPremium && !isPremiumUser;

                            return (
                                <Link
                                    key={quizId}
                                    href={isLocked ? "/upgrade" : `/quiz/${quizId}`}
                                    className={`group relative bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-2xl transition-all duration-500 flex flex-col ${isLocked ? "grayscale-[0.5] opacity-90" : "hover:shadow-primary-600/10 hover:border-primary-200"}`}
                                >
                                    {/* Glassmorphic Gradient Overlay on Hover */}
                                    {!isLocked && <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 rounded-[2rem] transition-opacity pointer-events-none" />}

                                    <div className="relative flex items-start justify-between mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isLocked ? "bg-amber-50 text-amber-600 shadow-lg shadow-amber-500/10" : isAttempted
                                            ? "bg-emerald-50 text-emerald-600 shadow-lg shadow-emerald-500/10"
                                            : "bg-gray-50 text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600"
                                            }`}>
                                            {isLocked ? <Lock className="w-7 h-7" /> : isAttempted ? <CheckCircle className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className="px-3 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10">
                                                {quiz.year}
                                            </span>
                                            {isLocked ? (
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                    PREMIUM
                                                </span>
                                            ) : isAttempted && (
                                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-widest">
                                                    MASTERED
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="relative space-y-2 mb-8">
                                        <h3 className="font-black text-gray-900 text-2xl tracking-tight leading-tight group-hover:text-primary-600 transition-colors">
                                            {quiz.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5 text-primary-500">
                                                <Hash className="w-3.5 h-3.5" />
                                                {quiz.subject}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <Hash className="w-3.5 h-3.5" />
                                                {quiz.totalQuestions} Qs
                                            </span>
                                        </div>
                                    </div>

                                    <div className="relative mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                                        <div className="flex -space-x-2">
                                            {/* Micro avatars placeholder or stats */}
                                            <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-gray-400 uppercase">
                                                XP
                                            </div>
                                        </div>

                                        <div className="inline-flex items-center gap-2 text-sm font-black text-primary-600 group-hover:translate-x-1 transition-transform">
                                            {isLocked ? "Unlock Access" : isAttempted ? "Retake Exam" : "Start Prep"}
                                            <ArrowRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Quick Actions / Tips */}
            <div className="grid md:grid-cols-2 gap-8 pt-8">
                <div className="bg-emerald-50 rounded-[2rem] p-8 border border-emerald-100/50 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-lg shadow-emerald-500/5 transition-transform group-hover:scale-110">
                        <TrendingUp className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="font-black text-emerald-900 uppercase tracking-widest text-[10px] mb-1">Consistency Edge</h4>
                        <p className="font-bold text-emerald-800 text-sm leading-tight">Users who practice daily see a 24% score increase.</p>
                    </div>
                </div>
                <div className="bg-primary-50 rounded-[2rem] p-8 border border-primary-100/50 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-primary-600 shadow-lg shadow-primary-500/5 transition-transform group-hover:scale-110">
                        <Sparkles className="w-8 h-8" />
                    </div>
                    <div>
                        <h4 className="font-black text-primary-900 uppercase tracking-widest text-[10px] mb-1">Smart Focus</h4>
                        <p className="font-bold text-primary-800 text-sm leading-tight">Identify your weakest subjects in the Analytics tab.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
