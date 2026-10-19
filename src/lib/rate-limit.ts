import "server-only";
import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDb, Collections } from "@/lib/db";

type Limit = { count: number; resetAt: Date };
export async function enforceRateLimit(request: NextRequest, route: string, max: number, windowMs: number, scope = "default") {
  // Vercel overwrites this header at its edge; do not trust arbitrary client forwarding headers.
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const ipHash = createHash("sha256").update(ip).digest("hex");
  const now = new Date();
  const resetAt = new Date(Math.ceil(now.getTime() / windowMs) * windowMs);
  const key = createHash("sha256").update(`${ipHash}:${route}:${scope}:${resetAt.getTime()}`).digest("hex");
  const db = await getDb();
  const col = db.collection<Limit & { _id: string }>(Collections.rateLimits);
  try {
    const row = await col.findOneAndUpdate(
      { _id: key },
      { $setOnInsert: { resetAt }, $inc: { count: 1 } },
      { upsert: true, returnDocument: "after" },
    );
    const count = row?.count ?? max + 1;
    return { allowed: count <= max, retryAfter: Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)) };
  } catch (error) {
    // Concurrent upsert may race on the _id; fail closed to avoid quota abuse.
    if ((error as { code?: number }).code !== 11000) throw error;
    const row = await col.findOneAndUpdate({ _id: key }, { $inc: { count: 1 } }, { returnDocument: "after" });
    return { allowed: Boolean(row && row.count <= max), retryAfter: Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 1000)) };
  }
}
