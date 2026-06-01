import { redirect } from "next/navigation";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import AdminAnalyticsClient from "./admin-analytics-client";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
    const token = await convexAuthNextjsToken();
    if (!token) {
        redirect("/login");
    }

    const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!me || me.role !== "admin") {
        return (
            <div className="text-center py-20 text-red-500 font-black">
                Forbidden
            </div>
        );
    }

    const dashboard = await fetchQuery(
        api.adminAnalytics.getAdminDashboard,
        { periodDays: 30 },
        { token },
    );

    return <AdminAnalyticsClient data={dashboard} />;
}
