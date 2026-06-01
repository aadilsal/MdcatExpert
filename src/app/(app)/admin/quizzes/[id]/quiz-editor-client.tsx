"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle,
    Edit3,
    FileText,
    Loader2,
    Save,
    AlertTriangle,
} from "lucide-react";
import { formatUserError } from "@/lib/format-user-error";

interface QuestionRow {
    id: string;
    order: number;
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

const subjectColors: Record<string, string> = {
    Biology: "bg-green-100 text-green-700",
    Chemistry: "bg-purple-100 text-purple-700",
    Physics: "bg-blue-100 text-blue-700",
    English: "bg-orange-100 text-orange-700",
};

export default function QuizEditorClient({
    quizId,
    quizTitle,
    quizYear,
    questions: initialQuestions,
    openReportCount,
}: {
    quizId: string;
    quizTitle: string;
    quizYear: number;
    questions: QuestionRow[];
    openReportCount: number;
}) {
    const searchParams = useSearchParams();
    const highlightId = searchParams.get("q");
    const highlightRef = useRef<HTMLDivElement>(null);

    const [title, setTitle] = useState(quizTitle);
    const [savingTitle, setSavingTitle] = useState(false);
    const [questions, setQuestions] = useState(initialQuestions);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<QuestionRow>>({});
    const [savingQuestion, setSavingQuestion] = useState(false);

    useEffect(() => {
        if (highlightId && highlightRef.current) {
            highlightRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [highlightId]);

    const saveTitle = async () => {
        const trimmed = title.trim();
        if (!trimmed || savingTitle) return;
        setSavingTitle(true);
        try {
            const res = await fetch(`/api/admin/quizzes/${quizId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: trimmed }),
            });
            if (!res.ok) throw new Error((await res.json()).error);
        } catch (error) {
            alert(formatUserError(error, "Failed to update title."));
            setTitle(quizTitle);
        } finally {
            setSavingTitle(false);
        }
    };

    const startEdit = (q: QuestionRow) => {
        setEditingId(q.id);
        setEditForm({ ...q });
    };

    const saveQuestion = async () => {
        if (!editingId || savingQuestion) return;
        setSavingQuestion(true);
        try {
            const res = await fetch(`/api/admin/questions/${editingId}`, {
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
            if (!res.ok) throw new Error((await res.json()).error);
            setQuestions((prev) =>
                prev.map((q) =>
                    q.id === editingId ? ({ ...q, ...editForm } as QuestionRow) : q,
                ),
            );
            setEditingId(null);
        } catch (error) {
            alert(formatUserError(error, "Failed to save question."));
        } finally {
            setSavingQuestion(false);
        }
    };

    const subjectCounts = questions.reduce<Record<string, number>>((acc, q) => {
        acc[q.subject] = (acc[q.subject] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="animate-fade-in space-y-8">
            <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-600 via-primary-700 to-blue-800 p-8 text-white shadow-lg">
                <div className="relative">
                    <Link
                        href="/admin/quizzes"
                        className="inline-flex items-center gap-1.5 text-primary-200 hover:text-white text-sm font-medium mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Quizzes
                    </Link>
                    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
                        <div className="flex-1">
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onBlur={saveTitle}
                                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-2xl font-bold text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/30"
                            />
                            <div className="flex items-center gap-4 mt-3 text-primary-100 text-sm flex-wrap">
                                <span>Year: {quizYear}</span>
                                <span>•</span>
                                <span>{questions.length} questions</span>
                                {openReportCount > 0 && (
                                    <>
                                        <span>•</span>
                                        <Link
                                            href="/admin/reports"
                                            className="inline-flex items-center gap-1 text-amber-200 hover:text-white"
                                        >
                                            <AlertTriangle className="w-4 h-4" />
                                            {openReportCount} open report
                                            {openReportCount !== 1 ? "s" : ""}
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                        {savingTitle && (
                            <Loader2 className="w-5 h-5 animate-spin text-white/70" />
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-card">
                <h2 className="font-semibold text-gray-900 mb-4">Subject Breakdown</h2>
                <div className="flex flex-wrap gap-3">
                    {Object.entries(subjectCounts).map(([subject, count]) => (
                        <div
                            key={subject}
                            className={`px-4 py-2 rounded-xl text-sm font-medium ${subjectColors[subject] || "bg-gray-100 text-gray-700"}`}
                        >
                            {subject}: {count} questions
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Questions ({questions.length})
                </h2>
                <div className="space-y-4">
                    {questions.map((question, idx) => {
                        const isEditing = editingId === question.id;
                        const isHighlighted = highlightId === question.id;
                        return (
                            <div
                                key={question.id}
                                ref={isHighlighted ? highlightRef : undefined}
                                className={`bg-white rounded-xl border shadow-card overflow-hidden transition-all ${
                                    isHighlighted
                                        ? "border-rose-300 ring-2 ring-rose-500/20"
                                        : "border-gray-100"
                                }`}
                            >
                                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-lg flex items-center justify-center text-sm font-bold">
                                            {idx + 1}
                                        </span>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${subjectColors[question.subject] || "bg-gray-100 text-gray-700"}`}
                                        >
                                            {question.subject}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {question.image_url && (
                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                <FileText className="w-3 h-3" />
                                                Image
                                            </span>
                                        )}
                                        {isEditing ? (
                                            <button
                                                type="button"
                                                onClick={saveQuestion}
                                                disabled={savingQuestion}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-600 text-white text-xs font-medium disabled:opacity-50"
                                            >
                                                {savingQuestion ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <Save className="w-3.5 h-3.5" />
                                                )}
                                                Save
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => startEdit(question)}
                                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                            >
                                                <Edit3 className="w-3.5 h-3.5" />
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5">
                                    {isEditing ? (
                                        <div className="space-y-3">
                                            <textarea
                                                value={editForm.question_text ?? ""}
                                                onChange={(e) =>
                                                    setEditForm((p) => ({
                                                        ...p,
                                                        question_text: e.target.value,
                                                    }))
                                                }
                                                className="w-full p-3 rounded-lg border text-sm min-h-[80px]"
                                            />
                                            {(["a", "b", "c", "d"] as const).map((l) => (
                                                <input
                                                    key={l}
                                                    value={
                                                        (editForm[
                                                            `option_${l}` as keyof QuestionRow
                                                        ] as string) ?? ""
                                                    }
                                                    onChange={(e) =>
                                                        setEditForm((p) => ({
                                                            ...p,
                                                            [`option_${l}`]: e.target.value,
                                                        }))
                                                    }
                                                    className="w-full p-2 rounded-lg border text-sm"
                                                    placeholder={`Option ${l.toUpperCase()}`}
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
                                                className="w-full p-2 rounded-lg border text-sm"
                                            >
                                                {["A", "B", "C", "D"].map((o) => (
                                                    <option key={o} value={o}>
                                                        Correct: {o}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-gray-900 font-medium mb-4">
                                                {question.question_text}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {(["A", "B", "C", "D"] as const).map((label) => {
                                                    const isCorrect =
                                                        question.correct_option === label;
                                                    const optionText = question[
                                                        `option_${label.toLowerCase()}` as keyof QuestionRow
                                                    ] as string;
                                                    return (
                                                        <div
                                                            key={label}
                                                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                                                                isCorrect
                                                                    ? "bg-green-50 border border-green-200 text-green-800"
                                                                    : "bg-gray-50 border border-gray-100 text-gray-700"
                                                            }`}
                                                        >
                                                            <span
                                                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                                                                    isCorrect
                                                                        ? "bg-green-200 text-green-800"
                                                                        : "bg-gray-200 text-gray-600"
                                                                }`}
                                                            >
                                                                {label}
                                                            </span>
                                                            <span className="flex-1 font-medium">
                                                                {optionText}
                                                            </span>
                                                            {isCorrect && (
                                                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
