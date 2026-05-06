/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
    Upload,
    Loader2,
    CheckCircle,
    Clock,
    CreditCard,
    ArrowLeft,
} from "lucide-react";
import Link from "next/link";

function SignupPaymentContent() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [transactionId, setTransactionId] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [parsedTitle, setParsedTitle] = useState<string>("");
    const [parsedYear, setParsedYear] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setScreenshot(file);
            setError(null);

            if (file.size > 5 * 1024 * 1024) {
                setError("File size must be less than 5MB");
                setScreenshot(null);
                return;
            }

            const fileName = file.name.toLowerCase();
            const yearMatch = fileName.match(/\b(20\d{2})\b/);
            const year = yearMatch ? yearMatch[1] : "";

            let title = fileName
                .replace(/\.[^.]+$/, "")
                .replace(/\b(20\d{2})\b/g, "")
                .replace(/[-_\s]+/g, " ")
                .replace(/\b(archive|payment|receipt|proof|mdcat|mcq|quiz)\b/g, "")
                .trim()
                .replace(/\s+/g, " ");

            title = title
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ");

            setParsedTitle(title || "Payment Proof");
            setParsedYear(year);

            const timestamp = Date.now().toString().slice(-6);
            const yearCode = year ? year.slice(-2) : "00";
            const titleCode = title ? title.replace(/\s+/g, "").slice(0, 3).toUpperCase() : "PAY";
            const autoId = `TXN${yearCode}${titleCode}${timestamp}`;

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
            const uploadForm = new FormData();
            uploadForm.append("file", screenshot);
            uploadForm.append("fileType", "payment_proof");

            const uploadResponse = await fetch("/api/blob/upload", {
                method: "POST",
                body: uploadForm,
                credentials: "same-origin",
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResponse.ok || uploadResult.error) {
                throw new Error(uploadResult.error || "Failed to upload screenshot.");
            }

            const submitResponse = await fetch("/api/payments/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId,
                    screenshotUrl: uploadResult.url,
                    amount: 2500,
                    archiveTitle: parsedTitle,
                    archiveYear: parsedYear,
                }),
                credentials: "same-origin",
            });

            const submitResult = await submitResponse.json();
            if (!submitResponse.ok || submitResult.error) {
                throw new Error(submitResult.error || "Failed to submit payment request.");
            }

            setSubmitted(true);
        } catch (error) {
            console.error("Payment submission failed:", error);
            setError(error instanceof Error ? error.message : "Failed to submit payment. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-linear-to-b from-white to-gray-50">
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
        <div className="min-h-screen bg-linear-to-b from-white to-gray-50 pb-20 pt-10 px-4">
            <div className="max-w-2xl mx-auto">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-12 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    Back to Dashboard
                </Link>

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

                <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 p-8 sm:p-12">
                    {error && (
                        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                            <p className="text-sm font-semibold">{error}</p>
                        </div>
                    )}

                    <div className="space-y-8">
                        <div>
                            <label className="block text-sm font-bold text-gray-900 mb-4">Payment Screenshot</label>
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
                                    className="cursor-pointer rounded-3xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center hover:border-primary-600 hover:bg-primary-50 transition-all"
                                >
                                    <Upload className="mx-auto mb-4 w-10 h-10 text-primary-600" />
                                    <p className="text-sm font-semibold text-gray-700">Choose a screenshot or PDF</p>
                                    <p className="text-xs text-gray-400 mt-2">Maximum file size: 5MB</p>
                                </label>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Transaction ID</label>
                                <input
                                    type="text"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    className="w-full rounded-3xl border border-gray-200 px-4 py-4 text-sm text-gray-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Archive Title</label>
                                <input
                                    type="text"
                                    value={parsedTitle}
                                    onChange={(e) => setParsedTitle(e.target.value)}
                                    className="w-full rounded-3xl border border-gray-200 px-4 py-4 text-sm text-gray-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2">Archive Year</label>
                                <input
                                    type="text"
                                    value={parsedYear}
                                    onChange={(e) => setParsedYear(e.target.value)}
                                    className="w-full rounded-3xl border border-gray-200 px-4 py-4 text-sm text-gray-900 focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-100"
                                />
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSubmitPayment}
                            disabled={uploading}
                            className="w-full inline-flex items-center justify-center gap-3 rounded-3xl bg-gray-900 px-8 py-5 text-sm font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-gray-900/20 hover:bg-black transition-all disabled:cursor-not-allowed disabled:bg-gray-400"
                        >
                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Payment"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SignupPaymentPage() {
    return <SignupPaymentContent />;
}
