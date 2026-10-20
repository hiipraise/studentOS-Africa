/**
 * Nightly stale-listing and broken-link report (S9.2).
 *
 * Flags published listings not verified in 45 days, records them in
 * `needs_attention`, and writes a run summary. Exits non-zero when the
 * configurable thresholds are breached so CI/Actions alerts the owner.
 *
 * Usage: npm run job:stale [-- --warn-only]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScriptDb } from "../scrapers/lib/db";

const DAY = 86_400_000;
const STALE_DAYS = 45;
const STALE_LIMIT = Number(process.env.STALE_LISTING_LIMIT ?? 50);
const BROKEN_LIMIT = Number(process.env.BROKEN_LINK_LIMIT ?? 10);
const warnOnly = process.argv.includes("--warn-only");

async function main() {
  const { db, close } = await getScriptDb();
  const startedAt = new Date();
  const now = new Date();
  const cutoff = new Date(now.getTime() - STALE_DAYS * DAY);
  const added: string[] = [];

  try {
    for (const kind of ["opportunities", "benefits"] as const) {
      const field = kind === "opportunities" ? "verifiedAt" : "lastChecked";
      const stale = await db
        .collection(kind)
        .find({ published: true, $or: [{ [field]: { $lt: cutoff } }, { [field]: { $exists: false } }] })
        .limit(1000)
        .toArray();

      for (const row of stale) {
        const existing = await db.collection("needs_attention").findOne({ kind: "stale-listing", sourceId: row.slug, resolved: { $ne: true } });
        if (existing) continue;
        await db.collection("needs_attention").insertOne({
          kind: "stale-listing",
          sourceId: row.slug,
          collection: kind,
          title: row.title,
          message: `Not verified in ${STALE_DAYS}+ days. Check the official source and mark it verified.`,
          resolved: false,
          createdAt: now,
        });
        added.push(`${kind}:${row.slug}`);
      }
    }

    const [staleCount, brokenCount] = await Promise.all([
      db.collection("needs_attention").countDocuments({ kind: "stale-listing", resolved: { $ne: true } }),
      db.collection("opportunities").countDocuments({
        published: true,
        $or: [{ "lastLinkCheck.status": { $in: ["broken", "error", "unreachable"] } }, { "lastLinkCheck.httpCode": { $gte: 400 } }],
      }),
    ]);

    const breached = staleCount > STALE_LIMIT || brokenCount > BROKEN_LIMIT;
    const summary = {
      source: "stale-listings",
      status: breached ? "threshold-breached" : "success",
      startedAt,
      completedAt: new Date(),
      staleCount,
      brokenCount,
      newlyFlagged: added.length,
      thresholds: { stale: STALE_LIMIT, broken: BROKEN_LIMIT },
      errors: [] as string[],
    };
    await db.collection("ingest_runs").insertOne(summary);
    console.log(JSON.stringify(summary));

    if (breached && !warnOnly) {
      console.error(`Threshold breached: ${staleCount} stale (limit ${STALE_LIMIT}), ${brokenCount} broken (limit ${BROKEN_LIMIT}).`);
      process.exitCode = 1;
    }
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error("Stale-listing job failed:", error);
  process.exit(1);
});
