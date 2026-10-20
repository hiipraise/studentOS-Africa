import { NextRequest, NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";
import { verifyToken, appUrl } from "@/lib/tokens";
import type { StudentUser } from "@/types";

/** One-click quiet unsubscribe from deadline reminders. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const payload = verifyToken<{ email: string; purpose: string }>(token);
  if (!payload || payload.purpose !== "reminder-unsubscribe") {
    return NextResponse.redirect(appUrl("/account?reminders=invalid"));
  }
  const email = payload.email.toLowerCase();
  const db = await getDb();
  await db
    .collection<StudentUser>(Collections.users)
    .updateOne({ email }, { $set: { remindersOptOut: true, updatedAt: new Date() } }, { upsert: false });
  return NextResponse.redirect(appUrl("/account?reminders=off"));
}
