import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

/** Legacy path — prefer server `fetchQuery`. Body is ignored; user comes from the session. */
export async function POST() {
    try {
        const token = await convexAuthNextjsToken();
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
        if (!me) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const stats = await fetchQuery(api.attempts.getSubjectPerformance, { userId: me._id as Id<"users"> }, { token });
        return NextResponse.json(stats ?? []);
    } catch (error) {
        console.error("dashboard/subject-stats:", error);
        return NextResponse.json([], { status: 200 });
    }
}
