"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function approvePaymentAction(requestId: string, userId: string, adminMessage: string) {
    const supabase = await createClient();

    const { data: adminUser } = await supabase.auth.getUser();
    const adminId = adminUser?.user?.id || null;

    // 1. Mark request as approved with metadata
    const { error: requestError } = await supabase
        .from("payment_requests")
        .update({
            status: "approved",
            review_reason: adminMessage,
            verified_by: adminId,
            processed_at: new Date().toISOString()
        })
        .eq("id", requestId);

    if (requestError) throw requestError;

    // 2. Update user subscription status
    const premiumUntil = new Date();
    premiumUntil.setFullYear(premiumUntil.getFullYear() + 10); // 10 years for "lifetime"

    const { error: userError } = await supabase
        .from("users")
        .update({
            subscription_type: "premium",
            premium_until: premiumUntil.toISOString()
        })
        .eq("id", userId);

    if (userError) throw userError;

    // 3. Log a notification for the user
    const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
            user_id: userId,
            title: "Payment approved",
            message: `Your payment has been verified and your account is now premium. Reason: ${adminMessage}`,
            read: false
        });

    if (notifyError) console.error("Could not log notification", notifyError);

    revalidatePath("/admin/payments");
    return { success: true };
}

export async function rejectPaymentAction(requestId: string, userId: string, adminMessage: string) {
    const supabase = await createClient();

    const { data: adminUser } = await supabase.auth.getUser();
    const adminId = adminUser?.user?.id || null;

    const { error } = await supabase
        .from("payment_requests")
        .update({
            status: "rejected",
            review_reason: adminMessage,
            verified_by: adminId,
            processed_at: new Date().toISOString()
        })
        .eq("id", requestId);

    if (error) throw error;

    const { error: notifyError } = await supabase
        .from("notifications")
        .insert({
            user_id: userId,
            title: "Payment rejected",
            message: `Your payment was rejected. Reason: ${adminMessage}`,
            read: false
        });

    if (notifyError) console.error("Could not log notification", notifyError);

    revalidatePath("/admin/payments");
    return { success: true };
}
