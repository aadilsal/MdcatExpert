"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    ExternalLink,
    Save,
    Edit3,
} from "lucide-react";
import { formatUserError } from "@/lib/format-user-error";

type ReportStatus = "open" | "resolved" | "dismissed";

interface ReportRow {
    id: string;
    user_email: string;
    quiz_id: string;
    quiz_title: string;
    question_id: string;
    question_order: number;
    category: string;
    comment: string | null;
    status: ReportStatus;
    created_at: string;
}

interface QuestionDetail {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    subject: string;
    explanation: string;
    image_url: string | null;
}

const CATEGORY_LABELS: Record<string, string> = {
    wrong_answer: "Wrong answer",
    ambiguous: "Ambiguous",
    typo: "Typo",
    image_issue: "Image",
    other: "Other",
};

export default function AdminReportsPage() {
    const [filter, setFilter] = useState<ReportStatus>("open");
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [openCount, setOpenCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [question, setQuestion] = useState<QuestionDetail | null>(null);
    const [editForm, setEditForm] = useState<Partial<QuestionDetail>>({});
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/reports?status=${filter}`, { cache: "no-store" });
            const json = await res.json();
            if (res.ok) {
                setReports(json.reports ?? []);
                setOpenCount(json.openCount ?? 0);
            } else {
                setReports([]);
            }
        } catch {
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const loadDetail = async (reportId: string) => {
        setSelectedId(reportId);
        setDetailLoading(true);
        setEditing(false);
        try {
            const res = await fetch(`/api/admin/reports/${reportId}`, { cache: "no-store" });
            const json = await res.json();
            if (res.ok && json.question) {
                setQuestion(json.question);
                setEditForm(json.question);
            } else {
                setQuestion(null);
            }
        } catch {
            setQuestion(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleReportAction = async (action: "resolve" | "dismiss") => {
        if (!selectedId || actionLoading) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/reports/${selectedId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? "Failed");
            }
            setSelectedId(null);
            setQuestion(null);
            await fetchReports();
        } catch (error) {
            alert(formatUserError(error, "Action failed."));
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveQuestion = async () => {
        if (!question?.id || saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/questions/${question.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question_text: editForm.question_text,
                    option_a: editForm.option_a,
                    option_b: editForm.option_b,
                    option_c: editForm.option_c,
                    option_d: editForm.option_d,
                    correct_option: editForm.correct_option,
                    subject: editForm.subject,
                    explanation: editForm.explanation,
                    image_url: editForm.image_url,
                    resolve_reports: true,
                }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? "Save failed");
            }
            setEditing(false);
            if (selectedId) await loadDetail(selectedId);
            await fetchReports();
        } catch (error) {
            alert(formatUserError(error, "Failed to save question."));
        } finally {
            setSaving(false);
        }
    };

    const selectedReport = reports.find((r) => r.id === selectedId);

    return (
        <div className="animate-fade-in space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-rose-600 via-rose-700 to-orange-800 p-8 text-white shadow-lg">
                <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">
                                Content quality
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold">Question Reports</h1>
                        <p className="mt-2 text-rose-100 text-sm">
                            {openCount} open report{openCount !== 1 ? "s" : ""} awaiting review
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {(["open", "resolved", "dismissed"] as const).map((s) => (
                    <button
                        key={s}
                        type="button"
                        onClick={() => {
                            setFilter(s);
                            setSelectedId(null);
                            setQuestion(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-colors ${
                            filter === s
                                ? "bg-gray-900 dark:bg-primary-600 text-white"
                                : "bg-surface border border-surface-border text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
                        }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-3">
                    {loading ? (
                        <div className="flex justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="bg-surface rounded-xl border border-surface-border p-12 text-center text-gray-500 dark:text-gray-400">
                            No {filter} reports.
                        </div>
                    ) : (
                        reports.map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => loadDetail(r.id)}
                                className={`w-full text-left bg-surface rounded-xl border p-5 shadow-card transition-all hover:shadow-card-hover ${
                                    selectedId === r.id
                                        ? "border-rose-300 ring-2 ring-rose-500/20"
                                        : "border-gray-100"
                                }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-gray-100">
                                            {r.quiz_title} · Q{r.question_order}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {CATEGORY_LABELS[r.category] ?? r.category} · {r.user_email}
                                        </p>
                                        {r.comment && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2 italic">
                                                &ldquo;{r.comment}&rdquo;
                                            </p>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                        {new Date(r.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </button>
                        ))
                    )}
                </div>

                <div className="bg-surface rounded-xl border border-surface-border shadow-card p-6 min-h-[400px]">
                    {!selectedId ? (
                        <p className="text-gray-400 text-center py-20 text-sm">
                            Select a report to review and edit the question.
                        </p>
                    ) : detailLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {selectedReport && (
                                <div className="pb-4 border-b border-surface-border space-y-2">
                                    <p className="text-sm">
                                        <span className="font-bold text-gray-500 dark:text-gray-400">Reporter:</span>{" "}
                                        {selectedReport.user_email}
                                    </p>
                                    <p className="text-sm">
                                        <span className="font-bold text-gray-500 dark:text-gray-400">Quiz:</span>{" "}
                                        {selectedReport.quiz_title}
                                    </p>
                                    <Link
                                        href={`/admin/quizzes/${selectedReport.quiz_id}?q=${selectedReport.question_id}`}
                                        className="inline-flex items-center gap-1 text-sm text-primary-600 font-medium hover:underline"
                                    >
                                        Open in quiz manager
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            )}

                            {question && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">Question</h3>
                                        {!editing ? (
                                            <button
                                                type="button"
                                                onClick={() => setEditing(true)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                                            >
                                                <Edit3 className="w-4 h-4" />
                                                Edit
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSaveQuestion}
                                                disabled={saving}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-sm font-medium disabled:opacity-50"
                                            >
                                                {saving ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Save className="w-4 h-4" />
                                                )}
                                                Save & resolve reports
                                            </button>
                                        )}
                                    </div>

                                    {editing ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editForm.question_text ?? ""}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({
                                                        ...p,
                                                        question_text: e.target.value,
                                                    }))
                                                }
                                                className="w-full p-3 rounded-lg border border-gray-200 text-sm min-h-[80px]"
                                            />
                                            {(["a", "b", "c", "d"] as const).map((l) => (
                                                <input
                                                    key={l}
                                                    value={
                                                        (editForm[
                                                            `option_${l}` as keyof QuestionDetail
                                                        ] as string) ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        setEditForm((p) => ({
                                                            ...p,
                                                            [`option_${l}`]: e.target.value,
                                                        }))
                                                    }
                                                    placeholder={`Option ${l.toUpperCase()}`}
                                                    className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                                                />
                                            ))}
                                            <select
                                                value={editForm.correct_option ?? "A"}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({
                                                        ...p,
                                                        correct_option: e.target.value,
                                                    }))
                                                }
                                                className="w-full p-2 rounded-lg border border-gray-200 text-sm"
                                            >
                                                {["A", "B", "C", "D"].map((o) => (
                                                    <option key={o} value={o}>
                                                        Correct: {o}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-sm">
                                            <p className="font-medium text-gray-900 dark:text-gray-100">
                                                {question.question_text}
                                            </p>
                                            {(["A", "B", "C", "D"] as const).map((l) => (
                                                <p
                                                    key={l}
                                                    className={
                                                        question.correct_option === l
                                                            ? "text-emerald-700 font-medium"
                                                            : "text-gray-600 dark:text-gray-400"
                                                    }
                                                >
                                                    {l}){" "}
                                                    {
                                                        question[
                                                            `option_${l.toLowerCase()}` as keyof QuestionDetail
                                                        ] as string
                                                    }
                                                </p>
                                            ))}
                                        </div>
                                    )}

                                    {filter === "open" && (
                                        <div className="flex gap-2 pt-4 border-t border-surface-border">
                                            <button
                                                type="button"
                                                onClick={() => handleReportAction("resolve")}
                                                disabled={actionLoading}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium disabled:opacity-50"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                                Mark resolved
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReportAction("dismiss")}
                                                disabled={actionLoading}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-200 text-gray-700 dark:text-gray-300 text-sm font-medium disabled:opacity-50"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Dismiss
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
