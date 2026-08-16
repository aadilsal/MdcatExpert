"use client";

import { useState, type SVGProps, Suspense, useEffect } from "react";
import Swal from "sweetalert2";
import { formatUserError } from "@/lib/format-user-error";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Check,
    Zap,
    Shield,
    Upload,
    ChevronRight,
    CheckCircle,
    Rocket,
    Clock,
    CreditCard
} from "lucide-react";
import { ANALYTICS_EVENTS, trackEvent } from "@/lib/analytics-events";
import { LoadingButton } from "@/components/loading-button";
import ScoreImprovementCalculator from "@/components/score-improvement-calculator";
import { PLANS, type PlanId } from "@/lib/plans";

function UpgradePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const reason = searchParams.get("reason");
    const [step, setStep] = useState<"pricing" | "checkout">("pricing");
    const [selectedPlan, setSelectedPlan] = useState<PlanId>("elite_annual");
    const [uploading, setUploading] = useState(false);
    const [screenshot, setScreenshot] = useState<File | null>(null);
    const [transactionId, setTransactionId] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [parsedTitle, setParsedTitle] = useState<string>("");
    const [parsedYear, setParsedYear] = useState<string>("");
    const [autoTransactionId, setAutoTransactionId] = useState<string>("");
    const [showManualFallback, setShowManualFallback] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const plan = PLANS[selectedPlan];

    const goToCheckout = (planId: PlanId) => {
        setSelectedPlan(planId);
        setShowManualFallback(false);
        setStep("checkout");
    };

    const handleSecureCheckout = async () => {
        setCheckoutLoading(true);
        setCheckoutError(null);
        try {
            trackEvent(ANALYTICS_EVENTS.PAYMENT_SUBMITTED, { method: "safepay", planId: selectedPlan });
            const res = await fetch("/api/checkout/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planId: selectedPlan }),
            });
            const json = await res.json();
            if (!res.ok || !json.url) {
                throw new Error(json?.error || "Unable to start checkout.");
            }
            window.location.href = json.url;
        } catch (error) {
            setCheckoutError(
                formatUserError(error, "Secure checkout isn't available right now — try the manual option below.")
            );
            setCheckoutLoading(false);
        }
    };

    useEffect(() => {
        trackEvent(ANALYTICS_EVENTS.UPGRADE_PAGE_VIEW, reason ? { reason } : undefined);
    }, [reason]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setScreenshot(file);

            // Parse title and year from filename
            const fileName = file.name.toLowerCase();
            const yearMatch = fileName.match(/\b(20\d{2})\b/); // Match 4-digit years starting with 20
            const year = yearMatch ? yearMatch[1] : "";

            // Extract title by removing extension, year, and common separators
            let title = fileName
                .replace(/\.[^.]+$/, '') // Remove extension
                .replace(/\b(20\d{2})\b/g, '') // Remove year
                .replace(/[-_\s]+/g, ' ') // Replace separators with spaces
                .replace(/\b(archive|payment|receipt|proof|mdcat|mcq|quiz)\b/g, '') // Remove common words
                .trim()
                .replace(/\s+/g, ' '); // Clean up multiple spaces

            // Capitalize first letter of each word
            title = title.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            setParsedTitle(title || "Payment Proof");
            setParsedYear(year);

            // Auto-generate transaction ID
            const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
            const yearCode = year ? year.slice(-2) : "00"; // Last 2 digits of year
            const titleCode = title ? title.replace(/\s+/g, '').slice(0, 3).toUpperCase() : "PAY";
            const autoId = `TXN${yearCode}${titleCode}${timestamp}`;

            setAutoTransactionId(autoId);
            setTransactionId(autoId); // Auto-fill the transaction ID field
        }
    };

    const handleSubmitPayment = async () => {
        if (!screenshot || !transactionId) return;
        setUploading(true);

        try {
            // 1) Upload screenshot (Convex Storage via API)
            const uploadForm = new FormData();
            uploadForm.append("file", screenshot);
            uploadForm.append("fileType", "payment_proof");
            const uploadRes = await fetch("/api/blob/upload", { method: "POST", body: uploadForm });
            const uploadJson = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadJson?.error || "Failed to upload screenshot.");

            // 2) Create payment request (Convex)
            const paymentRes = await fetch("/api/payments/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    transactionId,
                    screenshotUrl: uploadJson.url,
                    amount: 2500,
                    archiveTitle: parsedTitle,
                    archiveYear: parsedYear
                })
            });
            const paymentJson = await paymentRes.json();
            if (!paymentRes.ok) throw new Error(paymentJson?.error || "Failed to submit payment.");

            trackEvent(ANALYTICS_EVENTS.PAYMENT_SUBMITTED);
            setSubmitted(true);
        } catch (error) {
            console.error("Payment submission failed:", error);
            await Swal.fire({
                icon: "error",
                title: "Submission failed",
                text: formatUserError(error, "Failed to submit payment. Please try again or contact support."),
            });
        } finally {
            setUploading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500 text-white rounded-4xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"
                >
                    <CheckCircle className="w-12 h-12" />
                </motion.div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight italic">Request Submitted.</h1>
                <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md mb-10 italic">
                    Our team is verifying your payment. Your Elite access will be activated within 1-2 hours.
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-10 py-5 bg-gray-900 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-16 pb-20 pt-10 px-4">
            {/* Context Header */}
            {reason === "copilot" && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-primary-500/10 border border-primary-500/20 p-6 rounded-4xl flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-primary-500 flex items-center justify-center text-white shadow-lg">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-primary-900 font-black italic">Study Copilot limit reached.</h3>
                        <p className="text-primary-800 text-sm font-medium">Upgrade to Elite for unlimited uploads, messages, and all chat modes (Quiz me, Flashcards, and more).</p>
                    </div>
                </motion.div>
            )}

            {reason === "premium_content" && (
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-4xl flex items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                        <Lock className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-amber-900 font-black italic">Premium Content Locked.</h3>
                        <p className="text-amber-800 text-sm font-medium">Upgrade to ELITE status to instantly unlock this quiz and all premium features.</p>
                    </div>
                </motion.div>
            )}

            <div className="text-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-100 border border-primary-200 text-[10px] font-black uppercase tracking-[0.2em] text-primary-700">
                    <Zap className="w-3.5 h-3.5" />
                    Join The 1%
                </div>
                <h1 className="text-5xl sm:text-7xl font-black text-gray-900 dark:text-gray-100 tracking-tighter leading-none italic">
                    Upgrade to <span className="text-primary-500">Elite.</span>
                </h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto font-bold uppercase tracking-widest text-[10px] leading-loose">
                    Experience the full power of AI-driven MDCAT preparation with advanced analytics and unlimited access.
                </p>
            </div>

            {step === "pricing" && (
                <div className="max-w-3xl mx-auto">
                    <ScoreImprovementCalculator onUnlock={() => setStep("checkout")} />
                </div>
            )}

            <AnimatePresence mode="wait">
                {step === "pricing" ? (
                    <motion.div
                        key="pricing"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
                    >
                        {/* Free Tier */}
                        <div className="bg-surface rounded-4xl p-8 border border-surface-border shadow-xl opacity-60 flex flex-col">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 italic mb-2">Standard.</h2>
                            <div className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-8 italic">Free</div>
                            <ul className="space-y-4 mb-10 grow">
                                {["5 Practice Quizzes", "Study Copilot (3 uploads, 10 msgs/day)", "Explain mode only", "Basic Analytics"].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-gray-500 dark:text-gray-400 font-bold italic text-sm">
                                        <Check className="w-4 h-4 text-gray-400" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <div className="w-full py-4 text-center font-black uppercase tracking-widest text-[10px] text-gray-400">Current Plan</div>
                        </div>

                        {/* Monthly Pass — low-commitment entry tier */}
                        <div className="bg-surface rounded-4xl p-8 border-2 border-primary-200 dark:border-primary-900/50 shadow-xl flex flex-col">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 italic mb-2">Monthly Pass.</h2>
                            <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-black italic text-primary-600 dark:text-primary-400">{PLANS.monthly_pass.priceLabel}</span>
                                <span className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">/ {PLANS.monthly_pass.durationLabel}</span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8">One-time payment. No auto-renewal.</p>
                            <ul className="space-y-4 mb-10 grow">
                                {[
                                    "Everything in Elite for 30 days",
                                    "Unlimited Premium Quizzes",
                                    "Study Copilot — unlimited uploads & messages",
                                    "AI Mistake Analyzer & Weakness Radar",
                                ].map(f => (
                                    <li key={f} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-bold italic text-sm">
                                        <Check className="w-4 h-4 text-primary-500" /> {f}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => goToCheckout("monthly_pass")}
                                className="w-full py-5 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-900/50 font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-primary-100 dark:hover:bg-primary-950/70 transition-all flex items-center justify-center gap-3 group"
                            >
                                Get Monthly Pass <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>

                        {/* Elite Annual — flagship tier */}
                        <div className="relative group">
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 bg-primary-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">Best Value</div>
                            <div className="absolute -inset-1 bg-linear-to-r from-primary-600 to-purple-600 rounded-[2.6rem] blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                            <div className="relative bg-black rounded-4xl p-8 text-white shadow-2xl border border-white/10 h-full flex flex-col">
                                <div className="absolute top-0 right-0 p-8">
                                    <Rocket className="w-12 h-12 text-primary-500/20 rotate-12" />
                                </div>
                                <h2 className="text-2xl font-black italic mb-2">Elite.</h2>
                                <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-4xl font-black italic text-primary-500">{PLANS.elite_annual.priceLabel}</span>
                                    <span className="text-white/40 font-bold uppercase text-[9px] tracking-widest">/ {PLANS.elite_annual.durationLabel}</span>
                                </div>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-8">≈ Rs. 208/month. One payment for the whole exam year.</p>
                                <ul className="space-y-4 mb-10 grow">
                                    {[
                                        "Unlimited Premium Quizzes",
                                        "Study Copilot — unlimited uploads & messages",
                                        "All chat modes (Quiz me, Flashcards, Revise)",
                                        "AI Mistake Analyzer & Weakness Radar",
                                        "Chat with your own notes + full library",
                                        "Priority Support Channel"
                                    ].map(f => (
                                        <li key={f} className="flex items-center gap-3 font-bold italic text-sm">
                                            <div className="w-5 h-5 rounded-full bg-primary-500/20 flex items-center justify-center">
                                                <Check className="w-3 h-3 text-primary-500" />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={() => goToCheckout("elite_annual")}
                                    className="w-full py-6 bg-primary-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-3 group"
                                >
                                    Activate Elite Status <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="checkout"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="max-w-2xl mx-auto bg-surface rounded-4xl p-10 border border-surface-border shadow-2xl"
                    >
                        <button onClick={() => setStep("pricing")} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8 hover:text-gray-900 dark:text-gray-100 transition-colors">
                            <ChevronRight className="w-3 h-3 rotate-180" /> Back to Plans
                        </button>

                        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 italic mb-2 tracking-tighter">Checkout.</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">{plan.name} — {plan.priceLabel} / {plan.durationLabel}</p>

                        <div className="space-y-8">
                            {/* Automated checkout — primary path */}
                            <div className="bg-black text-white p-6 rounded-4xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-primary-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-400">Secure Instant Checkout</span>
                                </div>
                                <p className="text-sm font-bold text-white/70 italic">
                                    Pay by card, JazzCash, or Easypaisa. Your access activates instantly — no waiting for manual review.
                                </p>
                                <LoadingButton
                                    onClick={handleSecureCheckout}
                                    loading={checkoutLoading}
                                    className="w-full py-6 bg-primary-600 text-white font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-primary-500 transition-all shadow-xl shadow-primary-600/30 flex items-center justify-center gap-3"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Pay {plan.priceLabel} Securely
                                </LoadingButton>
                                {checkoutError && (
                                    <p className="text-[11px] font-bold text-red-400 text-center">{checkoutError}</p>
                                )}
                            </div>

                            {selectedPlan !== "elite_annual" ? (
                                <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Manual bank transfer is only available for the Elite Annual plan — the Monthly Pass is instant-checkout only.
                                </p>
                            ) : (
                            <>
                            <button
                                onClick={() => setShowManualFallback((v) => !v)}
                                className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                {showManualFallback ? "Hide manual bank transfer option" : "Prefer a manual bank transfer instead?"}
                            </button>

                            {!showManualFallback ? null : (
                            <>
                            {/* Payment Instruction */}
                            <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-100 dark:border-primary-900/30 p-6 rounded-4xl space-y-4">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="w-5 h-5 text-primary-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary-600">Payment Protocol</span>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 italic">Please send <span className="text-primary-600">Rs. 2500</span> to:</p>
                                    <div className="p-4 bg-surface rounded-xl border border-primary-200 dark:border-primary-900/40">
                                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">JazzCash / Nayapay</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight">03035116528</p>
                                        <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase">Account Title: Adil Salman Butt</p>
                                    </div>
                                </div>
                            </div>

                            {/* Verification Form */}
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Transaction ID</label>
                                    <input
                                        type="text"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        placeholder="Enter the 10-12 digit ID"
                                        className={`w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-slate-950/50 border placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-surface transition-all font-bold text-gray-900 dark:text-gray-100 italic ${autoTransactionId ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-gray-100 dark:border-slate-800"}`}
                                    />
                                    {autoTransactionId && (
                                        <p className="text-[9px] text-emerald-600 font-bold uppercase tracking-widest">
                                            Auto-generated from file: {autoTransactionId}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Screenshot Evidence</label>
                                    <div
                                        onClick={() => document.getElementById('screenshot-upload')?.click()}
                                        className={`border-2 border-dashed rounded-4xl p-10 text-center cursor-pointer transition-all ${screenshot ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : "border-surface-border bg-gray-50 dark:bg-slate-900/60 hover:bg-surface hover:border-primary-300"}`}
                                    >
                                        <input type="file" id="screenshot-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                                        {screenshot ? (
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg"><Check className="w-6 h-6" /></div>
                                                <p className="text-xs font-black text-emerald-900 dark:text-emerald-300 italic truncate w-full px-4">{screenshot.name}</p>
                                                {(parsedTitle || parsedYear) && (
                                                    <div className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest bg-emerald-100 dark:bg-emerald-950/40 px-2 py-1 rounded-lg">
                                                        {parsedTitle && <span>Title: {parsedTitle}</span>}
                                                        {parsedTitle && parsedYear && <span> • </span>}
                                                        {parsedYear && <span>Year: {parsedYear}</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-2">
                                                <Upload className="w-8 h-8 text-gray-300 mb-2" />
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Click to upload Proof</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <LoadingButton
                                    onClick={handleSubmitPayment}
                                    loading={uploading}
                                    disabled={!screenshot || !transactionId}
                                    className="w-full py-6 bg-gray-900 text-white font-black rounded-3xl uppercase tracking-widest text-xs hover:bg-black transition-all shadow-2xl shadow-black/20 flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95"
                                >
                                    <Shield className="w-4 h-4 text-primary-500" />
                                    Submit for Verification
                                </LoadingButton>

                                <div className="flex items-center gap-2 justify-center text-[9px] font-black text-gray-300 uppercase tracking-[0.2em] italic">
                                    <Clock className="w-3 h-3" /> Activation in 1-2 Hours
                                </div>
                            </div>
                            </>
                            )}
                            </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function UpgradePage() {
    return (
        <Suspense fallback={
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <UpgradePageContent />
        </Suspense>
    );
}

function Lock(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    )
}
