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
    Zap,
    Sparkles,
    Gauge,
    AlertTriangle,
    History,
} from "lucide-react";
import AIInsightCard from "../ai-insight-card";

export const dynamic = "force-dynamic";

const subjectColors: Record<string, { bg: string; text: string; bar: string; glow: string }> = {
    Biology: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500", glow: "shadow-emerald-500/20" },
    Chemistry: { bg: "bg-purple-50", text: "text-purple-700", bar: "bg-purple-500", glow: "shadow-purple-500/20" },
    Physics: { bg: "bg-blue-50", text: "text-blue-700", bar: "bg-blue-500", glow: "shadow-blue-500/20" },
    English: { bg: "bg-amber-50", text: "text-amber-700", bar: "bg-amber-500", glow: "shadow-amber-500/20" },
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

    if (!attempt) notFound();

    const paper = attempt.papers as { id: string; title: string; year: number; total_questions: number };

    // Fetch answers with detailed metadata
    const { data: answers } = await supabase
        .from("attempt_answers")
        .select("*, questions(*, options(*))")
        .eq("attempt_id", attemptId);

    const answersList = answers || [];

    // Stats Calculation
    const totalQuestions = paper.total_questions;
    const correctCount = attempt.score;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    // Time Analysis
    const totalSeconds = attempt.time_taken;
    const avgTimePerQuestion = totalQuestions > 0 ? totalSeconds / totalQuestions : 0;

    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`;
        return `${mins}m ${secs}s`;
    };

    // Subject & Time Breakdown
    const subjectStats: Record<string, { correct: number; total: number; time: number }> = {};
    answersList.forEach((a) => {
        const question = a.questions as { subject: string };
        if (!question) return;
        const subject = question.subject;
        if (!subjectStats[subject]) {
            subjectStats[subject] = { correct: 0, total: 0, time: 0 };
        }
        subjectStats[subject].total++;
        subjectStats[subject].time += (a.time_spent || 0);
        if (a.is_correct) subjectStats[subject].correct++;
    });

    const getGrade = (pct: number) => {
        if (pct >= 90) return { label: "Elite Dominance", status: "MASTER", emoji: "🏆", color: "from-primary-600 to-blue-800" };
        if (pct >= 75) return { label: "High Proficiency", status: "PROFICIENT", emoji: "🔥", color: "from-emerald-600 to-teal-800" };
        if (pct >= 60) return { label: "Solid Foundation", status: "AVERAGE", emoji: "💪", color: "from-amber-600 to-orange-800" };
        return { label: "Draft Stage", status: "RETRY", emoji: "📚", color: "from-red-600 to-rose-800" };
    };

    const grade = getGrade(percentage);

    return (
        <div className="animate-fade-in max-w-5xl mx-auto space-y-12 pb-24 px-4">

            {/* Elite Score Hero */}
            <div className={`relative overflow-hidden rounded-[3rem] bg-gradient-to-br ${grade.color} p-10 sm:p-16 text-white shadow-2xl transition-all duration-700`}>
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

                <div className="relative flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-[0.3em] mb-8">
                        <Sparkles className="w-3.5 h-3.5 text-primary-200" />
                        Session Ingestion Compiled
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter mb-4 flex items-center gap-4">
                        {grade.label} <span className="text-3xl not-italic opacity-40">{grade.emoji}</span>
                    </h1>

                    <p className="text-white/60 font-black uppercase tracking-widest text-xs mb-12">
                        Archive: {paper.title} • Grade: {grade.status}
                    </p>

                    <div className="relative group">
                        <div className="absolute inset-0 bg-white/20 blur-3xl rounded-full scale-150 group-hover:bg-white/30 transition-all duration-700" />
                        <div className="relative flex items-baseline gap-2 bg-white text-gray-900 rounded-[2.5rem] px-12 py-8 shadow-2xl shadow-black/20 border-4 border-white/20">
                            <span className="text-7xl font-black italic">{correctCount}</span>
                            <span className="text-3xl text-gray-400 font-bold">/ {totalQuestions}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-16 w-full max-w-3xl">
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-black italic">{percentage}%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Accuracy</p>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-black italic">{formatTime(totalSeconds)}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Total Meta-Time</p>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-black italic">{Math.round(avgTimePerQuestion)}s</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Avg/Question</p>
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-2xl font-black italic">{correctCount}</p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Commits</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Subject Tactical Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-12">
                    <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-xl shadow-gray-200/20">
                        <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-900 text-white flex items-center justify-center font-black">
                                    <Gauge className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black tracking-tight text-gray-900">Tactical Performance</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cross-Subject Diagnostic</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {Object.entries(subjectStats).map(([subject, stats]) => {
                                const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                                const avgSubjectTime = stats.total > 0 ? stats.time / stats.total : 0;
                                const colors = subjectColors[subject] || subjectColors.Physics;

                                return (
                                    <div key={subject} className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${colors.bar} ${colors.glow}`} />
                                                <span className="text-lg font-black italic text-gray-900">{subject}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Density</p>
                                                    <p className="font-black text-gray-900">{Math.round(avgSubjectTime)}s/q</p>
                                                </div>
                                                <div className="h-6 w-px bg-gray-100" />
                                                <span className="text-2xl font-black text-gray-900 italic">{pct}%</span>
                                            </div>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                                            <div
                                                className={`h-full ${colors.bar} rounded-full transition-all duration-1000 ${colors.glow}`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 leading-relaxed italic">
                                            {pct > 80 ? "Dominant performance. Strategy: Maintain current retention." : "Efficiency gap detected. Strategy: Target high-value misconceptions."}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Review Trace */}
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center">
                        <History className="w-5 h-5 text-primary-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-gray-900">Analysis Trace</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question-by-Question Diagnostic</p>
                    </div>
                </div>

                <div className="grid gap-8">
                    {answersList.map((answer, idx) => {
                        const question = answer.questions as any;
                        if (!question) return null;

                        const isMistake = !answer.is_correct;
                        const timeStatus = answer.time_spent > (avgTimePerQuestion * 1.5) ? "Slow" : answer.time_spent < (avgTimePerQuestion * 0.5) ? "Fast" : "Optimal";

                        return (
                            <div
                                key={answer.id}
                                className={`group bg-white rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isMistake ? "border-red-100 shadow-xl shadow-red-500/5 hover:border-red-200" : "border-gray-100 hover:border-emerald-200"}`}
                            >
                                {/* Compact Card Header */}
                                <div className={`px-10 py-6 flex items-center justify-between border-b ${isMistake ? "bg-red-50/30 border-red-50" : "bg-emerald-50/30 border-emerald-50"}`}>
                                    <div className="flex items-center gap-6">
                                        <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black italic ${isMistake ? "bg-red-500 text-white" : "bg-emerald-500 text-white"}`}>
                                            {idx + 1}
                                        </span>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Execution Metric</span>
                                            <div className="flex items-center gap-2">
                                                <Clock className={`w-3.5 h-3.5 ${isMistake ? "text-red-400" : "text-emerald-400"}`} />
                                                <span className="text-sm font-black italic text-gray-900">{answer.time_spent}s</span>
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${timeStatus === "Slow" ? "bg-red-100 text-red-600" :
                                                        timeStatus === "Fast" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                                    }`}>
                                                    {timeStatus}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">{question.subject}</span>
                                </div>

                                <div className="p-10">
                                    <h3 className="text-xl sm:text-2xl font-bold leading-tight text-gray-900 mb-8 italic">
                                        {question.question_text}
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {question.options?.map((option: any, optIdx: number) => {
                                            const isSelected = answer.selected_option_id === option.id;
                                            const isCorrect = option.is_correct;

                                            return (
                                                <div
                                                    key={option.id}
                                                    className={`flex items-center gap-6 px-6 py-4 rounded-2xl border-2 transition-all ${isCorrect ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-900" :
                                                            isSelected && !isCorrect ? "bg-red-500/5 border-red-500/20 text-red-900" :
                                                                "bg-gray-50 border-gray-100 text-gray-500 opacity-60"
                                                        }`}
                                                >
                                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${isCorrect ? "bg-emerald-500 text-white" :
                                                            isSelected ? "bg-red-500 text-white" : "bg-gray-200 text-gray-500"
                                                        }`}>
                                                        {String.fromCharCode(65 + optIdx)}
                                                    </span>
                                                    <span className="flex-1 font-bold text-sm tracking-tight">{option.option_text}</span>
                                                    {isCorrect && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />}
                                                    {isSelected && !isCorrect && <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* AI Insight Injection */}
                                    {isMistake && (
                                        <AIInsightCard
                                            answerId={answer.id}
                                            initialInsight={answer.ai_analysis}
                                        />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Tactical Actions */}
            <div className="flex items-center justify-center gap-8 py-12">
                <Link
                    href="/papers"
                    className="flex items-center gap-3 px-10 py-5 bg-white border-2 border-gray-100 text-gray-900 font-black uppercase tracking-widest text-xs rounded-3xl hover:bg-gray-50 hover:border-gray-900 transition-all active:scale-95 shadow-xl shadow-gray-200/20"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Archive
                </Link>
                <Link
                    href={`/quiz/${paper.id}`}
                    className="flex items-center gap-3 px-10 py-5 bg-gray-900 text-white font-black uppercase tracking-widest text-xs rounded-3xl hover:bg-black transition-all active:scale-95 shadow-2xl shadow-black/30"
                >
                    <RotateCcw className="w-4 h-4 italic" />
                    Recalibrate Session
                </Link>
            </div>
        </div>
    );
}
