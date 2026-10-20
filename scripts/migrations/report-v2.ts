/**
 * Additive migration: community reports v2.
 *
 * Old rows used `status` for both the student's outcome and moderation, so the
 * outcome was lost. Existing `approved` rows are treated as moderation
 * approved with outcome "unknown" (never guessed). `status` is kept for
 * backwards compatibility.
 *
 * Usage:
 *   npm run migrate:reports-v2 -- --dry-run
 *   npm run migrate:reports-v2
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { MongoClient } from "mongodb";
import { mapCountryText } from "../../src/lib/domain/countries";

const dryRun = process.argv.includes("--dry-run");
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required. Set it in .env.local before migrating.");

const client = new MongoClient(uri);

try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "studentos");
  const col = db.collection("reports");

  const legacy = await col.find({ moderation: { $exists: false } }).toArray();
  let updated = 0;
  let unmappedCountry = 0;

  for (const row of legacy) {
    const status = String(row.status ?? "pending");
    const moderation = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "pending";
    const countryCode = typeof row.country === "string" ? mapCountryText(row.country)?.codes[0] : undefined;
    if (!countryCode && row.country) unmappedCountry += 1;

    if (!dryRun) {
      await col.updateOne(
        { _id: row._id },
        {
          $set: {
            moderation,
            outcome: "unknown",
            ...(countryCode ? { countryCode } : {}),
            reportDate: row.reportDate ?? row.createdAt ?? new Date(),
            migratedAt: new Date(),
          },
        },
      );
      updated += 1;
    }
  }

  console.log(
    `${dryRun ? "[dry-run] " : ""}reports scanned=${legacy.length} ${dryRun ? "would update" : "updated"}=${updated} country-unmapped=${unmappedCountry}`,
  );
  if (unmappedCountry) console.log("Unmapped countries stay visible but are excluded from country-level statistics.");
} finally {
  await client.close();
}
