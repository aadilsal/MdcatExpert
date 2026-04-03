/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, Suspense } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Upload,
    Loader2,
    CheckCircle,
    Clock,
    CreditCard,
    FileText,
    ArrowLeft
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

function SignupPaymentContent() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [transactionId, setTransactionId] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [parsedTitle, setParsedTitle] = useState<string>("");
    const [parsedYear, setParsedYear] = useState<string>("");
    const [autoTransactionId, setAutoTransactionId] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setScreenshot(file);
            setError(null);

            // Validate file size (5MB max)
            if (file.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB");
                setScreenshot(null);
                return;
            }

            // Parse title and year from filename
            const fileName = file.name.toLowerCase();
            const yearMatch = fileName.match(/\b(20\d{2})\b/);
            const year = yearMatch ? yearMatch[1] : "";

            let title = fileName
                .replace(/\.[^.]+$/, '')
                .replace(/\b(20\d{2})\b/g, '')
                .replace(/[-_\s]+/g, ' ')
                .replace(/\b(archive|payment|receipt|proof|mdcat|mcq|quiz)\b/g, '')
                .trim()
                .replace(/\s+/g, ' ');

            title = title.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            setParsedTitle(title || "Payment Proof");
            setParsedYear(year);

            const timestamp = Date.now().toString().slice(-6);
            const yearCode = year ? year.slice(-2) : "00";
            const titleCode = title ? title.replace(/\s+/g, '').slice(0, 3).toUpperCase() : "PAY";
            const autoId = `TXN${yearCode}${titleCode}${timestamp}`;

            setAutoTransactionId(autoId);
            setTransactionId(autoId);
        }
    };

    const handleSubmitPayment = async () => {
        if (!screenshot || !transactionId) {
            setError("Please select a file and enter a transaction ID");
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                throw new Error("You must be logged in to submit payment");
            }

            // 1. Upload screenshot into images bucket
            const fileExt = screenshot.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from("images")
                .upload(fileName, screenshot, { cacheControl: "3600", upsert: false });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from("images")
                .getPublicUrl(fileName);

            // 2. Create payment request
            const { error: requestError } = await supabase
                .from("payment_requests")
                .insert({
                    user_id: user.id,
                    user_email: user.email,
                    transaction_id: transactionId,
                    screenshot_url: publicUrl,
                    amount: 2500,
                    status: "pending",
                    archive_title: parsedTitle,
                    archive_year: parsedYear
                });

            if (requestError) throw requestError;

            setSubmitted(true);
        } catch (error) {
            console.error("Payment submission failed:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to submit payment. Please try again or contact support.";
            setError(errorMessage);
        } finally {
            setUploading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-white to-gray-50">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500 text-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"
                >
                    <CheckCircle className="w-12 h-12" />
                </motion.div>
                <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight italic">Payment Submitted.</h1>
                <div className="max-w-md mx-auto space-y-4">
                    <p className="text-gray-500 font-bold italic">
                        Your payment screenshot has been received. Our team is verifying your submission.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left">
                        <p className="text-sm font-semibold text-blue-900 mb-2">What happens next:</p>
                        <ul className="text-sm text-blue-800 space-y-2">
                            <li className="flex items-start gap-2">
                                <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                                <span><strong>Within 24 hours:</strong> Admin will verify your payment</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                <span><strong>Once approved:</strong> Elite access activated automatically</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CreditCard className="w-4 h-4 mt-0.5 shrink-0" />
                                <span><strong>Until then:</strong> Free access to all features</span>
                            </li>
                        </ul>
                    </div>
                    <p className="text-xs text-gray-400">You'll receive a notification when your account is approved.</p>
                </div>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="mt-10 px-10 py-5 bg-gray-900 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-20 pt-10 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Back Button */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-12 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </Link>

                {/* Header */}
                <div className="mb-12">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 border border-primary-200 text-[10px] font-black uppercase tracking-[0.2em] text-primary-700 mb-4">
                        <CreditCard className="w-3.5 h-3.5" />
                        Elite Payment
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight italic">
                        Complete Your <span className="text-primary-600">Elite Upgrade.</span>
                    </h1>
                    <p className="text-lg text-gray-600 font-medium">
                        Upload your payment screenshot to activate Elite access. You'll get free access while we verify your payment (within 24 hours).
                    </p>
                </div>

                {/* Main Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 sm:p-12">
                    {error && (
                        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                            <p className="text-sm font-semibold">{error}</p>
                        </div>
                    )}

                    <div className="space-y-8">
                        {/* File Upload Section */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-4">
                                Payment Screenshot
                            </label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                    id="screenshot-upload"
                                    disabled={uploading}
                                />
                                <label
                                    htmlFor="screenshot-upload"
                                    className="block p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
                                >
                                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="font-bold text-gray-900">
                                        {screenshot ? screenshot.name : "Click to upload or drag and drop"}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">PNG, JPG or PDF (max 5MB)</p>
                                </label>
                            </div>
                        </div>

                        {/* Transaction ID Section */}
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-4">
                                Transaction ID <span className="text-gray-400 text-xs font-normal">(auto-generated)</span>
                            </label>
                            <input
                                type="text"
                                value={transactionId}
                                onChange={(e) => setTransactionId(e.target.value)}
                                placeholder="TXN..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-2xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            />
                            <p className="text-xs text-gray-500 mt-2">You can edit this if needed</p>
                        </div>

                        {/* File Details */}
                        {screenshot && (
                            <div className="bg-gray-50 rounded-2xl p-6 space-y-3 border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Archive Title:</span>
                                    <span className="font-semibold text-gray-900">{parsedTitle}</span>
                                </div>
                                {parsedYear && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Year:</span>
                                        <span className="font-semibold text-gray-900">{parsedYear}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">File Size:</span>
                                    <span className="font-semibold text-gray-900">{(screenshot.size / 1024).toFixed(2)} KB</span>
                                </div>
                            </div>
                        )}

                        {/* Pricing Info */}
                        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-700 font-semibold">Elite Plan</span>
                                <span className="text-2xl font-black text-primary-600">Rs. 2500</span>
                            </div>
                            <p className="text-xs text-gray-600">
                                One-time payment for lifetime access to all Elite features
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmitPayment}
                            disabled={!screenshot || !transactionId || uploading}
                            className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-2"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Upload className="w-5 h-5" />
                                    Submit Payment
                                </>
                            )}
                        </button>

                        <p className="text-center text-xs text-gray-500">
                            Your payment screenshot is secure and will only be viewed by our team
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignupPaymentPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SignupPaymentContent />
        </Suspense>
    );
}
