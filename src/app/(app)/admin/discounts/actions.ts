"use server";

import { revalidatePath } from "next/cache";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

async function ensureAdmin(token: string) {
  const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!me || me.role !== "admin") {
    throw new Error("Forbidden");
  }
}

export async function createPromoCodeAction(formData: FormData) {
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  await ensureAdmin(token);

  const code = formData.get("code")?.toString().trim().toUpperCase();
  const description = formData.get("description")?.toString().trim();
  const maxUsesValue = formData.get("maxUses")?.toString().trim();
  const maxUses = Number(maxUsesValue || "0");

  if (!code) throw new Error("Promo code is required.");
  if (!maxUses || maxUses <= 0) throw new Error("Max uses must be a positive number.");

  await fetchMutation(api.users.createPromoCode, { code, description: description || undefined, maxUses }, { token });
  revalidatePath("/admin/discounts");
}

export async function togglePromoCodeActiveAction(formData: FormData) {
  const token = await convexAuthNextjsToken();
  if (!token) throw new Error("Unauthorized");
  await ensureAdmin(token);

  const promoId = formData.get("promoId")?.toString();
  const isActiveValue = formData.get("isActive")?.toString();
  if (!promoId) throw new Error("Missing promo ID.");
  if (isActiveValue !== "true" && isActiveValue !== "false") throw new Error("Invalid active flag.");

  await fetchMutation(api.users.togglePromoCodeActive, { promoId: promoId as Id<"promoCodes">, isActive: isActiveValue === "true" }, { token });
  revalidatePath("/admin/discounts");
}
