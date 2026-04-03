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
    ChevronRight,
    Loader2,
    Search,
    Filter,
    Image as ImageIcon,
    AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

    useEffect(() => {
        const fetchStaging = async () => {
            try {
                const res = await fetch(`/api/py/staging/${batchId}`);
                const data = await res.json();
                setQuestions(data);
            } catch (error) {
                console.error("Failed to fetch staging questions:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStaging();
    }, [batchId]);

    const handleStatusUpdate = async (id: string, status: "approved" | "rejected") => {
        try {
            await fetch(`/api/py/staging/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status })
            });
            setQuestions(prev => prev.map(q => q.id === id ? { ...q, status } : q));
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const handleEdit = (q: StagingQuestion) => {
        setEditingId(q.id);
        setEditForm(q);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        try {
            await fetch(`/api/py/staging/${editingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            });
            setQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...editForm } as StagingQuestion : q));
            setEditingId(null);
        } catch (error) {
            console.error("Failed to save edit:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to remove this question?")) return;
        try {
            await fetch(`/api/py/staging/${id}`, { method: "DELETE" });
            setQuestions(prev => prev.filter(q => q.id !== id));
        } catch (error) {
            console.error("Failed to delete question:", error);
        }
    };

    const handlePublish = async () => {
        setPublishing(true);
        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("year", year);
            formData.append("subject", "General"); // Can be refined

            const res = await fetch(`/api/py/publish/${batchId}`, {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                router.push("/admin/quizzes");
            } else {
                alert("Failed to publish batch. Ensure at least one question exists.");
            }
        } catch (error) {
            console.error("Publishing error:", error);
        } finally {
            setPublishing(false);
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
                        className="px-10 py-5 bg-primary-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-primary-700 transition-all shadow-2xl shadow-primary-600/30 active:scale-95 disabled:opacity-50 flex items-center gap-3"
                    >
                        {publishing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
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
                        className={`bg-white rounded-[2rem] p-8 border ${editingId === q.id ? "border-primary-500 ring-4 ring-primary-500/5" : "border-gray-100"} shadow-xl shadow-gray-200/20 transition-all`}
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
                                    onClick={() => handleStatusUpdate(q.id, "approved")}
                                    className={`p-2 rounded-xl transition-all ${q.status === "approved" ? "bg-emerald-500 text-white" : "border border-gray-100 text-gray-400 hover:bg-emerald-50 hover:text-emerald-500"}`}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(q.id, "rejected")}
                                    className={`p-2 rounded-xl transition-all ${q.status === "rejected" ? "bg-red-500 text-white" : "border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500"}`}
                                >
                                    <XCircle className="w-5 h-5" />
                                </button>
                                <div className="w-px h-6 bg-gray-100 mx-2" />
                                {editingId === q.id ? (
                                    <button onClick={handleSaveEdit} className="p-2 rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-600/20">
                                        <Save className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button onClick={() => handleEdit(q)} className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-primary-50 hover:text-primary-500">
                                        <Edit3 className="w-5 h-5" />
                                    </button>
                                )}
                                <button onClick={() => handleDelete(q.id)} className="p-2 rounded-xl border border-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

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
