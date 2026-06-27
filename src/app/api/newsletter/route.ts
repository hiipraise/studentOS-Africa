import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { SubscribeSchema } from "@/lib/schemas/newsletter";
import { sendTransactionalEmail, welcomeEmailHtml, addToSendhiivAudience } from "@/lib/sendhiiv";
import type { NewsletterSubscriber, ApiResponse } from "@/types";

// ─── POST /api/newsletter ──────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SubscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = parsed.data;
    const db = await getDb();
    const col = db.collection<NewsletterSubscriber>(Collections.newsletter);

    // MongoDB is the source of truth — idempotent on email
    const existing = await col.findOne({ email });

    if (!existing) {
      await col.insertOne({ email, createdAt: new Date() });
    }

    // Best-effort: send welcome email + sync to Sendhiiv audience.
    // Neither failure should fail the subscription itself — the user
    // is already saved in Mongo, which is what matters most.
    if (!existing) {
      await sendTransactionalEmail({
        to: email,
        subject: "Welcome to StudentOS Africa 🎓",
        html: welcomeEmailHtml(),
      }).catch((err) => console.error("[newsletter] welcome email failed", err));

      await addToSendhiivAudience(email).catch((err) =>
        console.error("[newsletter] audience sync failed", err)
      );
    }

    return NextResponse.json<ApiResponse<{ subscribed: boolean }>>(
      { success: true, data: { subscribed: true } },
      { status: existing ? 200 : 201 }
    );
  } catch (err) {
    console.error("[POST /api/newsletter]", err);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to subscribe. Please try again." },
      { status: 500 }
    );
  }
}
