"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    BarChart3,
    TrendingUp,
    DollarSign,
    Activity,
    RefreshCw,
    AlertTriangle,
    Target,
    BookOpen,
    Globe,
} from "lucide-react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics-events";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Legend,
} from "recharts";
import type { AdminDashboardData } from "./types";

const TABS = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "traffic", label: "Traffic", icon: Globe },
    { id: "growth", label: "Growth", icon: TrendingUp },
    { id: "engagement", label: "Engagement", icon: Activity },
    { id: "revenue", label: "Revenue", icon: DollarSign },
    { id: "retention", label: "Retention", icon: RefreshCw },
    { id: "content", label: "Content", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

function KpiCard({
    label,
    value,
    hint,
    color = "text-gray-900 dark:text-gray-100",
}: {
    label: string;
    value: string | number;
    hint?: string;
    color?: string;
}) {
    return (
        <div className="bg-surface rounded-3xl p-6 border border-surface-border shadow-sm dark:shadow-none">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
            {hint && <p className="text-xs text-gray-400 mt-2 font-medium">{hint}</p>}
        </div>
    );
}

function formatDayLabel(date: string): string {
    const parts = date.split("-");
    return `${parts[1]}/${parts[2]}`;
}

function formatCurrency(amount: number): string {
    return `Rs ${amount.toLocaleString()}`;
}

export default function AdminAnalyticsClient({ data }: { data: AdminDashboardData }) {
    const [tab, setTab] = useState<TabId>("overview");
    const { overview, timeSeries, funnel, engagement, payments, promos, retentionCohorts, content, alerts, traffic } =
        data;

    useEffect(() => {
        trackEvent(ANALYTICS_EVENTS.ADMIN_ANALYTICS_VIEW);
    }, []);

    const combinedTrend = timeSeries.signupsByDay.map((row, i) => ({
        date: formatDayLabel(row.date),
        signups: row.count,
        attempts: timeSeries.attemptsByDay[i]?.count ?? 0,
        revenue: timeSeries.revenueByDay[i]?.amount ?? 0,
    }));

    const funnelSteps = [
        { step: "Registered", count: funnel.registered },
        { step: "First attempt", count: funnel.firstAttempt },
        { step: "Upgrade view", count: funnel.upgradeView },
        { step: "Payment submitted", count: funnel.paymentSubmitted },
        { step: "Payment approved", count: funnel.paymentApproved },
        { step: "Active premium", count: funnel.stillPremium30d },
    ];

    const growthDisplay =
        overview.signupGrowth30dPct != null
            ? `${overview.signupGrowth30dPct >= 0 ? "+" : ""}${overview.signupGrowth30dPct}%`
            : overview.newSignups30d > 0
              ? "New"
              : "—";

    return (
        <div className="animate-fade-in space-y-10 pb-20">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 border border-white/5 p-10 sm:p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary-300">
                            <BarChart3 className="w-3.5 h-3.5" />
                            Platform Intelligence
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight italic">
                            Analytics <span className="text-primary-400 italic">Dashboard.</span>
                        </h1>
                        <p className="text-gray-400 font-medium max-w-lg">
                            Last {data.periodDays} days · MAU by login = distinct logins; MAU by attempts = quiz activity
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {(alerts.pendingPaymentsStale > 0 || alerts.expiringPremium7d > 0) && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm font-bold text-amber-200">
                                <AlertTriangle className="w-4 h-4 inline mr-2" />
                                {alerts.pendingPaymentsStale} stale payments · {alerts.expiringPremium7d} expiring premium
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        type="button"
                        onClick={() => setTab(t.id)}
                        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all ${
                            tab === t.id
                                ? "bg-gray-900 dark:bg-primary-600 text-white shadow-lg"
                                : "bg-surface text-gray-500 dark:text-gray-400 border border-surface-border hover:border-surface-border-strong dark:hover:border-slate-600"
                        }`}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === "overview" && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Total students" value={overview.totalStudents} />
                        <KpiCard
                            label="Active premium"
                            value={overview.activePremium}
                            hint={`${overview.premiumPenetration}% penetration`}
                            color="text-emerald-600"
                        />
                        <KpiCard
                            label="MAU (attempts)"
                            value={overview.mauByAttempts}
                            hint={`Login MAU: ${overview.mauByLogin}`}
                            color="text-primary-600"
                        />
                        <KpiCard
                            label="Revenue (30d)"
                            value={formatCurrency(overview.revenue30d)}
                            hint={`All time: ${formatCurrency(overview.revenueAllTime)}`}
                            color="text-amber-600"
                        />
                        <KpiCard label="New signups (30d)" value={overview.newSignups30d} hint={`7d: ${overview.newSignups7d}`} />
                        <KpiCard label="Signup growth" value={growthDisplay} hint="30d vs prior 30d" />
                        <KpiCard label="Total attempts" value={overview.totalAttempts} hint={`30d: ${overview.attempts30d}`} />
                        <KpiCard
                            label="Activation (7d)"
                            value={`${overview.activationRate7d}%`}
                            hint="First quiz within 7 days of signup"
                        />
                        <KpiCard
                            label="Conversion (30d cohort)"
                            value={`${overview.conversionRate30d}%`}
                            hint="Signups 30–60d ago → premium within 30d"
                        />
                        <KpiCard
                            label="Activity churn"
                            value={`${overview.activityChurnRate30d}%`}
                            hint={`${overview.activityChurn30d} users inactive after prior activity`}
                        />
                        <KpiCard
                            label="Premium churn"
                            value={`${overview.premiumChurnRate30d}%`}
                            hint={`${overview.premiumChurn30d} lost premium this month`}
                        />
                        <KpiCard
                            label="Pending payments"
                            value={overview.pendingPayments}
                            hint={`Avg approval: ${overview.avgApprovalHours}h`}
                        />
                        <KpiCard
                            label="Page views"
                            value={traffic.pageViews}
                            hint={`${traffic.pageUniqueSessions} unique sessions`}
                            color="text-sky-600"
                        />
                        <KpiCard
                            label="Homepage views"
                            value={traffic.landingViews}
                            hint={`${traffic.landingUniqueSessions} unique sessions`}
                            color="text-violet-600"
                        />
                    </div>

                    <div className="bg-surface rounded-4xl border border-surface-border p-6 shadow-sm">
                        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6">Signups, attempts & revenue</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={combinedTrend}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line yAxisId="left" type="monotone" dataKey="signups" stroke="#6366f1" strokeWidth={2} dot={false} />
                                    <Line yAxisId="left" type="monotone" dataKey="attempts" stroke="#22c55e" strokeWidth={2} dot={false} />
                                    <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {tab === "traffic" && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard
                            label="Page views"
                            value={traffic.pageViews}
                            hint={`${traffic.pageUniqueSessions} unique sessions`}
                            color="text-sky-600"
                        />
                        <KpiCard
                            label="Homepage views"
                            value={traffic.landingViews}
                            hint={`${traffic.landingUniqueSessions} unique sessions`}
                            color="text-violet-600"
                        />
                        <KpiCard
                            label="Admin dashboard views"
                            value={traffic.adminAnalyticsViews}
                            hint={`${traffic.adminAnalyticsUniqueSessions} unique sessions`}
                            color="text-gray-900 dark:text-gray-100"
                        />
                        <KpiCard
                            label="Paywall hits"
                            value={traffic.paywallHits}
                            hint={`Quiz started: ${traffic.quizStarted} · completed: ${traffic.quizCompleted}`}
                            color="text-amber-600"
                        />
                    </div>

                    <div className="bg-surface rounded-4xl border border-surface-border p-6 shadow-sm">
                        <h2 className="text-lg font-black text-gray-900 dark:text-gray-100 mb-6">Page views & homepage traffic</h2>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={traffic.pageViewsByDay.map((row, i) => ({
                                        date: formatDayLabel(row.date),
                                        pageViews: row.count,
                                        homepage: traffic.landingViewsByDay[i]?.count ?? 0,
                                    }))}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="pageViews" name="All pages" stroke="#0ea5e9" strokeWidth={2} dot={false} />
                                    <Line type="monotone" dataKey="homepage" name="Homepage" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 font-medium">
                            Page views track every route change site-wide. Homepage views are a separate landing-page metric.
                            Historical data before this update only includes homepage events.
                        </p>
                    </div>

                    <div className="bg-surface rounded-4xl border border-surface-border overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                            <h2 className="text-lg font-black">Top pages (last {data.periodDays} days)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                        <th className="p-4">Path</th>
                                        <th className="p-4">Views</th>
                                        <th className="p-4">Unique sessions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {traffic.topPages.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="p-8 text-center text-gray-400 font-medium">
                                                No page views recorded yet — data appears after visitors browse the site
                                            </td>
                                        </tr>
                                    ) : (
                                        traffic.topPages.map((p) => (
                                            <tr key={p.path} className="border-b border-gray-50 dark:border-slate-800 dark:border-slate-800 hover:bg-gray-50/50">
                                                <td className="p-4 font-mono text-xs font-bold">{p.path}</td>
                                                <td className="p-4 font-black text-sky-600">{p.views}</td>
                                                <td className="p-4">{p.uniqueSessions}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === "growth" && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiCard label="Total students" value={overview.totalStudents} />
                        <KpiCard label="New (7d)" value={overview.newSignups7d} color="text-primary-600" />
                        <KpiCard label="Growth (30d)" value={growthDisplay} color="text-emerald-600" />
                    </div>
                    <div className="bg-surface rounded-4xl border border-surface-border p-6">
                        <h2 className="text-lg font-black mb-4">Daily signups</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeSeries.signupsByDay.map((d) => ({ ...d, date: formatDayLabel(d.date) }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-surface rounded-4xl border border-surface-border overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                            <h2 className="text-lg font-black">Promo codes</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                        <th className="p-4">Code</th>
                                        <th className="p-4">Used</th>
                                        <th className="p-4">Max</th>
                                        <th className="p-4">Utilization</th>
                                        <th className="p-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {promos.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-gray-400 font-medium">
                                                No promo codes yet
                                            </td>
                                        </tr>
                                    ) : (
                                        promos.map((p) => (
                                            <tr key={p.code} className="border-b border-gray-50 dark:border-slate-800 dark:border-slate-800 hover:bg-gray-50/50">
                                                <td className="p-4 font-bold">{p.code}</td>
                                                <td className="p-4">{p.usedCount}</td>
                                                <td className="p-4">{p.maxUses}</td>
                                                <td className="p-4">{p.utilizationPct}%</td>
                                                <td className="p-4">
                                                    <span
                                                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500 dark:text-gray-400"}`}
                                                    >
                                                        {p.isActive ? "Active" : "Inactive"}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {tab === "engagement" && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <KpiCard label="MAU (login)" value={overview.mauByLogin} hint="lastLoginAt in 30d" />
                        <KpiCard label="MAU (attempts)" value={overview.mauByAttempts} hint="Completed quiz in 30d" />
                        <KpiCard label="DAU avg (7d)" value={overview.dau7dAvg} hint="Distinct users per day" />
                        <KpiCard label="Attempts / MAU" value={overview.attemptsPerMau} />
                        <KpiCard label="Inactive 14d+" value={alerts.inactiveStudents14d} color="text-amber-600" />
                    </div>
                    <div className="grid lg:grid-cols-2 gap-6">
                        <div className="bg-surface rounded-4xl border border-surface-border p-6">
                            <h2 className="text-lg font-black mb-4">By subject</h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={engagement.attemptsBySubject} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis type="number" tick={{ fontSize: 11 }} />
                                        <YAxis type="category" dataKey="subject" width={80} tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-surface rounded-4xl border border-surface-border p-6">
                            <h2 className="text-lg font-black mb-4">By year</h2>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={engagement.attemptsByYear}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                    <div className="bg-surface rounded-4xl border border-surface-border overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800 flex items-center gap-2">
                            <Target className="w-5 h-5 text-primary-600" />
                            <h2 className="text-lg font-black">Top quizzes</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Year</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Attempts</th>
                                </tr>
                            </thead>
                            <tbody>
                                {engagement.topQuizzes.map((q) => (
                                    <tr key={q.quizId} className="border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                        <td className="p-4 font-bold">{q.title}</td>
                                        <td className="p-4">{q.year}</td>
                                        <td className="p-4">{q.subject}</td>
                                        <td className="p-4 font-black text-primary-600">{q.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {tab === "revenue" && (
                <div className="space-y-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <KpiCard label="Revenue (30d)" value={formatCurrency(overview.revenue30d)} color="text-emerald-600" />
                        <KpiCard label="Approval rate" value={`${payments.approvalRate}%`} />
                        <KpiCard label="Rejection rate" value={`${payments.rejectionRate}%`} />
                        <KpiCard label="Pending > 48h" value={payments.pendingOlderThan48h} color="text-amber-600" />
                    </div>
                    <div className="bg-surface rounded-4xl border border-surface-border p-6">
                        <h2 className="text-lg font-black mb-4">Daily revenue</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={timeSeries.revenueByDay.map((d) => ({ ...d, date: formatDayLabel(d.date) }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                                    <Bar dataKey="amount" fill="#22c55e" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="bg-surface rounded-4xl border border-surface-border p-6">
                        <h2 className="text-lg font-black mb-4">Conversion funnel (period)</h2>
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={funnelSteps} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} />
                                    <YAxis type="category" dataKey="step" width={120} tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 font-medium">
                            Upgrade view and payment steps use distinct users with tracked events in the last {data.periodDays} days.
                        </p>
                        <Link
                            href="/admin/payments"
                            className="inline-flex mt-4 text-sm font-bold text-primary-600 hover:text-primary-700"
                        >
                            Review pending payments →
                        </Link>
                    </div>
                </div>
            )}

            {tab === "retention" && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <KpiCard
                            label="Activity churn (30d)"
                            value={`${overview.activityChurnRate30d}%`}
                            hint="Active in prior 30d, inactive in last 30d"
                        />
                        <KpiCard
                            label="Premium churn (month)"
                            value={`${overview.premiumChurnRate30d}%`}
                            hint="Premium at month start, not active now"
                        />
                    </div>
                    <div className="bg-surface rounded-4xl border border-surface-border overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                            <h2 className="text-lg font-black">Weekly signup cohorts (% with attempt)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                        <th className="p-4">Week</th>
                                        <th className="p-4">Signups</th>
                                        <th className="p-4">Wk 0</th>
                                        <th className="p-4">Wk 1</th>
                                        <th className="p-4">Wk 2</th>
                                        <th className="p-4">Wk 3</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {retentionCohorts.map((c) => (
                                        <tr key={c.week} className="border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                            <td className="p-4 font-bold">{c.week}</td>
                                            <td className="p-4">{c.signups}</td>
                                            <td className="p-4">{c.week0}%</td>
                                            <td className="p-4">{c.week1}%</td>
                                            <td className="p-4">{c.week2}%</td>
                                            <td className="p-4">{c.week3}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-surface rounded-4xl border border-surface-border p-6">
                        <h2 className="text-lg font-black mb-4">Daily active users (attempts)</h2>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={timeSeries.activeUsersByDay.map((d) => ({ ...d, date: formatDayLabel(d.date) }))}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {tab === "content" && (
                <div className="space-y-8">
                    <div className="bg-surface rounded-4xl border border-surface-border overflow-hidden">
                        <div className="p-6 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                            <h2 className="text-lg font-black">Hardest questions (min 20 answers)</h2>
                        </div>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                    <th className="p-4">Question</th>
                                    <th className="p-4">Subject</th>
                                    <th className="p-4">Correct %</th>
                                    <th className="p-4">Answers</th>
                                </tr>
                            </thead>
                            <tbody>
                                {content.hardestQuestions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-gray-400">
                                            Not enough answer data yet
                                        </td>
                                    </tr>
                                ) : (
                                    content.hardestQuestions.map((q) => (
                                        <tr key={q.questionId} className="border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                            <td className="p-4 font-medium max-w-md truncate">{q.questionText}</td>
                                            <td className="p-4">{q.subject}</td>
                                            <td className="p-4 font-black text-red-600">{q.correctPct}%</td>
                                            <td className="p-4">{q.totalAnswers}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {engagement.quizzesWithZeroAttempts.length > 0 && (
                        <div className="bg-surface rounded-4xl border border-surface-border overflow-hidden">
                            <div className="p-6 border-b border-gray-50 dark:border-slate-800 dark:border-slate-800">
                                <h2 className="text-lg font-black">Quizzes with zero attempts</h2>
                            </div>
                            <ul className="divide-y divide-gray-50 dark:divide-slate-800 dark:divide-slate-800">
                                {engagement.quizzesWithZeroAttempts.map((q) => (
                                    <li key={q.quizId} className="p-4 flex justify-between text-sm">
                                        <span className="font-bold">{q.title}</span>
                                        <span className="text-gray-400">
                                            {q.year} · {q.subject}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
