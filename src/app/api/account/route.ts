import { auth } from "@/lib/auth";
import { getDb, Collections } from "@/lib/db";
import { createHash } from "node:crypto";
import type { SavedItem, NewsletterSubscriber, StudentUser } from "@/types";

/** Deletes the account and its dependent rows, keeping an audit of the request only. */
export async function DELETE() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return Response.json({ success: false, error: "unauthorized" }, { status: 401 });
  const db = await getDb();
  const now = new Date();
  await Promise.all([
    db.collection<StudentUser>(Collections.users).deleteMany({ email }),
    db.collection<SavedItem>(Collections.savedItems).deleteMany({ userEmail: email }),
    db.collection<NewsletterSubscriber>(Collections.newsletter).deleteMany({ email }),
  ]);
  await db.collection("data_deletion_requests").insertOne({ emailHash: hash(email), requestedAt: now, completedAt: now, source: "self-service" });
  return Response.json({ success: true, data: { deleted: true } });
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
