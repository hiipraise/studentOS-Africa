import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { verifyToken, appUrl } from "@/lib/tokens";
import type { NewsletterSubscriber } from "@/types";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = verifyToken<{ email: string; purpose: string }>(token);
  if (!payload || payload.purpose !== "newsletter-unsubscribe") {
    return NextResponse.redirect(appUrl("/newsletter/preferences?status=invalid"));
  }
  const email = payload.email.toLowerCase();
  const db = await getDb();
  await db.collection<NewsletterSubscriber>(Collections.newsletter).updateOne(
    { email },
    { $set: { status: "unsubscribed", unsubscribedAt: new Date() } }
  );
  return NextResponse.redirect(appUrl("/newsletter/preferences?status=unsubscribed"));
}
