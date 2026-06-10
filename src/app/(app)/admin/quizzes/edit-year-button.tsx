"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Check, X } from "lucide-react";
import { formatUserError } from "@/lib/format-user-error";

export function EditQuizYearButton({
    quizId,
    initialYear,
}: {
    quizId: string;
    initialYear: number;
}) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [year, setYear] = useState(String(initialYear));
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const parsed = Number(year.trim());
        if (!Number.isInteger(parsed) || parsed <= 0 || saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/quizzes/${quizId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ year: parsed }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? "Failed to update");
            }
            setEditing(false);
            router.refresh();
        } catch (error) {
            alert(formatUserError(error, "Could not update year."));
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <div className="flex items-center gap-1">
                <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min={1990}
                    max={2100}
                    className="theme-input w-20 px-2 py-1 rounded-lg text-xs font-semibold text-center"
                    autoFocus
                    onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSave();
                        if (e.key === "Escape") {
                            setYear(String(initialYear));
                            setEditing(false);
                        }
                    }}
                />
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="p-1 rounded-md bg-primary-600 text-white disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <Check className="w-3.5 h-3.5" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setYear(String(initialYear));
                        setEditing(false);
                    }}
                    className="p-1 rounded-md bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 group/year">
            <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold">
                {initialYear}
            </span>
            <button
                type="button"
                onClick={() => setEditing(true)}
                title="Edit release year"
                className="p-1 rounded-md text-gray-400 opacity-0 group-hover/year:opacity-100 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
            >
                <Pencil className="w-3 h-3" />
            </button>
        </div>
    );
}
