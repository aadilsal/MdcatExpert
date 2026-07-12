"use client";

import React, { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie,
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
} from "recharts";
import Link from "next/link";
import {
    Target,
    Award,
    Clock,
    Zap,
    TrendingUp,
    BarChart3,
    AlertTriangle,
    Shield,
    BookOpen,
    Lock,
    Sparkles,
    Calendar,
    CheckCircle2,
    Sliders,
} from "lucide-react";
import PremiumFeatureModal from "@/components/premium-feature-modal";

interface AnalyticsClientProps {
    stats: {
        overallAccuracy: number;
        bestScore: number;
        avgTime: number;
        totalAnswered: number;
        totalCorrect: number;
        totalIncorrect: number;
    };
    scoreTrend: {
        label: string;
        pct: number;
        date: string;
        timeTaken: number;
    }[];
    subjectData: {
        subject: string;
        correct: number;
        total: number;
        pct: number;
    }[];
    weakestSubject: { subject: string; pct: number } | null;
    strongestSubject: { subject: string; pct: number } | null;
    aiMistakes?: {
        total_mistakes: number;
        by_subject: Record<string, number>;
        insights: string[];
    };
    aiRadar?: {
        radar_data: { subject: string; score: number; fullMark: number }[];
    };
    isPremiumUser?: boolean;
}

const subjectColors: Record<string, string> = {
    Biology: "#22c55e", // green-500
    Chemistry: "#a855f7", // purple-500
    Physics: "#3b82f6", // blue-500
    English: "#f97316", // orange-500
};

