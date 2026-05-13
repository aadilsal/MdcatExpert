import { Ticket, Shield, Plus, CheckCircle2, XCircle } from "lucide-react";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { TogglePromoForm, CreatePromoForm } from "./discount-forms-client";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return <div className="p-10 text-center text-gray-500">Unauthorized</div>;
  }

  const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!me || me.role !== "admin") {
    return <div className="p-10 text-center text-gray-500">Forbidden</div>;
  }

  const promoCodes = (await fetchQuery(api.users.getPromoCodes, {}, { token })) || [];

  return (
    <div className="animate-fade-in space-y-8">
      <div className="rounded-3xl overflow-hidden bg-linear-to-br from-slate-900 via-slate-950 to-slate-900 p-8 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.22em] font-black text-emerald-300">
              <Shield className="w-4 h-4" />
              Promo Management
            </div>
            <h1 className="mt-4 text-3xl sm:text-4xl font-black tracking-tight">Discount Codes</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Create free signup promotions, track usage, and toggle active discount codes for your first 100 premium users.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-900/90 border border-white/10 p-5 shadow-xl">
            <p className="text-sm text-slate-400">Active codes</p>
            <p className="mt-2 text-4xl font-black text-white">{promoCodes.length}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-3xl bg-white border border-gray-100 shadow-xl p-8">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Existing Discounts</h2>
              <p className="mt-1 text-sm text-slate-500">Review promo codes and toggle availability.</p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
              <Ticket className="w-4 h-4" />
              {promoCodes.filter((promo) => promo.isActive).length} active
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left border-separate border-spacing-y-3">
              <thead>
                <tr className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Uses</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {promoCodes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No discount codes created yet.
                    </td>
                  </tr>
                ) : (
                  promoCodes.map((promo) => (
                    <tr key={promo._id} className="bg-slate-50 rounded-3xl shadow-sm">
                      <td className="px-4 py-4 font-semibold text-slate-900">{promo.code}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{promo.usedCount}/{promo.maxUses}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${promo.isActive ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                          {promo.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {promo.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">{new Date(promo.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <TogglePromoForm promoId={promo._id} isActive={promo.isActive} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-white border border-gray-100 shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-2xl bg-primary-600/10 p-3 text-primary-600">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Create New Code</h2>
              <p className="text-sm text-slate-500">Add a promo code for premium signup access.</p>
            </div>
          </div>

          <CreatePromoForm />
        </section>
      </div>
    </div>
  );
}
