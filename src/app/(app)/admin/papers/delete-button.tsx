"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeletePaperButton({
    paperId,
    paperTitle,
}: {
    paperId: string;
    paperTitle: string;
}) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/papers/${paperId}`, { method: "DELETE" });
            if (res.ok) {
                router.refresh();
            }
        } catch {
            // silently fail
        } finally {
            setDeleting(false);
            setShowConfirm(false);
        }
    };

    if (showConfirm) {
        return (
            <div className="flex items-center gap-1.5 animate-scale-in">
                <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                    {deleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        "Confirm"
                    )}
                </button>
                <button
                    onClick={() => setShowConfirm(false)}
                    className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => setShowConfirm(true)}
            title={`Delete ${paperTitle}`}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-red-500 text-sm font-medium hover:bg-red-50 transition-colors"
        >
            <Trash2 className="w-4 h-4" />
            Delete
        </button>
    );
}
