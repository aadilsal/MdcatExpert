"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, Eye, EyeOff, AlertCircle, Mail, Lock, User, Sparkles, Ticket } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { LoadingButton } from "@/components/loading-button";
import { formatUserError } from "@/lib/format-user-error";
import { sendWelcomeEmailAction } from "./actions";

export default function SignupPage() {
    const router = useRouter();
    const { signIn } = useAuthActions();
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [promoCode, setPromoCode] = useState("");
    const searchParams = useSearchParams();
    const goElite = searchParams.get("goElite") === "true";

    return (
        <div className="w-full max-w-md animate-fade-in">
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-slate-800/45 p-8 sm:p-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 mb-4 ring-1 ring-primary-100 dark:ring-primary-900/30">
                        {goElite ? <Sparkles className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Create Account</h1>
                    <p className="mt-2.5 text-gray-500 dark:text-slate-400 font-medium tracking-tight">
                        {goElite ? "Join Elite and unlock AI-powered learning" : "Join thousands of MDCAT aspirants"}
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 flex items-start gap-3 text-red-700 dark:text-red-400 animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                {goElite && (
                    <div className="mb-8 p-4 rounded-xl bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/30 flex items-start gap-3 text-primary-700 dark:text-primary-400">
                        <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold">Going Elite!</p>
                            <p className="text-xs mt-1 opacity-90">Create your account first, then upload your payment screenshot.</p>
                        </div>
                    </div>
                )}

                <form
                    className="space-y-5"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setIsPending(true);
                        setError(null);
                        try {
                            const formData = new FormData(e.currentTarget);
                            const email = formData.get("email") as string;
                            const name = formData.get("name") as string;
                            formData.set("flow", "signUp");
                            await signIn("password", formData);

                            // Send welcome email in background
                            try {
                                await sendWelcomeEmailAction(email, name);
                            } catch (emailErr) {
                                console.error("Welcome email failed asynchronously:", emailErr);
                            }

                            const trimmedPromo = promoCode.trim();
                            if (trimmedPromo) {
                                const promoRes = await fetch("/api/auth/redeem-promo", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ promoCode: trimmedPromo.toUpperCase() }),
                                });

                                if (!promoRes.ok) {
                                    const promoData = await promoRes.json();
                                    setError(
                                        formatUserError(
                                            promoData?.error ?? "Invalid promo code.",
                                            "Invalid promo code.",
                                        ),
                                    );
                                    return;
                                }

                                router.push("/dashboard");
                                router.refresh();
                                return;
                            }

                            router.push(goElite ? "/signup-payment" : "/dashboard");
                            router.refresh();
                        } catch (err) {
                            setError(formatUserError(err, "Signup failed. Please try again."));
                        } finally {
                            setIsPending(false);
                        }
                    }}
                >

                    <div>
                        <label
                            htmlFor="name"
                            className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 ml-1"
                        >
                            Full Name
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <User className="w-5 h-5" />
                            </div>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                placeholder="Ahmad Ali"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
                            />
                        </div>
                    </div>

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
                                placeholder="you@example.com"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 ml-1"
                        >
                            Password
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                minLength={6}
                                placeholder="Min. 6 characters"
                                className="w-full pl-11 pr-12 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 focus:outline-none transition-colors"
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
                            htmlFor="promoCode"
                            className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2 ml-1"
                        >
                            Promo Code <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-amber-500 transition-colors">
                                <Ticket className="w-5 h-5" />
                            </div>
                            <input
                                id="promoCode"
                                name="promoCode"
                                type="text"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value)}
                                placeholder="e.g. FIRST100"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-200 uppercase"
                            />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-1">Enter a free promo code to bypass payment and unlock Premium.</p>
                    </div>

                    <LoadingButton
                        type="submit"
                        loading={isPending}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 mt-2"
                    >
                        <>
                            <span>{goElite ? "Continue to Payment" : "Create Account"}</span>
                            {goElite ? <Sparkles className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                        </>
                    </LoadingButton>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100 dark:border-slate-800/60 text-center">
                    <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-primary-600 dark:text-primary-400 font-bold hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
