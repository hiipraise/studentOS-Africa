import type { Metadata } from "next";
import Link from "next/link";
import { getDb, Collections } from "@/lib/db";
import { requireStudent } from "@/lib/authz";
import { AccountClient } from "@/components/account/AccountClient";
import { buildFinderResult } from "@/lib/finder/run";
import type { Opportunity, StudentUser } from "@/types";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };

export default async function AccountPage() {
  const session = await requireStudent();
  const email = session.user.email!.toLowerCase();
  const db = await getDb();
  const [user, savedCount, opportunities] = await Promise.all([
    db.collection<StudentUser>(Collections.users).findOne({ email }),
    db.collection(Collections.savedItems).countDocuments({ userEmail: email }),
    db.collection<Opportunity>(Collections.opportunities).find({ published: true }).limit(300).toArray(),
  ]);

  const profile = user?.country && user?.level
    ? { country: user.country, course: user.fields?.[0] ?? "general studies", level: user.level, interests: user.fields ?? [], careerGoal: "Find relevant opportunities", has: [] as string[] }
    : null;
  const feed = profile ? await buildFinderResult(profile, opportunities, { useAI: false }) : null;

  return (
    <div className="container-site py-12 md:py-16">
      <div className="mx-auto max-w-2xl flex flex-col gap-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-ink">Your account</h1>
            <p className="mt-1 text-muted">{savedCount} saved {savedCount === 1 ? "item" : "items"}. <Link href="/saved" className="underline">Open your tracker</Link>.</p>
          </div>
        </div>

        <AccountClient email={email} name={user?.name ?? session.user.name ?? ""} country={user?.country ?? ""} level={user?.level ?? "undergraduate"} fields={user?.fields ?? []} />

        {feed && (
          <section className="card-base flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink">For you</h2>
              <Link href="/finder" className="text-xs font-semibold text-forest underline">Refine in Finder</Link>
            </div>
            {feed.picks.length ? feed.picks.slice(0, 4).map((pick) => (
              <Link key={pick.slug} href={`/opportunities/${pick.slug}`} className="block border-t border-border pt-3 first:border-0 first:pt-0">
                <span className="text-xs font-medium text-forest">{pick.category}</span>
                <p className="font-medium text-ink">{pick.title}</p>
                <p className="text-xs text-muted mt-0.5">{pick.reason}</p>
              </Link>
            )) : <p className="text-sm text-muted">Add your country and level above to see personalised picks.</p>}
          </section>
        )}
      </div>
    </div>
  );
}
