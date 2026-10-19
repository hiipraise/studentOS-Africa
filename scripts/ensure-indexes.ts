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
  }
  await db.collection("newsletter").createIndex({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 }, name: "email_unique_ci" });
  await db.collection("reports").createIndex({ benefitId: 1, moderation: 1, createdAt: -1 }, { name: "benefit_moderation_created" });
  await db.collection("needs_attention").createIndex({ resolved: 1, createdAt: -1 }, { name: "needs_attention_queue" });
  await db.collection("rate_limits").createIndex({ resetAt: 1 }, { expireAfterSeconds: 0, name: "rate_limits_ttl" });
  await db.collection("finder_cache").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "finder_cache_ttl" });
  await db.collection("events").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "events_ttl" });
  console.log("StudentOS indexes ensured.");
} finally { await client.close(); }
