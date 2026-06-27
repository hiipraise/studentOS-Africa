import { MongoClient, Db } from "mongodb";

let client: MongoClient | null = null;

export async function getScriptDb(): Promise<{ db: Db; close: () => Promise<void> }> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI — check your .env.local");
  }

  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
  }

  const db = client.db("studentos");
  const close = async () => {
    if (client) {
      await client.close();
      client = null;
    }
  };

  return { db, close };
}
