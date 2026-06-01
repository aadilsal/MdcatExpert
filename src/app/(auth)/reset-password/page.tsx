"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
    KeyRound,
    AlertCircle,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowLeft,
    CheckCircle,
} from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { LoadingButton } from "@/components/loading-button";
import { formatUserError } from "@/lib/format-user-error";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn } = useAuthActions();
    const emailFromQuery = searchParams.get("email") ?? "";
    const justSent = searchParams.get("sent") === "1";

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    return (
        <div className="w-full max-w-md animate-fade-in">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 mb-4 ring-1 ring-primary-100">
                        <KeyRound className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Set new password</h1>
                    <p className="mt-2.5 text-gray-500 font-medium tracking-tight">
                        Enter the code from your email and choose a new password
                    </p>
                </div>

                {justSent && (
                    <div className="mb-8 p-4 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3 text-emerald-800">
                        <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-relaxed">
                            If an account exists for that email, we sent a reset code. Check your
                            inbox and spam folder.
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                <form
                    className="space-y-5"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setError(null);

                        const form = e.currentTarget;
                        const newPassword = (
                            form.elements.namedItem("newPassword") as HTMLInputElement
                        ).value;
                        const confirmPassword = (
                            form.elements.namedItem("confirmPassword") as HTMLInputElement
                        ).value;

                        if (newPassword !== confirmPassword) {
                            setError("Passwords do not match.");
                            return;
                        }
                        if (newPassword.length < 6) {
                            setError("Password must be at least 6 characters.");
                            return;
                        }

                        setIsPending(true);
                        try {
                            const formData = new FormData(form);
                            formData.set("flow", "reset-verification");
                            await signIn("password", formData);
                            router.push("/dashboard");
                            router.refresh();
                        } catch (err) {
                            setError(
                                formatUserError(
                                    err,
                                    "Could not reset password. Check your code and try again.",
                                ),
                            );
                        } finally {
                            setIsPending(false);
                        }
                    }}
                >
                    <input type="hidden" name="flow" value="reset-verification" />

                    <div>
                        <label
                            htmlFor="email"
                            className="block text-sm font-semibold text-gray-700 mb-2 ml-1"
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
                                defaultValue={emailFromQuery}
                                placeholder="you@example.com"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="code"
                            className="block text-sm font-semibold text-gray-700 mb-2 ml-1"
                        >
                            Reset code
                        </label>
                        <input
                            id="code"
                            name="code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            required
                            placeholder="8-digit code"
                            className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200 font-mono tracking-widest"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="newPassword"
                            className="block text-sm font-semibold text-gray-700 mb-2 ml-1"
                        >
                            New password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                placeholder="Min 6 characters"
                                className="w-full pl-11 pr-12 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="confirmPassword"
                            className="block text-sm font-semibold text-gray-700 mb-2 ml-1"
                        >
                            Confirm new password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirm ? "text" : "password"}
                                required
                                minLength={6}
                                placeholder="Repeat password"
                                className="w-full pl-11 pr-12 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                            >
                                {showConfirm ? (
                                    <EyeOff className="w-5 h-5" />
                                ) : (
                                    <Eye className="w-5 h-5" />
                                )}
                            </button>
                        </div>
                    </div>

                    <LoadingButton
                        type="submit"
                        loading={isPending}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        <>
                            <span>Update password</span>
                            <KeyRound className="w-5 h-5" />
                        </>
                    </LoadingButton>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col items-center gap-3">
                    <Link
                        href="/forgot-password"
                        className="text-sm text-primary-600 font-bold hover:text-primary-700 transition-colors"
                    >
                        Request a new code
                    </Link>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense
            fallback={
                <div className="w-full max-w-md text-center text-gray-400 text-sm font-medium">
                    Loading…
                </div>
            }
        >
            <ResetPasswordForm />
        </Suspense>
    );
}
