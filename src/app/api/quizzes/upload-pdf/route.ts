import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/require-admin-api";

/** PDF ingestion via Python is not wired in local dev; use XLSX upload instead. */
export async function POST() {
  const auth = await requireAdminApi();
  if ("error" in auth) return auth.error;

  return NextResponse.json(
    {
      error:
        "PDF upload is not available yet. Please use an Excel (.xlsx) file, or deploy the Python API on Vercel.",
    },
    { status: 501 },
  );
}
