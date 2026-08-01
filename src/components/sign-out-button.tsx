"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { clearMeClientCache } from "@/lib/me-client-cache";
import { LoadingButton } from "@/components/loading-button";

export default function SignOutButton() {
    const router = useRouter();
    const { signOut } = useAuthActions();
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        if (signingOut) return;
        setSigningOut(true);
        try {
            await signOut();
        } catch (error) {
            console.error("Sign out error", error);
        }
        clearMeClientCache();
        router.push("/login");
    };
    return (
        <LoadingButton
            onClick={handleSignOut}
            loading={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
        >
            <LogOut className="w-5 h-5" />
            Sign out
        </LoadingButton>
    );
}
