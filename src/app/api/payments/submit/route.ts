import { NextResponse } from "next/server";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../../convex/_generated/api";
import { sendEmailNotification } from "@/lib/resend";

export async function POST(request: Request) {
  try {
    const token = await convexAuthNextjsToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { transactionId, screenshotUrl, amount, archiveTitle, archiveYear } = body;
    if (!transactionId || !screenshotUrl || !amount) {
      return NextResponse.json({ error: "Missing required payment fields." }, { status: 400 });
    }

    const user = await fetchQuery(api.users.getCurrentUserProfile, {}, { token });
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await fetchMutation(
      api.payments.createPaymentRequest,
      {
        userId: user._id,
        userEmail: user.email ?? "",
        transactionId,
        screenshotUrl,
        amount,
        archiveTitle: archiveTitle || undefined,
        archiveYear: archiveYear || undefined,
      },
      { token },
    );

    await fetchMutation(
      api.notifications.createNotification,
      {
        userId: user._id,
        title: "Payment received",
        message: "We received your payment proof. Our team will review it shortly.",
      },
      { token },
    );

    const prefs = await fetchQuery(api.users.getEmailNotificationPreference, {}, { token });
    if (prefs?.emailNotificationsEnabled && user.email) {
      await sendEmailNotification({
        to: user.email,
        subject: "MDCAT Xpert: Payment received",
        text: "We received your payment proof. Our team will review it shortly.",
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment submit error", error);
    const message = error instanceof Error ? error.message : "Unable to submit payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
