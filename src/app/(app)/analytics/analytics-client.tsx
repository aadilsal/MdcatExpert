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
} from "recharts";
import {
    Target,
    Award,
    Clock,
    Zap,
    TrendingUp,
    BarChart3,
    AlertTriangle,
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
                        bgLight: "bg-blue-50",
                        textColor: "text-blue-700",
                    },
                    {
                        label: "Best Score",
                        value: `${stats.bestScore}%`,
                        icon: Award,
                        bgLight: "bg-emerald-50",
                        textColor: "text-emerald-700",
                    },
                    {
                        label: "Avg Time",
                        value: formatTime(stats.avgTime),
                        icon: Clock,
                        bgLight: "bg-purple-50",
                        textColor: "text-purple-700",
                    },
                    {
                        label: "Questions Solved",
                        value: stats.totalAnswered.toString(),
                        icon: Zap,
                        bgLight: "bg-orange-50",
                        textColor: "text-orange-700",
                    },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="bg-white rounded-xl border border-gray-100 p-5 shadow-card hover:shadow-card-hover transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary-600" />
                            Progress Over Time
                        </h2>
                    </div>
                    <div className="p-6 h-72">
                        {scoreTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scoreTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                                            boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pct"
                                        name="Accuracy"
                                        stroke="#2563eb"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
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
                <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900">Overall Accuracy</h2>
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
                                <span className="text-3xl font-bold text-gray-900">{stats.overallAccuracy}%</span>
                                <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Accuracy</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {pieData.map((item) => (
                                <div key={item.name} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase">{item.name}</p>
                                        <p className="text-lg font-bold text-gray-900">{item.value} <span className="text-xs font-normal text-gray-400">questions</span></p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Subject Performance - Bar Chart */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary-600" />
                            Subject Performance
                        </h2>
                    </div>
                    <div className="p-6 h-72">
                        {subjectData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={subjectData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" domain={[0, 100]} hide />
                                    <YAxis
                                        dataKey="subject"
                                        type="category"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fontWeight: 600, fill: "#374151" }}
                                        width={80}
                                    />
                                    <Tooltip
                                        cursor={{ fill: "transparent" }}
                                        formatter={(value: any) => [`${value}%`, "Accuracy"]}
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
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
                <div className="bg-white rounded-xl border border-gray-100 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-600" />
                            Time Spent per Quiz
                        </h2>
                    </div>
                    <div className="p-6 h-72">
                        {scoreTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={scoreTrend}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
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
                                        formatter={(value: any) => [formatTime(Number(value) || 0), "Time Spent"]}
                                        contentStyle={{
                                            borderRadius: "12px",
                                            border: "none",
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
            </div>

            {/* Insights Card */}
            {scoreTrend.length > 0 && weakestSubject && strongestSubject && (
                <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl border border-primary-100 p-6 shadow-card">
                    <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-primary-600" />
                        AI-Powered Insights
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-primary-100/50 flex gap-4">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                                <Award className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 mb-1">Strongest: {strongestSubject.subject}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    You&apos;re dominating {strongestSubject.subject} with {strongestSubject.pct}% accuracy. Use this confidence to tackle more challenging topics.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-primary-100/50 flex gap-4">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 mb-1">Focus Item: {weakestSubject.subject}</p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    Currently at {weakestSubject.pct}% accuracy in {weakestSubject.subject}. Devote 30 mins daily to reviewing past papers in this subject.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-primary-100/50 flex gap-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 mb-1">Trend Analysis</p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {scoreTrend.length > 1 && scoreTrend[scoreTrend.length - 1].pct > scoreTrend[scoreTrend.length - 2].pct
                                        ? "Your accuracy is improving! Keep up the momentum for the final exam."
                                        : "Consistency is key. Try to take 1 quiz every day to keep your brain sharp."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
