"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, AlertCircle, Mail, ArrowLeft } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { LoadingButton } from "@/components/loading-button";
import { formatUserError } from "@/lib/format-user-error";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { signIn } = useAuthActions();
    const [isPending, setIsPending] = useState(false);
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="w-full max-w-md animate-fade-in">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/45 p-8 sm:p-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 mb-4 ring-1 ring-primary-100 dark:ring-primary-900/30">
                        <KeyRound className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Forgot password?</h1>
                    <p className="mt-2.5 text-gray-500 dark:text-slate-400 font-medium tracking-tight">
                        We&apos;ll email you a code to reset your password
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3 text-red-700 dark:text-red-400 animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                <form
                    className="space-y-6"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        if (isPending || codeSent) return;

                        setIsPending(true);
                        setError(null);
                        try {
                            const formData = new FormData(e.currentTarget);
                            const email = String(formData.get("email") ?? "").trim();
                            formData.set("flow", "reset");
                            try {
                                await signIn("password", formData);
                            } catch {
                                // Same redirect whether or not the email exists (avoid enumeration).
                            }
                            setCodeSent(true);
                            router.push(
                                `/reset-password?email=${encodeURIComponent(email)}&sent=1`,
                            );
                        } catch (err) {
                            setError(
                                formatUserError(
                                    err,
                                    "Could not send reset code. Please try again.",
                                ),
                            );
                            setIsPending(false);
                        }
                    }}
                >
                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 ml-1"
                        >
                            Email address
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <Mail className="w-5 h-5" />
                            </div>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                disabled={isPending || codeSent}
                                placeholder="you@example.com"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <LoadingButton
                        type="submit"
                        loading={isPending}
                        disabled={codeSent}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <>
                            <span>{codeSent ? "Redirecting…" : "Send reset code"}</span>
                            <KeyRound className="w-5 h-5" />
                        </>
                    </LoadingButton>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800/60 text-center">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
