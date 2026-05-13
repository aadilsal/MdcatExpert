"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    CheckCircle,
    XCircle,
    Edit3,
    Save,
    Trash2,
    Layers,
    Loader2,
    Image as ImageIcon,
    AlertTriangle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Spinner } from "@/components/spinner";

interface StagingQuestion {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_option: string;
    subject: string;
    explanation: string;
    year: number;
    image_url: string | null;
    status: "pending" | "approved" | "rejected";
}

export default function AdminReviewPage({ params }: { params: Promise<{ batchId: string }> }) {
    const { batchId } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const title = searchParams.get("title") || "";
    const year = searchParams.get("year") || "";

    const [questions, setQuestions] = useState<StagingQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<StagingQuestion>>({});
    const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);

    useEffect(() => {
        const fetchStaging = async () => {
            try {
                const res = await fetch(`/api/staging/${batchId}`, { cache: "no-store" });
                const json = await res.json();
                if (!res.ok) throw new Error(json?.error || "Failed to load uploaded questions.");
                setQuestions(json.questions || []);
            } catch (error) {
                console.error("Failed to fetch staging questions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStaging();
    }, [batchId]);

    const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
        if (statusUpdatingId) return;
        setStatusUpdatingId(id);
        try {
            const res = await fetch(`/api/staging/question/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Failed to update status.");
            setQuestions(prev => prev.map(q => q.id === id ? { ...q, status } : q));
        } catch (error) {
            console.error("Failed to update status:", error);
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleEdit = (q: StagingQuestion) => {
        setEditingId(q.id);
        setEditForm(q);
    };

    const handleSaveEdit = async () => {
        if (!editingId || savingEdit) return;
        setSavingEdit(true);
        try {
            const res = await fetch(`/api/staging/question/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm),
            });
            if (!res.ok) throw new Error("Failed to save changes.");
            setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...editForm } as StagingQuestion : q));
            setEditingId(null);
        } catch (error) {
            console.error("Failed to save edit:", error);
        } finally {
            setSavingEdit(false);
        }
    };

    const handleImageUpload = async (questionId: string, file: File) => {
        if (uploadingImageId) return;
        setUploadingImageId(questionId);
        try {
            // Upload image via Convex Storage API
            const formData = new FormData();
            formData.append("file", file);

            const uploadResponse = await fetch("/api/upload-image", {
                method: "POST",
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(`Upload failed: ${errorData.error || uploadResponse.statusText}`);
            }

            const { publicUrl } = await uploadResponse.json();

            const patchRes = await fetch(`/api/staging/question/${questionId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageUrl: publicUrl }),
            });
            if (!patchRes.ok) throw new Error("Failed to attach image to the question.");

            // Update local state
            setQuestions(prev => prev.map(q =>
                q.id === questionId ? { ...q, image_url: publicUrl } : q
            ));

        } catch (error) {
            console.error("Failed to upload image:", error);
            alert(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setUploadingImageId(null);
        }
    };

    const handlePublish = async () => {
        if (publishing) return;
        setPublishing(true);
        try {
            const res = await fetch(`/api/staging/publish/${batchId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    year: Number(year) || new Date().getFullYear(),
                    subject: "General",
                    isPremium: false,
                }),
            });
            if (!res.ok) throw new Error("Failed to publish batch. Ensure at least one question exists.");
            router.push("/admin/quizzes");
        } catch (error) {
            console.error("Publishing error:", error);
        } finally {
            setPublishing(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this question?")) return;
        if (deletingId) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/staging/question/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete.");
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (error) {
            console.error("Failed to delete question:", error);
            alert("Failed to delete question. Please try again.");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-xs italic">Syncing Staging Cluster...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-gray-900 rounded-[2.5rem] p-10 border border-white/5 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-primary-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-primary-400">
                        <Layers className="w-3.5 h-3.5" />
                        Verification Pipeline
                    </div>
                    <h1 className="text-4xl font-black tracking-tight italic">
                        Review <span className="text-primary-500">Dataset.</span>
                    </h1>
                    <p className="text-gray-400 font-bold italic">{title} ({year}) — {questions.length} Questions Staged</p>
                </div>
                <div className="relative">
                    <button
                        onClick={handlePublish}
                        disabled={publishing || questions.length === 0}
                        className="px-10 py-5 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-2xl shadow-primary-600/30 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-3"
                    >
                        {publishing ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <CheckCircle className="w-5 h-5" />}
                        Commit to Alpha
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-6">
                {questions.map((q, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        key={q.id}
                        className={`bg-white rounded-4xl p-8 border ${editingId === q.id ? "border-primary-500 ring-4 ring-primary-500/5" : "border-gray-100"} shadow-xl shadow-gray-200/20 transition-all`}
                    >
                        <div className="flex items-start justify-between gap-6 mb-6">
                            <div className="flex-1">
                                {editingId === q.id ? (
                                    <textarea
                                        value={editForm.question_text}
                                        onChange={e => setEditForm(prev => ({ ...prev, question_text: e.target.value }))}
                                        className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 font-bold focus:outline-none focus:ring-2 ring-primary-500 min-h-[100px]"
                                    />
                                ) : (
                                    <p className="text-lg font-bold text-gray-900 leading-relaxed italic">
                                        <span className="text-primary-500 mr-2 text-sm font-black not-italic">#{idx + 1}</span> {q.question_text}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(q.id, "approved")}
                                    disabled={statusUpdatingId !== null}
                                    className={`p-2 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none ${q.status === "approved" ? "bg-emerald-500 text-white" : "border border-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500"}`}
                                >
                                    {statusUpdatingId === q.id ? (
                                        <Spinner size="md" className="border-gray-300 border-t-emerald-600" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5" />
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleStatusUpdate(q.id, "rejected")}
                                    disabled={statusUpdatingId !== null}
                                    className={`p-2 rounded-xl transition-all disabled:opacity-50 disabled:pointer-events-none ${q.status === "rejected" ? "bg-red-500 text-white" : "border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500"}`}
                                >
                                    {statusUpdatingId === q.id ? (
                                        <Spinner size="md" className="border-gray-300 border-t-red-600" />
                                    ) : (
                                        <XCircle className="w-5 h-5" />
                                    )}
                                </button>
                                <div className="w-px h-6 bg-gray-100 mx-2" />
                                {/* Image Upload Button */}
                                <label
                                    className={`relative ${uploadingImageId !== null ? "cursor-not-allowed opacity-50 pointer-events-none" : "cursor-pointer"}`}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploadingImageId !== null}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleImageUpload(q.id, file);
                                            e.target.value = "";
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className={`p-2 rounded-xl border transition-all ${q.image_url ? "border-emerald-300 bg-emerald-50 text-emerald-600" : "border-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-500 hover:border-primary-300"}`}>
                                        {uploadingImageId === q.id ? (
                                            <Spinner size="md" className="border-gray-300 border-t-primary-600" />
                                        ) : (
                                            <ImageIcon className="w-5 h-5" />
                                        )}
                                    </div>
                                </label>
                                <div className="w-px h-6 bg-gray-100 mx-2" />
                                {editingId === q.id ? (
                                    <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        disabled={savingEdit}
                                        className="p-2 rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/20 disabled:opacity-60 disabled:pointer-events-none"
                                    >
                                        {savingEdit ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Save className="w-5 h-5" />}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(q)}
                                        disabled={savingEdit || statusUpdatingId !== null}
                                        className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-500 disabled:opacity-40 disabled:pointer-events-none"
                                    >
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handleDelete(q.id)}
                                    disabled={deletingId !== null}
                                    className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {deletingId === q.id ? (
                                        <Spinner size="md" className="border-gray-300 border-t-red-600" />
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Display uploaded image if exists */}
                        {q.image_url && (
                            <div className="mb-6">
                                <p className="text-sm text-gray-500 mb-2">Image URL: {q.image_url}</p>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={q.image_url}
                                    alt="Question illustration"
                                    className="max-w-full h-auto max-h-64 rounded-xl border border-gray-200 shadow-lg"
                                    onError={(e) => {
                                        console.error("Image failed to load:", q.image_url);
                                        e.currentTarget.style.display = 'none';
                                    }}
                                    onLoad={() => {
                                        console.log("Image loaded successfully:", q.image_url);
                                    }}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {(["a", "b", "c", "d"] as const).map(opt => (
                                <div key={opt} className={`p-4 rounded-2xl border ${q.correct_option === opt.toUpperCase() ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-gray-50 border-gray-100 text-gray-600"}`}>
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-50">Option {opt.toUpperCase()}</p>
                                    {editingId === q.id ? (
                                        <input
                                            value={editForm[`option_${opt}` as keyof StagingQuestion] as string}
                                            onChange={e => setEditForm(prev => ({ ...prev, [`option_${opt}`]: e.target.value }))}
                                            className="w-full bg-transparent border-b border-gray-200 focus:border-primary-500 focus:outline-none font-bold"
                                        />
                                    ) : (
                                        <p className="font-bold">{q[`option_${opt}` as keyof StagingQuestion]}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-50 flex flex-wrap items-center gap-4">
                            <span className="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-black text-gray-500 uppercase tracking-widest">{q.subject}</span>
                            {q.explanation && <span className="text-[10px] font-bold text-primary-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Has Explanation</span>}
                            {q.image_url && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Has Image</span>}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
