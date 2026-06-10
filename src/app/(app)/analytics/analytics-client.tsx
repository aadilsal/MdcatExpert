"use client";

import React from "react";
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
} from "lucide-react";

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
}: AnalyticsClientProps) {
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
                    <div className="p-6 h-[400px]">
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
        </div>
    );
}
