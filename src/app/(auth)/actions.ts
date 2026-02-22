"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// --- Validation Schemas ---

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

// --- Actions ---

export type AuthState = {
    error?: string;
    success?: boolean;
    fieldErrors?: Record<string, string[]>;
};

export async function loginAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Validate
    const result = loginSchema.safeParse({ email, password });
    if (!result.success) {
        return {
            fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    // 2. Auth
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: error.message };
    }

    // 3. Success
    revalidatePath("/dashboard", "layout");
    redirect("/dashboard");
}

export async function signupAction(prevState: AuthState | null, formData: FormData): Promise<AuthState> {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // 1. Validate
    const result = signupSchema.safeParse({ name, email, password });
    if (!result.success) {
        return {
            fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
        };
    }

    // 2. Auth
    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name },
        },
    });

    if (error) {
        return { error: error.message };
    }

    // 3. Success
    revalidatePath("/dashboard", "layout");
    redirect("/dashboard");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
    redirect("/login");
}
