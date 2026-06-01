import { NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { requireAdminApi } from "@/lib/require-admin-api";
import { formatUserError } from "@/lib/format-user-error";

const VALID_STATUSES = ["pending", "approved", "rejected"] as const;

export async function GET(request: Request) {
  try {
    const auth = await requireAdminApi();
    if ("error" in auth) return auth.error;

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") ?? "pending";
    if (!VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const status = statusParam as (typeof VALID_STATUSES)[number];
    const rows = await fetchQuery(
      api.payments.getPaymentRequestsByStatus,
      { status },
      { token: auth.token },
    );

    const requests = rows.map((req) => ({
      id: req._id,
      user_id: req.userId,
      user_email: req.userEmail,
      transaction_id: req.transactionId,
      screenshot_url: req.screenshotUrl,
      amount: req.amount,
      status: req.status,
      review_reason: req.reviewReason ?? null,
      verified_by: req.verifiedBy ?? null,
      processed_at: req.processedAt ? new Date(req.processedAt).toISOString() : null,
      archive_title: req.archiveTitle ?? null,
      archive_year: req.archiveYear ?? null,
      created_at: new Date(req.createdAt).toISOString(),
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Failed to load payment requests", error);
    return NextResponse.json(
      { error: formatUserError(error, "Failed to load payment requests.") },
      { status: 500 },
    );
  }
}