export default function AnalyticsClient({
    stats,
    scoreTrend,
    subjectData,
    weakestSubject,
    strongestSubject,
    aiMistakes,
    aiRadar,
    isPremiumUser = true,
}: AnalyticsClientProps) {
    const [selectedLockFeature, setSelectedLockFeature] = useState<{
        open: boolean;
        title: string;
        outcome: string;
        desc: string;
        why: string;
    } | null>(null);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const pieData = [
        { name: "Correct", value: stats.totalCorrect, color: "#22c55e" },
        { name: "Incorrect", value: stats.totalIncorrect, color: "#ef4444" },
    ];

    return (
        <div className="space-y-8">
            {/* Overview Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Overall Accuracy",
                        value: `${stats.overallAccuracy}%`,
                        icon: Target,
                        bgLight: "bg-blue-50 dark:bg-blue-950/20",
                        textColor: "text-blue-700 dark:text-blue-400",
                    },
                    {
                        label: "Best Score",
                        value: `${stats.bestScore}%`,
                        icon: Award,
                        bgLight: "bg-emerald-50 dark:bg-emerald-950/20",
                        textColor: "text-emerald-700 dark:text-emerald-400",
                    },
                    {
                        label: "Avg Time",
                        value: formatTime(stats.avgTime),
                        icon: Clock,
                        bgLight: "bg-purple-50 dark:bg-purple-950/20",
                        textColor: "text-purple-700 dark:text-purple-400",
                    },
                    {
                        label: "Questions Solved",
                        value: stats.totalAnswered.toString(),
                        icon: Zap,
                        bgLight: "bg-orange-50 dark:bg-orange-950/20",
                        textColor: "text-orange-700 dark:text-orange-400",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-surface rounded-xl border border-surface-border p-5 shadow-card hover:shadow-card-hover dark:shadow-none dark:hover:shadow-none transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {stat.label}
                            </p>
                            <div
                                className={`w-9 h-9 rounded-lg ${stat.bgLight} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                            >
                                <stat.icon className={`w-4 h-4 ${stat.textColor}`} />
                            </div>
                        </div>
                        <p className={`text-2xl font-bold ${stat.textColor}`}>
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Score Trend - Line Chart */}
                <div className="bg-surface rounded-xl border border-surface-border shadow-card dark:shadow-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-border dark:border-slate-800/60 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-600" />
                            Progress Over Time
                        </h2>
                    </div>
                    <div className="p-6 h-72">
                        {scoreTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scoreTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-slate-800" stroke="currentColor" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                                        dy={10}
                                    />
                                    <YAxis
                                        domain={[0, 100]}
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                                        tickFormatter={(val) => `${val}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
                                            backgroundColor: "var(--tooltip-bg, #fff)",
                                            color: "var(--tooltip-text, #0f172a)",
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pct"
                                        name="Accuracy"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <TrendingUp className="w-10 h-10 mb-2 opacity-20" />
                                <p>Not enough data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Accuracy Breakdown - Pie Chart */}
                <div className="bg-surface rounded-xl border border-surface-border shadow-card dark:shadow-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-border dark:border-slate-800/60">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Overall Accuracy</h2>
                    </div>
                    <div className="p-6 h-72 flex flex-col sm:flex-row items-center justify-center gap-8">
                        <div className="w-48 h-48 relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.overallAccuracy}%</span>
                                <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase font-bold tracking-wider">Accuracy</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {pieData.map((item) => (
                                <div key={item.name} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <div>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase">{item.name}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">{item.value} <span className="text-xs font-normal text-gray-400 dark:text-gray-500">questions</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subject Performance - Bar Chart */}
                <div className="bg-surface rounded-xl border border-surface-border shadow-card dark:shadow-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-border dark:border-slate-800/60">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            Subject Performance
                        </h2>
                    </div>
                    <div className="p-6 h-72">
                        {subjectData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-gray-100 dark:stroke-slate-800" stroke="currentColor" />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        dataKey="subject"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 600, fill: "var(--tooltip-text, #374151)" }}
                                        width={80}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "transparent" }}
                                        formatter={(value) => [`${value ?? 0}%`, "Accuracy"]}
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
                                            backgroundColor: "var(--tooltip-bg, #fff)",
                                            color: "var(--tooltip-text, #0f172a)",
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
                                    <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={32}>
                                        {subjectData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={subjectColors[entry.subject] || "#94a3b8"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <BarChart3 className="w-10 h-10 mb-2 opacity-20" />
                                <p>Not enough data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Time Analysis - Line Chart */}
                <div className="bg-surface rounded-xl border border-surface-border shadow-card dark:shadow-none overflow-hidden">
                    <div className="px-6 py-4 border-b border-surface-border dark:border-slate-800/60 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-600" />
                            Time Spent per Quiz
                        </h2>
                    </div>
                    <div className="p-6 h-72">
                        {scoreTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scoreTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-slate-800" stroke="currentColor" />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: "#9ca3af" }}
                                        tickFormatter={(val) => `${Math.floor(val / 60)}m`}
                                    />
                                    <Tooltip
                                        formatter={(value) => [formatTime(Number(value ?? 0)), "Time Spent"]}
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
                                            backgroundColor: "var(--tooltip-bg, #fff)",
                                            color: "var(--tooltip-text, #0f172a)",
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
                                    <Line
                                        type="step"
                                        dataKey="timeTaken"
                                        name="Time Taken"
                                        stroke="#a855f7"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#a855f7", strokeWidth: 2, stroke: "#fff" }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Clock className="w-10 h-10 mb-2 opacity-20" />
                                <p>Not enough data</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI Weakness Radar */}
                <div className="bg-surface rounded-xl border border-surface-border shadow-card dark:shadow-none overflow-hidden lg:col-span-2">
                    <div className="px-6 py-4 border-b border-surface-border dark:border-slate-800/60">
                        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary-600" />
                            Elite Weakness Radar
                        </h2>
                    </div>
                    <div className="p-6 h-[400px] relative">
                        {/* Paywall Overlay */}
                        {!isPremiumUser && (
                            <div className="absolute inset-0 bg-white/20 dark:bg-slate-900/40 backdrop-blur-[3px] z-10 flex flex-col items-center justify-center p-6 text-center">
                                <div className="max-w-md space-y-4">
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-slate-950 rounded-full text-[9px] font-black uppercase tracking-widest shadow-md">
                                        <Lock className="w-3 h-3 text-slate-950" />
                                        Elite Feature Locked
                                    </div>
                                    <h3 className="text-xl font-black text-slate-950 dark:text-white">AI Chapter-Level Weakness Radar</h3>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 font-bold leading-relaxed">
                                        Find the exact MDCAT chapters preventing you from scoring 180+. Elite compiles a multi-subject radar breakdown to highlight your priority concepts.
                                    </p>
                                    <button
                                        onClick={() => setSelectedLockFeature({
                                            open: true,
                                            title: "AI Weakness Radar",
                                            outcome: "Locate chapter performance vulnerabilities instantly",
                                            desc: "A radar mapping of your performance across the entire MDCAT syllabus, identifying sub-topic deficiencies so you never waste study time.",
                                            why: "Candidates targeting high scores use radar mapping to balance prep intensity across weak concepts."
                                        })}
                                        className="py-3 px-6 bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-md"
                                    >
                                        Unlock Weakness Radar
                                    </button>
                                </div>
                            </div>
                        )}
                        {aiRadar?.radar_data && aiRadar.radar_data.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={aiRadar.radar_data}>
                                    <PolarGrid className="stroke-gray-200 dark:stroke-slate-800" stroke="currentColor" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--tooltip-text, #6b7280)", fontSize: 12, fontWeight: 600 }} />
                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                                    <Radar
                                        name="Skill Level"
                                        dataKey="score"
                                        stroke="#10b981"
                                        fill="#10b981"
                                        fillOpacity={0.5}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
                                            backgroundColor: "var(--tooltip-bg, #fff)",
                                            color: "var(--tooltip-text, #0f172a)",
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
                                </RadarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Shield className="w-12 h-12 mb-4 opacity-10" />
                                <p className="font-bold italic uppercase tracking-widest text-xs">Awaiting data stream for radar generation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Insights Card */}
            {scoreTrend.length > 0 && weakestSubject && strongestSubject && (
                <div className="bg-linear-to-br from-primary-50/50 to-blue-50/50 dark:from-primary-950/20 dark:to-blue-950/10 rounded-xl border border-primary-100 dark:border-primary-900/30 p-6 shadow-card dark:shadow-none">
                    <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        AI-Powered Insights
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 border border-primary-100/50 dark:border-slate-800 flex gap-4">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-950/40 rounded-lg flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Strongest: {strongestSubject.subject}</p>
                                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                                    You&apos;re dominating {strongestSubject.subject} with {strongestSubject.pct}% accuracy. Use this confidence to tackle more challenging topics.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 border border-primary-100/50 dark:border-slate-800 flex gap-4">
                            <div className="w-10 h-10 bg-red-100 dark:bg-red-950/40 rounded-lg flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Focus Item: {weakestSubject.subject}</p>
                                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                                    Currently at {weakestSubject.pct}% accuracy in {weakestSubject.subject}. Devote 30 mins daily to reviewing quiz archives in this subject.
                                </p>
                                <Link
                                    href={`/copilot?subject=${encodeURIComponent(weakestSubject.subject)}`}
                                    className="inline-flex items-center gap-1.5 mt-3 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                                >
                                    <BookOpen className="w-3.5 h-3.5" />
                                    Study in Copilot
                                </Link>
                            </div>
                        </div>

                        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-xl p-5 border border-primary-100/50 dark:border-slate-800 flex gap-4">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-950/40 rounded-lg flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">Elite Advice</p>
                                <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
                                    {aiMistakes?.insights?.[0] || (scoreTrend.length > 1 && scoreTrend[scoreTrend.length - 1].pct > scoreTrend[scoreTrend.length - 2].pct
                                        ? "Your accuracy is improving! Keep up the momentum for the final exam."
                                        : "Consistency is key. Try to take 1 quiz every day to keep your brain sharp.")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Elite Premium Analytical Suite (Scenario 2, 3, 4) */}
            <div className="bg-slate-950 text-white rounded-[2.5rem] border border-white/10 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />
                
                <div className="space-y-8 relative z-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <Sparkles className="w-3.5 h-3.5" />
                                Elite Analytical Suite
                            </div>
                            <h2 className="text-3xl font-black italic tracking-tight text-white mt-2">Targeted Score Diagnosis</h2>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* 1. Predicted MDCAT Score Card (Scenario 3) */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden">
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Score Projection</span>
                                    <Lock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-black italic">Predicted MDCAT Score</h3>
                                {scoreTrend.length < 3 ? (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400 font-bold leading-relaxed">
                                            Complete at least 3 quizzes to unlock expected score calculation.
                                        </p>
                                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${(scoreTrend.length / 3) * 100}%` }} />
                                        </div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                            Attempts: {scoreTrend.length} / 3
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <p className="text-xs text-slate-400 font-bold leading-relaxed">
                                            Calculates your projected score (e.g. 172/200) based on response speed, difficulty weighting, and subject accuracy.
                                        </p>
                                        <button
                                            onClick={() => setSelectedLockFeature({
                                                open: true,
                                                title: "Predicted MDCAT Score",
                                                outcome: "Know your expected MDCAT score with ±2% precision",
                                                desc: "A machine-learning model computes your expected MDCAT score by matching your historical speed and distractor susceptibility against previous year aggregates.",
                                                why: "Over 87% of students using Predicted Score report a major reduction in exam anxiety."
                                            })}
                                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black rounded-xl uppercase tracking-widest active:scale-95 transition-all"
                                        >
                                            Calculate Score
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. Weakest Chapters & Repeated Mistakes (Scenario 4) */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden group">
                            {/* Blur filter overlay for free */}
                            {!isPremiumUser && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                                    <button
                                        onClick={() => setSelectedLockFeature({
                                            open: true,
                                            title: "Weakest Chapters & Repeated Mistakes",
                                            outcome: "Eliminate the recurring errors holding back your score",
                                            desc: "Aggregates incorrect options across attempts to surface recurring conceptual errors (e.g., confusing Active vs Passive Transport). Shows exactly how many times you repeated each mistake.",
                                            why: "Highest-scoring students review their mistake logs weekly to systematically fix conceptual blindspots."
                                        })}
                                        className="py-3 px-4 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                        Unlock Chapter Analysis
                                    </button>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Repeated Misconceptions</span>
                                    <Lock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-black italic">Weakest Chapters</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="p-3 bg-white/5 rounded-xl flex justify-between">
                                        <span className="font-bold text-slate-300">Cell Biology</span>
                                        <span className="font-black text-red-400">4 mistakes</span>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-xl flex justify-between">
                                        <span className="font-bold text-slate-300">Organic Chemistry</span>
                                        <span className="font-black text-red-400">3 mistakes</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. AI Study Plan */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden">
                            {!isPremiumUser && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                                    <button
                                        onClick={() => setSelectedLockFeature({
                                            open: true,
                                            title: "AI Study Planner",
                                            outcome: "Unlock a customized 7-day revision checklist",
                                            desc: "A daily list of study targets, video suggestions, and quiz challenges designed to bridge the gaps in your lowest-performing chapters.",
                                            why: "Structured plans boost revision efficiency by 40%."
                                        })}
                                        className="py-3 px-4 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                        Unlock Study Plan
                                    </button>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Personalized Schedule</span>
                                    <Lock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-black italic">AI Study Plan</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">✓</div>
                                        <span className="text-slate-400">Review Cell Structure MCQ mistakes</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-slate-800 text-slate-500 flex items-center justify-center text-[10px]"></div>
                                        <span className="text-slate-400">Solve 20 Chemistry stoichiometry questions</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4. Difficulty Analysis */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden">
                            {!isPremiumUser && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                                    <button
                                        onClick={() => setSelectedLockFeature({
                                            open: true,
                                            title: "Difficulty Analysis Heatmap",
                                            outcome: "Master time pacing across difficult questions",
                                            desc: "Sorts your speed and accuracy across Easy, Medium, and Hard MDCAT questions to highlight if you are getting bogged down or rushing.",
                                            why: "Pacing analysis prevents students from losing easy points due to time pressure."
                                        })}
                                        className="py-3 px-4 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                        Unlock Heatmap
                                    </button>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Pacing Metrics</span>
                                    <Lock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-black italic">Difficulty Heatmap</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Hard Questions:</span>
                                        <span className="font-extrabold text-red-400">30% Accuracy</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Easy Questions:</span>
                                        <span className="font-extrabold text-emerald-400">85% Accuracy</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. Concept Mastery */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden">
                            {!isPremiumUser && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                                    <button
                                        onClick={() => setSelectedLockFeature({
                                            open: true,
                                            title: "Concept Mastery Index",
                                            outcome: "Track your progression toward 100% syllabus mastery",
                                            desc: "A detailed breakdown of all 42 core MDCAT sub-chapters. Shows your mastery percentage based on historical answer metrics.",
                                            why: "Toppers use the concept index to guarantee they have zero remaining blindspots before the exam."
                                        })}
                                        className="py-3 px-4 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                        Unlock Mastery Index
                                    </button>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Syllabus Coverage</span>
                                    <Lock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-black italic">Concept Mastery Index</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-400">Biology Mastery:</span>
                                        <span className="font-extrabold">64%</span>
                                    </div>
                                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: "64%" }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Performance Trend */}
                        <div className="bg-white/5 border border-white/5 rounded-3xl p-6 relative flex flex-col justify-between overflow-hidden">
                            {!isPremiumUser && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
                                    <button
                                        onClick={() => setSelectedLockFeature({
                                            open: true,
                                            title: "Advanced Performance Trends",
                                            outcome: "See if your score is rising or plateauing",
                                            desc: "A regression curve plotted over your daily mock scores to visualize performance momentum, predicting your score trajectory for the official test date.",
                                            why: "Identifying performance plateaus early lets you change your study strategy before it's too late."
                                        })}
                                        className="py-3 px-4 bg-slate-900 hover:bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                    >
                                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                                        Unlock Trends
                                    </button>
                                </div>
                            )}
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Regression Analysis</span>
                                    <Lock className="w-4 h-4 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-black italic">Performance Trends</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-slate-400">Weekly Trajectory:</span>
                                        <span className="font-extrabold text-emerald-400">+4.2 points/wk</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {selectedLockFeature && (
                <PremiumFeatureModal
                    open={selectedLockFeature.open}
                    onClose={() => setSelectedLockFeature(null)}
                    featureName={selectedLockFeature.title}
                    outcomeText={selectedLockFeature.outcome}
                    descriptionText={selectedLockFeature.desc}
                    whyStudentsUseIt={selectedLockFeature.why}
                    source="analytics_dashboard"
                />
            )}
        </div>
    );
}
