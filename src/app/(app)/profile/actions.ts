"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: { name: string; phone?: string }) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from("users")
        .update({
            name: formData.name,
            phone: formData.phone || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

    if (error) throw error;

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { success: true };
}

export async function updatePassword(password: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password: password,
    });

    if (error) throw error;

    return { success: true };
}
