"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { sendOtpEmailAction } from "../signup/actions";
import { clearMeClientCache } from "@/lib/me-client-cache";
import { LoadingButton } from "@/components/loading-button";
import { RefreshCw, Mail } from "lucide-react";
import Swal from "sweetalert2";

export default function VerifyPage() {
    const router = useRouter();
    const currentUser = useQuery(api.users.getCurrentUserProfile);
    const generateOtp = useMutation(api.users.generateVerificationOtp);
    const verifyOtp = useMutation(api.users.verifyOtp);

    const [otpCode, setOtpCode] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [sending, setSending] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // If user is already verified, redirect immediately
    useEffect(() => {
        if (currentUser && currentUser.emailVerificationTime) {
            router.replace("/dashboard");
        }
    }, [currentUser, router]);

    // Send code on mount once user profile is loaded
    useEffect(() => {
        if (currentUser && !currentUser.emailVerificationTime && !currentUser.otpCode) {
            triggerSendOtp();
        }
    }, [currentUser]);

    // Resend countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const triggerSendOtp = async () => {
        if (!currentUser) return;
        setSending(true);
        try {
            const code = await generateOtp();
            const result = await sendOtpEmailAction(currentUser.email || "", currentUser.name || "Student", code);
            if (!result.success) {
                throw new Error(result.error || "Failed to send verification code.");
            }
            setCountdown(60); // 60s cooldown
            Swal.fire({
                icon: "success",
                title: "Code sent!",
                text: "A 6-digit verification code has been sent to your email.",
                timer: 3000,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Failed to send verification code. Please try again.",
            });
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otpCode.length !== 6) return;
        setVerifying(true);
        try {
            await verifyOtp({ code: otpCode });
            clearMeClientCache();
            await Swal.fire({
                icon: "success",
                title: "Email verified!",
                text: "Welcome to MDCAT Xpert. Redirecting to your dashboard...",
                timer: 2000,
                showConfirmButton: false,
            });
            router.replace("/dashboard");
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: "error",
                title: "Verification failed",
                text: err?.message || "Incorrect verification code.",
            });
        } finally {
            setVerifying(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl space-y-8">
                <div className="text-center space-y-3">
                    <div className="inline-flex p-4 bg-primary-500/10 text-primary-500 rounded-2xl">
                        <Mail className="w-8 h-8" />
                    </div>
                    <h1 className="text-2xl font-black italic text-gray-900 dark:text-white">Verify Your Email</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-bold leading-relaxed">
                        We sent a 6-digit confirmation code to <span className="text-primary-500">{currentUser.email}</span>. Please enter it below to access your portal.
                    </p>
                </div>

                <form onSubmit={handleVerify} className="space-y-6">
                    <div className="space-y-2">
                        <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                            className="w-full text-center tracking-[1.5rem] pl-6 py-5 rounded-2xl bg-gray-50 dark:bg-slate-950 border border-gray-100 dark:border-slate-800 font-black text-2xl placeholder:text-gray-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-primary-500/5 focus:bg-white dark:focus:bg-slate-950 transition-all text-gray-900 dark:text-white"
                        />
                    </div>

                    <LoadingButton
                        type="submit"
                        loading={verifying}
                        disabled={otpCode.length !== 6}
                        className="w-full py-5 bg-gray-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg transition-all active:scale-95 disabled:opacity-30"
                    >
                        Verify & Complete Signup
                    </LoadingButton>
                </form>

                <div className="flex flex-col items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <button
                        onClick={triggerSendOtp}
                        disabled={sending || countdown > 0}
                        className="text-xs font-black uppercase tracking-widest text-primary-600 hover:text-primary-700 disabled:text-gray-400 flex items-center gap-1.5 transition-colors"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
                        {countdown > 0 ? `Resend Code in ${countdown}s` : "Resend Verification Code"}
                    </button>
                    
                    <button
                        onClick={() => router.replace("/login")}
                        className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        Back to Login
                    </button>
                </div>
            </div>
        </div>
    );
}
