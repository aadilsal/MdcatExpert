import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

/** Legacy path — prefer server `fetchQuery` from the app. Body is ignored; user comes from the session. */
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
        const attempts = await fetchQuery(api.attempts.getUserAttempts, { userId: me._id as Id<"users"> }, { token });
        return NextResponse.json(attempts ?? []);
    } catch (error) {
        console.error("dashboard/attempts:", error);
        return NextResponse.json([], { status: 200 });
    }
}
