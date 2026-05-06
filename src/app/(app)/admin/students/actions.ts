"use server";

import { revalidatePath } from "next/cache";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function updateUserRoleAction(userId: string, newRole: 'student' | 'admin') {
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized");
    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") throw new Error("Forbidden");

    await fetchMutation(api.users.setUserRole, { userId: userId as Id<"users">, role: newRole }, { token });

    revalidatePath("/admin/students");
    return { success: true };
}

export async function updateUserSubscriptionAction(userId: string, subscriptionType: 'free' | 'premium') {
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized");
    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") throw new Error("Forbidden");

    const premiumUntil = subscriptionType === "premium"
        ? new Date(new Date().setFullYear(new Date().getFullYear() + 10)).getTime()
        : undefined;
    await fetchMutation(
        api.users.setSubscription,
        { userId: userId as Id<"users">, subscriptionType, premiumUntil },
        { token }
    );

    revalidatePath("/admin/students");
    return { success: true };
}
