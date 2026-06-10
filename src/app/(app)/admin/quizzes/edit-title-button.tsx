"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2, Check, X } from "lucide-react";
import { formatUserError } from "@/lib/format-user-error";

export function EditQuizTitleButton({
    quizId,
    initialTitle,
}: {
    quizId: string;
    initialTitle: string;
}) {
    const router = useRouter();
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(initialTitle);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        const trimmed = title.trim();
        if (!trimmed || saving) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/admin/quizzes/${quizId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title: trimmed }),
            });
            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error ?? "Failed to update");
            }
            setEditing(false);
            router.refresh();
        } catch (error) {
            alert(formatUserError(error, "Could not update title."));
        } finally {
            setSaving(false);
        }
    };

    if (editing) {
        return (
            <div className="flex items-center gap-2 mb-3">
                <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                    autoFocus
                />
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="p-2 rounded-lg bg-primary-600 text-white disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setTitle(initialTitle);
                        setEditing(false);
                    }}
                    className="p-2 rounded-lg bg-gray-100 text-gray-600 dark:text-gray-400"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-start gap-2 mb-3 group/title">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg flex-1">{initialTitle}</h3>
            <button
                type="button"
                onClick={() => setEditing(true)}
                title="Edit quiz title"
                className="p-1.5 rounded-lg text-gray-400 opacity-0 group-hover/title:opacity-100 hover:bg-gray-100 hover:text-primary-600 transition-all"
            >
                <Pencil className="w-4 h-4" />
            </button>
        </div>
    );
}
