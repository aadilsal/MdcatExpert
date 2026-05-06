"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";

export default function SignOutButton() {
    const router = useRouter();
    const { signOut } = useAuthActions();

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error("Sign out error", error);
        }
        router.push("/login");
        router.refresh();
    };
    return (
        <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
            <LogOut className="w-5 h-5" />
            Sign out
        </button>
    );
}
