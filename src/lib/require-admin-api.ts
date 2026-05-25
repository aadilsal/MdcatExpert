import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

export async function requireAdminApi(): Promise<
  | { token: string; me: Doc<"users"> }
  | { error: NextResponse }
> {
  const token = await convexAuthNextjsToken();
  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Please sign in to continue." },
        { status: 401 },
      ),
    };
  }

  const me = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
  if (!me || me.role !== "admin") {
    return {
      error: NextResponse.json(
        { error: "You don't have permission to do this." },
        { status: 403 },
      ),
    };
  }

  return { token, me };
}
