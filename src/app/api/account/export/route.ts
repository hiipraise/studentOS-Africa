import { auth } from "@/lib/auth";
import { getDb, Collections } from "@/lib/db";
import type { SavedItem, NewsletterSubscriber, StudentUser } from "@/types";

/** Exports everything we hold about the signed-in student. */
export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return new Response("Unauthorized", { status: 401 });
  const db = await getDb();
  const [user, saved, newsletter] = await Promise.all([
    db.collection<StudentUser>(Collections.users).findOne({ email }),
    db.collection<SavedItem>(Collections.savedItems).find({ userEmail: email }).toArray(),
    db.collection<NewsletterSubscriber>(Collections.newsletter).findOne({ email }),
  ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    notice: "This file contains all personal data StudentOS Africa stores about your account.",
    account: user ?? { email, note: "Profile not yet created" },
    savedItems: saved,
    newsletter: newsletter ? { email: newsletter.email, status: newsletter.status, confirmedAt: newsletter.confirmedAt, consentAt: newsletter.consentAt } : null,
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="studentos-my-data.json"',
    },
  });
}
