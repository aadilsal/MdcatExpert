"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { Clock, CheckCircle, AlertCircle, Sparkles, Bell, BellOff } from "lucide-react";
import Link from "next/link";
import { api } from "../../convex/_generated/api";

interface SubscriptionStatusBannerProps {
    subscriptionType: "free" | "premium";
    /** Epoch milliseconds. Convex stores this as a number — never stringify it before passing it in. */
    premiumUntil?: number | null;
    hasPendingPayment?: boolean;
    paymentRequestId?: string;
    /** Defaults to true server-side when unset — reminders are opt-out, not opt-in. */
    renewalRemindersEnabled?: boolean;
}

function RenewalReminderToggle({ initialEnabled }: { initialEnabled: boolean }) {
    const setRenewalRemindersEnabled = useMutation(api.users.setRenewalRemindersEnabled);
    const [enabled, setEnabled] = useState(initialEnabled);
    const [saving, setSaving] = useState(false);

    const toggle = async () => {
        const next = !enabled;
        setEnabled(next); // optimistic
        setSaving(true);
        try {
            await setRenewalRemindersEnabled({ enabled: next });
        } catch {
            setEnabled(!next); // revert on failure
        } finally {
            setSaving(false);
        }
    };

    return (
        <button
            onClick={toggle}
            disabled={saving}
            className="mt-3 flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 transition-colors disabled:opacity-50"
            title={enabled ? "You'll get an email before this expires — click to turn off" : "You won't be emailed before this expires — click to turn on"}
        >
            {enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
            <span className="underline decoration-dotted underline-offset-2">
                Renewal reminder emails: {enabled ? "On" : "Off"}
            </span>
        </button>
    );
}

export default function SubscriptionStatusBanner({
    subscriptionType,
    premiumUntil,
    hasPendingPayment,
    paymentRequestId,
    renewalRemindersEnabled
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
                    {premiumUntil && !Number.isNaN(new Date(premiumUntil).getTime()) && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-semibold">
                            Access until{" "}
                            {new Date(premiumUntil).toLocaleDateString("en-PK", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </p>
                    )}
                    {/* No auto-renewal — this is the actual "cancel anytime" control. */}
                    <RenewalReminderToggle initialEnabled={renewalRemindersEnabled !== false} />
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
