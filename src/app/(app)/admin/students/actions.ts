"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateUserRoleAction(userId: string, newRole: 'student' | 'admin') {
    const supabase = await createClient();

    // The RLS policy "Admins can update all users" uses is_admin()
    // which checks public.users. So as long as the logged in user is an admin,
    // they can update the role of other users.
    const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

    if (error) {
        console.error("Failed to update user role:", error);
        throw new Error(error.message || "Failed to update user role.");
    }

    revalidatePath("/admin/students");
    return { success: true };
}
