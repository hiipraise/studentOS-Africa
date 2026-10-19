import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getDb, Collections } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";

const Input = z.object({ slug: z.string().min(1).max(220) });
export async function POST(req: NextRequest) {
  const limit = await enforceRateLimit(req, "outdated-reports", 5, 60 * 60 * 1000);
  if (!limit.allowed) return NextResponse.json({ success: false, error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  const parsed = Input.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: "invalid_request" }, { status: 400 });
  const db = await getDb();
  let kind: "outdated-opportunity" | "outdated-benefit" | null = null;
  const result = await db.collection(Collections.opportunities).updateOne({ slug: parsed.data.slug, published: true }, { $set: { needsReview: true, updatedAt: new Date() } });
  if (result.matchedCount) kind = "outdated-opportunity";
  else {
    const benefit = await db.collection(Collections.benefits).updateOne({ slug: parsed.data.slug, published: true }, { $set: { needsReview: true, updatedAt: new Date() } });
    if (benefit.matchedCount) kind = "outdated-benefit";
  }
  if (!kind) return NextResponse.json({ success: false, error: "not_found" }, { status: 404 });
  await db.collection(Collections.needsAttention).updateOne({ kind, sourceId: parsed.data.slug }, { $set: { kind, sourceId: parsed.data.slug, createdAt: new Date(), resolved: false } }, { upsert: true });
  return NextResponse.json({ success: true });
}
