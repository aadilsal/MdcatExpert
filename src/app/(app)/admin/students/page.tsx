import { Users, Shield, TrendingUp } from "lucide-react";
import StudentTable from "./StudentTable";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../../convex/_generated/dataModel";

type PaymentRequest = Doc<"paymentRequests">;

export default async function AdminStudentsPage() {
    const token = await convexAuthNextjsToken();
    if (!token) {
        return (
            <div className="text-center py-20 text-red-500 font-black">
                Unauthorized
            </div>
        );
    }

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") {
        return (
            <div className="text-center py-20 text-red-500 font-black">
                Forbidden
            </div>
        );
    }

    const users = await fetchQuery(api.users.listUsers, {}, { token });
    const paymentRequests = await fetchQuery(api.payments.getPaymentRequestsByStatus, { status: "pending" }, { token }).catch(
        () => [] as PaymentRequest[],
    );

    const pendingList = (paymentRequests ?? []) as PaymentRequest[];

    const usersWithPayments = (users || []).map((u) => ({
        id: u._id,
        name: u.name ?? "",
        email: u.email ?? "",
        role: u.role ?? "student",
        subscription_type: u.subscriptionType ?? "free",
        promo_code: u.promoCode ?? null,
        promo_source: u.promoSource ?? null,
        premium_until: u.premiumUntil ? new Date(u.premiumUntil).toISOString() : null,
        created_at: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        payment_requests: pendingList
            .filter((req) => req.userId === (u._id as Id<"users">))
            .map((req) => ({
                user_id: req.userId,
                status: req.status,
                amount: req.amount,
                transaction_id: req.transactionId,
                created_at: new Date(req.createdAt).toISOString(),
            })),
    }));

    const totalUsers = usersWithPayments.length;
    const adminCount = usersWithPayments.filter((u) => u.role === "admin").length;
    const studentCount = totalUsers - adminCount;

    const ms30 = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const userDocs = users ?? [];
    const signupsLast30 = userDocs.filter((u) => (u.createdAt ?? 0) > now - ms30).length;
    const signupsPrior30 = userDocs.filter((u) => {
        const t = u.createdAt ?? 0;
        return t <= now - ms30 && t > now - 2 * ms30;
    }).length;
    let growthDisplay = "—";
    if (signupsPrior30 > 0) {
        const pct = Math.round(((signupsLast30 - signupsPrior30) / signupsPrior30) * 100);
        growthDisplay = `${pct >= 0 ? "+" : ""}${pct}%`;
    } else if (signupsLast30 > 0) {
        growthDisplay = "New";
    }

    return (
        <div className="animate-fade-in space-y-12 pb-20 max-w-7xl mx-auto">
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gray-900 border border-white/5 p-12 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4" />
                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                            <Shield className="w-3.5 h-3.5" />
                            Security Clearance Level 04
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none italic">
                            Personnel <span className="text-emerald-500 italic">Registry.</span>
                        </h1>
                        <p className="text-gray-400 font-medium max-w-md">
                            Manage access levels, monitor user distribution, and oversee platform hierarchy.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 backdrop-blur-xl p-6 rounded-4xl border border-white/5 text-center px-8">
                            <p className="text-3xl font-black italic mb-1">{totalUsers}</p>
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Total Nodes</p>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-xl p-6 rounded-4xl border border-emerald-500/20 text-center px-8">
                            <p className="text-3xl font-black italic mb-1 text-emerald-400">{adminCount}</p>
                            <p className="text-[10px] font-black text-emerald-400/50 uppercase tracking-[0.2em]">Administrators</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                    { label: "Active Students", value: studentCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Verified Admins", value: adminCount, icon: Shield, color: "text-primary-600", bg: "bg-primary-50" },
                    {
                        label: "Signup growth (30d vs prior)",
                        value: growthDisplay,
                        icon: TrendingUp,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                    },
                ].map((stat, idx) => (
                    <div
                        key={idx}
                        className="bg-white rounded-4xl p-8 border border-gray-100 shadow-xl shadow-gray-200/20 group hover:border-primary-100 transition-all"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <p className={`text-4xl font-black italic tracking-tighter ${stat.color}`}>{stat.value}</p>
                            </div>
                            <div
                                className={`w-14 h-14 rounded-2xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}
                            >
                                <stat.icon className={`w-7 h-7 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <StudentTable users={usersWithPayments} />
        </div>
    );
}
