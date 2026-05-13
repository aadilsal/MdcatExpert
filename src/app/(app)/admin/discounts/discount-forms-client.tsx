"use client";

import { FormSubmitButton } from "@/components/form-submit-button";
import { ToggleLeft, ToggleRight } from "lucide-react";
import { createPromoCodeAction, togglePromoCodeActiveAction } from "./actions";

export function TogglePromoForm({ promoId, isActive }: { promoId: string; isActive: boolean }) {
    return (
        <form action={togglePromoCodeActiveAction} className="inline-flex">
            <input type="hidden" name="promoId" value={promoId} />
            <input type="hidden" name="isActive" value={isActive ? "false" : "true"} />
            <FormSubmitButton className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60 disabled:cursor-not-allowed">
                {isActive ? (
                    <>
                        <ToggleLeft className="w-4 h-4" />
                        Deactivate
                    </>
                ) : (
                    <>
                        <ToggleRight className="w-4 h-4" />
                        Activate
                    </>
                )}
            </FormSubmitButton>
        </form>
    );
}

export function CreatePromoForm() {
    return (
        <form action={createPromoCodeAction} className="space-y-5">
            <div>
                <label htmlFor="code" className="text-sm font-semibold text-slate-900">
                    Code
                </label>
                <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    placeholder="FIRST100"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
            </div>
            <div>
                <label htmlFor="description" className="text-sm font-semibold text-slate-900">
                    Description
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={3}
                    placeholder="First 100 users get premium access"
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
            </div>
            <div>
                <label htmlFor="maxUses" className="text-sm font-semibold text-slate-900">
                    Max Uses
                </label>
                <input
                    id="maxUses"
                    name="maxUses"
                    type="number"
                    min={1}
                    required
                    defaultValue={100}
                    className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                />
            </div>
            <FormSubmitButton className="inline-flex items-center justify-center w-full rounded-3xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition disabled:opacity-60 disabled:cursor-not-allowed">
                Create Discount
            </FormSubmitButton>
        </form>
    );
}
