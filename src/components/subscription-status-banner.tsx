import { Clock, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

interface SubscriptionStatusBannerProps {
    subscriptionType: "free" | "premium";
    premiumUntil?: string | null;
    hasPendingPayment?: boolean;
    paymentRequestId?: string;
}

export default function SubscriptionStatusBanner({
    subscriptionType,
    premiumUntil,
    hasPendingPayment,
    paymentRequestId
}: SubscriptionStatusBannerProps) {
    if (subscriptionType === "premium" && !hasPendingPayment) {
        return (
            <div className="bg-linear-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-6 mb-8 flex items-start gap-4">
                <div className="shrink-0">
                    <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Elite Premium Active</h3>
                    <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                        You have full access to all Elite features and AI-powered tools.
                    </p>
                    {premiumUntil && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
                            Access until {new Date(premiumUntil).toLocaleDateString()}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (hasPendingPayment) {
        return (
            <div className="bg-linear-to-r from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl p-6 mb-8 flex items-start gap-4">
                <div className="shrink-0">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-0.5 animate-pulse" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100">Payment Pending Review</h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Your payment screenshot is being verified by our team. In the meantime, you have <strong>free access</strong> to all features for 24 hours.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
                        <Clock className="w-4 h-4" />
                        <span>Expected approval within 24 hours</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-linear-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl p-6 mb-8 flex items-start gap-4">
            <div className="shrink-0">
                <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-400 mt-0.5" />
            </div>
            <div className="flex-1">
                <h3 className="font-bold text-amber-900 dark:text-amber-100">Free Version</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Upgrade to Elite to unlock AI Weakness Radar, Mistake Analyzer, and more advanced features.
                </p>
                <Link
                    href="/upgrade"
                    className="inline-block mt-4 px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-lg hover:bg-amber-700 transition-colors"
                >
                    Upgrade to Elite
                </Link>
            </div>
        </div>
    );
}
