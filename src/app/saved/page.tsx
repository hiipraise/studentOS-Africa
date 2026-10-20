import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getDb, Collections } from "@/lib/db";
import type { SavedItem } from "@/types";
import { SavedClient } from "@/components/saved/SavedClient";

export const metadata: Metadata = { title: "Saved opportunities", robots: { index: false } };

export default async function SavedPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  let items: SavedItem[] = [];
  if (email) {
    try {
      const db = await getDb();
      items = await db.collection<SavedItem>(Collections.savedItems).find({ userEmail: email }).sort({ updatedAt: -1 }).toArray();
    } catch {
      items = [];
    }
  }
  return (
    <div className="container-site py-12 md:py-16">
      <div className="mx-auto max-w-2xl flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-ink">Saved & tracker</h1>
          <p className="mt-1 text-muted">Move each opportunity from saved to submitted, and keep notes in one place.</p>
        </div>
        <SavedClient initial={items} signedIn={Boolean(email)} />
      </div>
    </div>
  );
}
