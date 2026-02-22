import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./profile-client";
import { User } from "lucide-react";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) {
        redirect("/dashboard");
    }

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-8 text-white shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
                <div className="relative">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-4">
                        <User className="w-4 h-4" />
                        Account Settings
                    </div>
                    <h1 className="text-3xl font-bold">Your Profile</h1>
                    <p className="mt-2 text-gray-400 max-w-lg">
                        Manage your account settings, security preferences, and personal information.
                    </p>
                </div>
            </div>

            <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50 rounded-2xl border border-gray-100" />}>
                <ProfileClient user={profile} />
            </Suspense>
        </div>
    );
}
