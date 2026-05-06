import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import type { Id } from "../../../../../convex/_generated/dataModel";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    const token = await convexAuthNextjsToken();
    if (!token) return NextResponse.json([], { status: 401 });

    const stats = await fetchQuery(
      api.attempts.getSubjectPerformance,
      { userId: userId as Id<"users"> },
      { token },
    );
    return NextResponse.json(stats ?? []);
  } catch (error) {
    console.error("Error fetching subject stats:", error);
    return NextResponse.json([]);
  }
}
