/**
 * StudentOS Africa — Database Seed Script
 *
 * Populates opportunities, benefits, tools, and guides with real, verified
 * content (see comments in each seed-data file for sourcing notes).
 *
 * Idempotent: re-running this script upserts by `slug` rather than creating
 * duplicates, so it's safe to run again after editing seed data.
 *
 * Usage:
 *   npm run seed
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { MongoClient } from "mongodb";
import { opportunitiesSeed } from "./seed-data/opportunities";
import { benefitsSeed } from "./seed-data/benefits";
import { toolsSeed } from "./seed-data/tools";
import { guidesSeed } from "./seed-data/guides";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in .env.local — aborting seed.");
  process.exit(1);
}

async function upsertAll<T extends { slug: string }>(
  collectionName: string,
  items: T[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
) {
  const col = db.collection(collectionName);
  let created = 0;
  let updated = 0;

  for (const item of items) {
    const now = new Date();
    const result = await col.updateOne(
      { slug: item.slug },
      {
        $set: { ...item, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) created++;
    else if (result.modifiedCount > 0) updated++;
  }

  console.log(
    `  ${collectionName.padEnd(14)} → ${created} created, ${updated} updated, ${items.length - created - updated} unchanged`
  );
}

async function main() {
  console.log("🌱 Seeding StudentOS Africa database...\n");

  const client = new MongoClient(MONGODB_URI!);

  try {
    await client.connect();
    const db = client.db("studentos");

    await upsertAll("opportunities", opportunitiesSeed, db);
    await upsertAll("benefits", benefitsSeed, db);
    await upsertAll("tools", toolsSeed, db);
    await upsertAll("guides", guidesSeed, db);

    console.log("\n✅ Seed complete.");
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

main();
