import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Missing env: MONGODB_URI. Add it to .env.local before running.",
  );
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Global cache prevents creating a new connection on every hot-reload in dev
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(MONGODB_URI);
  clientPromise = client.connect();
}

export default clientPromise;

/** Returns the studentos database instance */
export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db("studentos");
}

/** Typed collection accessor — keeps collection names in one place */
export const Collections = {
  opportunities: "opportunities",
  benefits: "benefits",
  tools: "tools",
  guides: "guides",
  reports: "reports",
  newsletter: "newsletter",
  admins: "admins",
} as const;
