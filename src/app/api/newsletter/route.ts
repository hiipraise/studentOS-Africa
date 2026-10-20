import { NextRequest, NextResponse, after } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { SubscribeSchema } from "@/lib/schemas/newsletter";
import { sendConfirmationEmail } from "@/lib/email";
import { appUrl, signToken } from "@/lib/tokens";
import type { NewsletterSubscriber, ApiResponse } from "@/types";
import { enforceRateLimit } from "@/lib/rate-limit";
import { recordEvent } from "@/lib/events";
import { logError } from "@/lib/logger";

export const runtime = "nodejs";

// ─── POST /api/newsletter — double opt-in subscription ────────────────────

export async function POST(req: NextRequest) {
  const limit = await enforceRateLimit(req, "newsletter", 5, 60 * 60_000);
  if (!limit.allowed) {
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  }
  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>({ success: false, error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { email, source } = parsed.data;
    const db = await getDb();
    const col = db.collection<NewsletterSubscriber>(Collections.newsletter);
    const existing = await col.findOne({ email });

    if (existing?.status === "confirmed") {
      return NextResponse.json<ApiResponse<{ status: string }>>({ success: true, data: { status: "already_confirmed" } }, { status: 200 });
    }

    const now = new Date();
    if (!existing) {
      await col.insertOne({
        email,
        status: "pending",
        consentAt: now,
        consentPurpose: "weekly newsletter and deadline reminders",
        source: source ?? "website",
        createdAt: now,
      });
    } else {
      await col.updateOne(
        { email },
        { $set: { status: "pending", consentAt: now, consentPurpose: "weekly newsletter and deadline reminders", source: source ?? existing.source ?? "website" } }
      );
    }

    const confirmUrl = appUrl(`/api/newsletter/confirm?token=${encodeURIComponent(signToken({ email, purpose: "newsletter-confirm" }, 60 * 60 * 24 * 7))}`);
    const unsubscribeUrl = appUrl(`/api/newsletter/unsubscribe?token=${encodeURIComponent(signToken({ email, purpose: "newsletter-unsubscribe" }, 60 * 60 * 24 * 365))}`);

    // after() lets the response return immediately while the mail provider sends.
    after(async () => {
      await sendConfirmationEmail(email, confirmUrl, unsubscribeUrl);
    });

    return NextResponse.json<ApiResponse<{ status: string }>>(
      { success: true, data: { status: "confirmation_sent" } },
      { status: existing ? 200 : 201 }
    );
  } catch (err) {
    logError("newsletter subscription failed", err, { route: "/api/newsletter" });
    return NextResponse.json<ApiResponse<never>>({ success: false, error: "Failed to subscribe. Please try again." }, { status: 500 });
  }
}

// ─── GET /api/newsletter — admin-safe count only (no emails exposed) ──────

export async function GET() {
  try {
    const db = await getDb();
    const [confirmed, pending] = await Promise.all([
      db.collection(Collections.newsletter).countDocuments({ status: "confirmed" }),
      db.collection(Collections.newsletter).countDocuments({ status: "pending" }),
    ]);
    await recordEvent({ type: "page_view", page: "newsletter-api" });
    return NextResponse.json({ success: true, data: { confirmed, pending } });
  } catch (err) {
    logError("newsletter count failed", err, { route: "/api/newsletter" });
    return NextResponse.json({ success: false, error: "unavailable" }, { status: 500 });
  }
}
