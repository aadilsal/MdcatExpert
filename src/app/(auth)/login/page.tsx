"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Eye, EyeOff, Loader2, AlertCircle, Mail, Lock } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function LoginPage() {
    const router = useRouter();
    const { signIn } = useAuthActions();
    const [showPassword, setShowPassword] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setError(null);
    }, []);

    return (
        <div className="w-full max-w-md animate-fade-in">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 sm:p-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 mb-4 ring-1 ring-primary-100">
                        <LogIn className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h1>
                    <p className="mt-2.5 text-gray-500 font-medium tracking-tight">
                        Log in to continue your preparation
                    </p>
                </div>

                {error && (
                    <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 text-red-700 animate-shake">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium leading-relaxed">{error}</p>
                    </div>
                )}

                <form
                    className="space-y-6"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        setIsPending(true);
                        setError(null);
                        try {
                            const formData = new FormData(e.currentTarget);
                            formData.set("flow", "signIn");
                            await signIn("password", formData);
                            router.push("/dashboard");
                            router.refresh();
                        } catch (err) {
                            setError(err instanceof Error ? err.message : "Sign in failed.");
                        } finally {
                            setIsPending(false);
                        }
                    }}
                >
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
                                placeholder="you@example.com"
                                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 focus:bg-white transition-all duration-200"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2 ml-1">
                            <label
                                htmlFor="password"
                                className="block text-sm font-semibold text-gray-700"
                            >
                                Password
                            </label>
                        </div>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                <Lock className="w-5 h-5" />
                            </div>
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="••••••••"
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

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-600/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                    >
                        {isPending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Sign In</span>
                                <LogIn className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                    <p className="text-sm text-gray-500 font-medium">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="text-primary-600 font-bold hover:text-primary-700 transition-colors"
                        >
                            Create account for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
