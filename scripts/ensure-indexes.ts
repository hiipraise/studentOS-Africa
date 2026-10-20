import "dotenv/config";
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is required to ensure production indexes.");
const client = new MongoClient(uri);
try {
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || "studentos");

  for (const name of ["opportunities", "benefits", "tools", "guides"]) {
    const collection = db.collection(name);
    await collection.createIndex({ slug: 1 }, { unique: true, name: "slug_unique" });
    await collection.createIndex({ published: 1, deadline: 1 }, { name: "published_deadline" });
    await collection.createIndex({ published: 1, category: 1 }, { name: "published_category" });
    await collection.createIndex({ published: 1, "eligibility.countries": 1 }, { name: "published_eligibility_countries" });
    await collection.createIndex({ published: 1, updatedAt: -1 }, { name: "published_updated" });
  }

  // Sprint 4: fallback full-text search when Atlas Search is unavailable.
  await db.collection("opportunities").createIndex(
    { title: "text", description: "text", organisation: "text", tags: "text" },
    { name: "opportunities_text", weights: { title: 10, organisation: 4, tags: 3, description: 1 }, default_language: "english" },
  );

  // Newsletter: lower-cased uniqueness is enforced by the app plus this collation.
  await db.collection("newsletter").createIndex({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 }, name: "email_unique_ci" });
  await db.collection("newsletter").createIndex({ status: 1, createdAt: -1 }, { name: "newsletter_status" });

  // Sprint 7: reports v2 moderation and duplicate detection.
  await db.collection("reports").createIndex({ benefitId: 1, moderation: 1, createdAt: -1 }, { name: "benefit_moderation_created" });
  await db.collection("reports").createIndex({ moderation: 1, createdAt: -1 }, { name: "moderation_created" });
  await db.collection("reports").createIndex({ commentHash: 1, createdAt: -1 }, { name: "comment_hash" });
  await db.collection("reports").createIndex({ countryCode: 1, moderation: 1 }, { name: "country_moderation" });

  // Operations and review queues.
  await db.collection("needs_attention").createIndex({ resolved: 1, createdAt: -1 }, { name: "needs_attention_queue" });
  await db.collection("review_queue").createIndex({ status: 1, createdAt: 1 }, { name: "review_queue_pending" });
  await db.collection("suggestions").createIndex({ status: 1, createdAt: -1 }, { name: "suggestions_status" });
  await db.collection("ingest_runs").createIndex({ startedAt: -1 }, { name: "ingest_runs_recent" });
  await db.collection("ingest_runs").createIndex({ source: 1, startedAt: -1 }, { name: "ingest_runs_source" });
  await db.collection("ingest_cache").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "ingest_cache_ttl" });
  await db.collection("telegram_posts").createIndex({ slug: 1, kind: 1 }, { unique: true, name: "telegram_post_unique" });
  await db.collection("digest_drafts").createIndex({ weekOf: 1 }, { unique: true, name: "digest_week_unique" });

  // Rate limits, Finder cache, shares and analytics TTLs.
  await db.collection("rate_limits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 0, name: "rate_limits_ttl" });
  await db.collection("finder_cache").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "finder_cache_ttl" });
  await db.collection("finder_shares").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "finder_shares_ttl" });
  await db.collection("events").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "events_ttl" });
  await db.collection("events").createIndex({ type: 1, createdAt: -1 }, { name: "events_type_created" });

  // Student accounts-lite (Sprint 6).
  await db.collection("users").createIndex({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 }, name: "users_email_unique" });
  await db.collection("saved_items").createIndex({ userEmail: 1, opportunitySlug: 1 }, { unique: true, name: "saved_user_slug_unique" });
  await db.collection("saved_items").createIndex({ userEmail: 1, deadline: 1 }, { name: "saved_user_deadline" });
  await db.collection("reminders_sent").createIndex({ userEmail: 1, forDate: 1 }, { unique: true, name: "reminders_user_day_unique" });
  await db.collection("reminders_sent").createIndex({ sentAt: -1 }, { name: "reminders_recent" });

  console.log("StudentOS indexes ensured.");
} finally {
  await client.close();
}

/*
 * Atlas Search must be created from an Atlas cluster (not from this script on
 * every environment). Use scripts/atlas-search-index.json — see
 * docs/SEARCH_SETUP.md. Without it, search falls back to the text index above.
 */
