"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

type Status = "checking" | "created" | "succeeded" | "failed" | "not_found" | "error";

// Shown after the shopper returns from Safepay's hosted checkout page.
// This polls our own status endpoint for a fast result, but the webhook
// (src/app/api/webhooks/safepay/route.ts) is what actually activates
// premium — if it's still "created" after a few tries, the webhook just
// hasn't arrived yet, not necessarily a failure.
function CompleteContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tracker = searchParams.get("tracker");
    const [status, setStatus] = useState<Status>("checking");
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        if (!tracker) {
            setStatus("not_found");
            return;
        }

        let cancelled = false;
        const poll = async () => {
            try {
                const res = await fetch(`/api/checkout/status?tracker=${encodeURIComponent(tracker)}`);
                const json = await res.json();
                if (cancelled) return;
                if (json.status === "succeeded" || json.status === "failed" || json.status === "not_found") {
                    setStatus(json.status);
                } else {
                    setAttempts((a) => a + 1);
                }
            } catch {
                if (!cancelled) setStatus("error");
            }
        };

        poll();
        const interval = setInterval(poll, 2500);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [tracker]);

    useEffect(() => {
        // Stop polling after ~30s (12 attempts) — webhooks can occasionally lag.
        if (attempts >= 12 && status === "checking") {
            setStatus("created"); // still pending, but stop spinning forever
        }
    }, [attempts, status]);

    if (status === "succeeded") {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-24 h-24 bg-emerald-500 text-white rounded-4xl flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/20"
                >
                    <CheckCircle className="w-12 h-12" />
                </motion.div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight italic">Elite Access Activated.</h1>
                <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md mb-10 italic">
                    Your payment was confirmed automatically. No waiting for manual review — you're all set.
                </p>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="px-10 py-5 bg-gray-900 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    if (status === "failed") {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-24 h-24 bg-red-500 text-white rounded-4xl flex items-center justify-center mb-8 shadow-2xl shadow-red-500/20">
                    <XCircle className="w-12 h-12" />
                </div>
                <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight italic">Payment Didn&apos;t Go Through.</h1>
                <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md mb-10 italic">
                    No charge was completed. You can try again, or use the manual bank transfer option instead.
                </p>
                <Link
                    href="/upgrade"
                    className="px-10 py-5 bg-gray-900 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl"
                >
                    Back to Upgrade
                </Link>
            </div>
        );
    }

    if (status === "not_found" || status === "error") {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
                <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight italic">We couldn&apos;t confirm that payment.</h1>
                <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md mb-10 italic">
                    If money left your account, it will still be confirmed automatically within a few minutes via our payment provider. Otherwise, please try again.
                </p>
                <Link
                    href="/upgrade"
                    className="px-10 py-5 bg-gray-900 text-white font-black rounded-3xl uppercase tracking-widest text-[10px] hover:bg-black transition-all shadow-2xl"
                >
                    Back to Upgrade
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-6" />
            <h1 className="text-2xl font-black text-gray-900 dark:text-gray-100 mb-2 tracking-tight italic">Confirming your payment...</h1>
            <p className="text-gray-400 font-bold text-sm max-w-sm">
                This usually takes a few seconds. Don&apos;t close this page.
            </p>
        </div>
    );
}

export default function UpgradeCompletePage() {
    return (
        <Suspense fallback={
            <div className="min-h-[70vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            </div>
        }>
            <CompleteContent />
        </Suspense>
    );
}
