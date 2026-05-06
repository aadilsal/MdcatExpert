"use server";

import { revalidatePath } from "next/cache";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";

export async function updateProfile(formData: { name: string; phone?: string }) {
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized");
    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me) throw new Error("Unauthorized");

    await fetchMutation(api.users.updateProfile, { userId: me._id, name: formData.name, email: undefined }, { token });
    await fetchMutation(api.users.setPhone, { phone: formData.phone || null }, { token });

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updatePassword(password: string) {
    void password;
    throw new Error("Password change is not available yet. Use password reset from login.");
}

export async function setEmailNotifications(enabled: boolean) {
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized");
    await fetchMutation(api.users.setEmailNotificationPreference, { enabled }, { token });
    revalidatePath("/profile");
    return { success: true };
}
