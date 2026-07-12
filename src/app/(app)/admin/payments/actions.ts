"use server";

import { revalidatePath } from "next/cache";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";
import { sendEmailNotification } from "@/lib/resend";
import { getPremiumActivatedEmailHtml } from "@/lib/email-templates";

export async function approvePaymentAction(requestId: string, userId: string, adminMessage: string) {
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized");

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") throw new Error("Forbidden");

    const premiumUntil = new Date(new Date().setFullYear(new Date().getFullYear() + 1)).getTime();

    await fetchMutation(
        api.payments.approvePaymentRequest,
        { requestId: requestId as Id<"paymentRequests">, adminId: me._id, premiumUntil, reviewReason: adminMessage },
        { token }
    );

    const target = await fetchQuery(api.users.getUserById, { userId: userId as Id<"users"> }, { token });
    if (target?.email) {
        const enabled = (target.emailNotificationsEnabled ?? true) === true;
        if (enabled) {
            const html = getPremiumActivatedEmailHtml(target.name || "Student");
            await sendEmailNotification({
                to: target.email,
                subject: "Premium Activated Successfully",
                text: `Hello,\n\nYour payment has been verified successfully.\n\nYour Premium membership is now active.\n\nYou can now log in and enjoy:\n• AI Weakness Radar\n• AI Study Planner\n• Predicted MDCAT Score\n• All Past Papers\n• Advanced Analytics\n\nBest of luck in your MDCAT preparation.`,
                html,
            });
        }
    }

    revalidatePath("/admin/payments");
    return { success: true };
}

export async function rejectPaymentAction(requestId: string, userId: string, adminMessage: string) {
    const token = await convexAuthNextjsToken();
    if (!token) throw new Error("Unauthorized");

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") throw new Error("Forbidden");

    await fetchMutation(
        api.payments.rejectPaymentRequest,
        { requestId: requestId as Id<"paymentRequests">, adminId: me._id, reviewReason: adminMessage },
        { token }
    );

    const target = await fetchQuery(api.users.getUserById, { userId: userId as Id<"users"> }, { token });
    if (target?.email) {
        const enabled = (target.emailNotificationsEnabled ?? true) === true;
        if (enabled) {
            await sendEmailNotification({
                to: target.email,
                subject: "MDCAT Xpert: Payment rejected",
                text: `Your payment was rejected. Reason: ${adminMessage}`.trim(),
            });
        }
    }

    revalidatePath("/admin/payments");
    return { success: true };
}
