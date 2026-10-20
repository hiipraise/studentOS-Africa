import { auth } from "@/lib/auth";
import { getDb, Collections } from "@/lib/db";
import type { SavedItem } from "@/types";
import { buildIcs, icsResponse } from "@/lib/ics";
import { appUrl } from "@/lib/tokens";

export async function GET() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) return new Response("Sign in to export your saved deadlines.", { status: 401 });
  const db = await getDb();
  const saved = await db.collection<SavedItem>(Collections.savedItems).find({ userEmail: email }).toArray();
  const events = saved
    .filter((item) => item.deadline)
    .map((item) => ({
      uid: `saved-${item.opportunitySlug}`,
      title: `Deadline: ${item.opportunityTitle}`,
      description: `Tracked in StudentOS Africa (${item.stage})`,
      url: appUrl(`/opportunities/${item.opportunitySlug}`),
      date: new Date(item.deadline as Date),
    }));
  return icsResponse(buildIcs(events, "My StudentOS deadlines"), "studentos-saved-deadlines");
}
