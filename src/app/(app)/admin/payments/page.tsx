"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircle,
    XCircle,
    Eye,
    Clock,
    Shield,
    DollarSign,
    ExternalLink,
    Loader2,
    Search,
    Filter,
    Mail
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { approvePaymentAction, rejectPaymentAction } from "@/app/(app)/admin/payments/actions";

interface PaymentRequest {
    id: string;
    user_id: string;
    user_email: string;
    transaction_id: string;
    screenshot_url: string;
    amount: number;
    status: "pending" | "approved" | "rejected";
    review_reason?: string | null;
    verified_by?: string | null;
    processed_at?: string | null;
    archive_title?: string | null;
    archive_year?: string | null;
    created_at: string;
}

export default function AdminPaymentsPage() {
    const [requests, setRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
    const [viewingImage, setViewingImage] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        const supabase = createClient();
        const { data, error } = await supabase
            .from("payment_requests")
            .select("*")
            .eq("status", filter)
            .order("created_at", { ascending: false });

        if (data) setRequests(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const handleApprove = async (id: string, userId: string) => {
        const { value: reason } = await Swal.fire({
            title: "Approval note",
            input: "text",
            inputLabel: "Enter a reason for approval (optional)",
            inputPlaceholder: "Payment verified",
            showCancelButton: true,
            inputValue: "Payment verified",
        });

        if (!reason) return;

        const confirmResult = await Swal.fire({
            title: "Approve payment",
            text: "This will grant Premium access to the user.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Approve",
            cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            await approvePaymentAction(id, userId, reason);
            setRequests(prev => prev.filter(r => r.id !== id));
            Swal.fire({ icon: "success", title: "Approved", text: "Premium access granted." });
        } catch (error) {
            Swal.fire({ icon: "error", title: "Approval failed", text: "Could not approve payment." });
        }
    };

    const handleReject = async (id: string, userId: string) => {
        const { value: reason } = await Swal.fire({
            title: "Rejection reason",
            input: "text",
            inputLabel: "Enter reason for rejection",
            inputPlaceholder: "Proof insufficient",
            showCancelButton: true,
            inputValue: "Proof insufficient",
        });

        if (!reason) return;

        const confirmResult = await Swal.fire({
            title: "Reject payment",
            text: "This will reject the payment request.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Reject",
            cancelButtonText: "Cancel",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            await rejectPaymentAction(id, userId, reason);
            setRequests(prev => prev.filter(r => r.id !== id));
            Swal.fire({ icon: "success", title: "Rejected", text: "Payment request rejected." });
        } catch (error) {
            Swal.fire({ icon: "error", title: "Rejection failed", text: "Could not reject payment." });
        }
    };

    return (
        <div className="space-y-12 pb-20 max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-gray-900 rounded-[2.5rem] p-12 border border-white/5 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                            <DollarSign className="w-3.5 h-3.5" />
                            Revenue Operations
                        </div>
                        <h1 className="text-4xl font-black tracking-tight italic">
                            Payment <span className="text-emerald-500">Verification.</span>
                        </h1>
                        <p className="text-gray-400 font-bold italic">Process manual transactions and activate Elite credentials.</p>
                    </div>

                    <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10">
                        {["pending", "approved", "rejected"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setFilter(s as any)}
                                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === s ? "bg-white text-black shadow-lg" : "text-white/40 hover:text-white"}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
                    <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
                    <p className="text-gray-400 font-black uppercase tracking-widest text-xs italic">Syncing Revenue Cluster...</p>
                </div>
            ) : requests.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 italic font-bold text-gray-400">
                    No {filter} requests found.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {requests.map((req) => (
                        <motion.div
                            key={req.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-xl shadow-gray-200/20 flex flex-col lg:flex-row lg:items-center justify-between gap-8"
                        >
                            <div className="flex gap-6 items-center">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0 border border-gray-100">
                                    <Clock className="w-8 h-8 text-gray-300" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight italic">{req.user_email}</h3>
                                        <span className="text-[10px] font-black bg-primary-50 text-primary-600 px-2 py-0.5 rounded-md uppercase tracking-widest">ID: {req.transaction_id}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
                                        Amount: Rs. {req.amount} • {new Date(req.created_at).toLocaleDateString()}
                                    </p>
                                    {(req.archive_title || req.archive_year) && (
                                        <p className="text-[10px] text-gray-500 italic">
                                            Archive: {req.archive_title || "Unknown"}{req.archive_year ? ` (${req.archive_year})` : ""}
                                        </p>
                                    )}
                                    {req.review_reason && (
                                        <p className="text-[10px] text-gray-500 italic">Last note: {req.review_reason}</p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setViewingImage(req.screenshot_url)}
                                    className="px-6 py-4 bg-gray-50 text-gray-500 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-gray-100 border border-gray-100 transition-all flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> View Proof
                                </button>

                                {filter === "pending" && (
                                    <>
                                        <button
                                            onClick={() => handleReject(req.id, req.user_id)}
                                            className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-100 border border-red-100 transition-all"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                        <button
                                            onClick={() => handleApprove(req.id, req.user_id)}
                                            className="px-8 py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle className="w-4 h-4" /> Approve & Activate
                                        </button>
                                    </>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            <AnimatePresence>
                {viewingImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewingImage(null)}
                        className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-10 cursor-zoom-out"
                    >
                        <motion.img
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            src={viewingImage}
                            className="max-w-full max-h-full rounded-2xl shadow-2xl"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
