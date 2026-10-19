import { MongoClient, type Db } from "mongodb";
import { getEnv } from "@/lib/env";

declare global { var _mongoClientPromise: Promise<MongoClient> | undefined; }
let clientPromise: Promise<MongoClient> | undefined;
export async function getDb(): Promise<Db> {
  const env = getEnv();
  if (!env.MONGODB_URI) throw new Error("Database is unavailable. Configure MONGODB_URI.");
  clientPromise ??= globalThis._mongoClientPromise ?? new MongoClient(env.MONGODB_URI).connect();
  if (process.env.NODE_ENV !== "production") globalThis._mongoClientPromise = clientPromise;
  return (await clientPromise).db(env.MONGODB_DB);
}
export async function closeDb() {
  if (clientPromise) await (await clientPromise).close();
  clientPromise = undefined;
  globalThis._mongoClientPromise = undefined;
}
export const Collections = { opportunities: "opportunities", benefits: "benefits", tools: "tools", guides: "guides", reports: "reports", newsletter: "newsletter", rateLimits: "rate_limits", needsAttention: "needs_attention", reviewQueue: "review_queue", auditLog: "audit_log" } as const;
