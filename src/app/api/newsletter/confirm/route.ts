import { NextRequest, NextResponse, after } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { verifyToken, appUrl } from "@/lib/tokens";
import { sendConfirmedEmail } from "@/lib/email";
import { recordEvent } from "@/lib/events";
import type { NewsletterSubscriber } from "@/types";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = verifyToken<{ email: string; purpose: string }>(token);
  if (!payload || payload.purpose !== "newsletter-confirm") {
    return NextResponse.redirect(appUrl("/newsletter?confirmation=invalid"));
  }
  const email = payload.email.toLowerCase();
  const db = await getDb();
  const result = await db.collection<NewsletterSubscriber>(Collections.newsletter).updateOne(
    { email },
    { $set: { status: "confirmed", confirmedAt: new Date(), unsubscribedAt: undefined } },
    { upsert: true }
  );
  void result;
  await recordEvent({ type: "newsletter_confirmed", meta: { emailDomain: email.split("@")[1] ?? "unknown" } });
  after(async () => {
    await sendConfirmedEmail(email, appUrl("/opportunities"));
  });
  return NextResponse.redirect(appUrl("/newsletter/confirmed"));
}
