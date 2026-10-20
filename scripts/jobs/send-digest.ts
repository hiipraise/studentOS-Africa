/**
 * Weekly digest generator (S6.5).
 *
 * Builds a draft from live data (closing soon, new this week, latest guide) and
 * stores it for admin preview. Sending is explicit: `--send` delivers the
 * digest to confirmed, non-unsubscribed subscribers in small batches through
 * the email adapter, then records the result.
 *
 * Usage:
 *   npm run job:digest            # build/refresh the draft
 *   npm run job:digest -- --send  # send the latest draft
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScriptDb } from "../scrapers/lib/db";
import { signToken, appUrl } from "../../src/lib/tokens";
import { digestEmail } from "../../src/lib/email/templates";
import { sendEmail } from "../../src/lib/email/send";

const shouldSend = process.argv.includes("--send");
const DAY = 86_400_000;

interface OpportunityRow {
  slug: string;
  title: string;
  deadline?: Date | null;
  cycle?: { closesAt?: Date | null };
  createdAt: Date;
}
interface GuideRow {
  slug: string;
  title: string;
}
interface SubscriberRow {
  email: string;
  status?: string;
}

function closesAt(row: OpportunityRow): Date | null {
  const value = row.cycle?.closesAt ?? row.deadline ?? null;
  return value ? new Date(value) : null;
}

async function buildDraft(db: Awaited<ReturnType<typeof getScriptDb>>["db"]) {
  const now = new Date();
  const weekAhead = new Date(now.getTime() + 7 * DAY);
  const weekAgo = new Date(now.getTime() - 7 * DAY);

  const [closing, fresh, guide] = await Promise.all([
    db
      .collection<OpportunityRow>("opportunities")
      .find({ published: true, $or: [{ "cycle.closesAt": { $gte: now, $lte: weekAhead } }, { "cycle.closesAt": { $exists: false }, deadline: { $gte: now, $lte: weekAhead } }] })
      .sort({ deadline: 1 })
      .limit(8)
      .toArray(),
    db.collection<OpportunityRow>("opportunities").find({ published: true, createdAt: { $gte: weekAgo } }).sort({ createdAt: -1 }).limit(8).toArray(),
    db.collection<GuideRow>("guides").find({ published: true }).sort({ featured: -1, createdAt: -1 }).limit(1).next(),
  ]);

  const closingItems = closing.map((row) => ({
    title: row.title,
    url: appUrl(`/opportunities/${row.slug}`),
    closesOn: (closesAt(row) ?? now).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }),
  }));
  const freshItems = fresh.map((row) => ({ title: row.title, url: appUrl(`/opportunities/${row.slug}`) }));
  const guideItem = guide ? { title: guide.title, url: appUrl(`/guides/${guide.slug}`) } : undefined;
  const unsubscribeUrl = appUrl("/newsletter/preferences");
  const template = digestEmail({ closing: closingItems, fresh: freshItems, guide: guideItem, unsubscribeUrl });

  const draft = {
    weekOf: now.toISOString().slice(0, 10),
    subject: template.subject,
    html: template.html,
    text: template.text,
    counts: { closing: closingItems.length, fresh: freshItems.length, guide: guideItem ? 1 : 0 },
    status: "draft" as const,
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("digest_drafts").updateOne({ weekOf: draft.weekOf }, { $set: draft, $setOnInsert: { createdAt: now } }, { upsert: true });
  return draft;
}

async function main() {
  const { db, close } = await getScriptDb();
  const startedAt = new Date();
  try {
    if (!shouldSend) {
      const draft = await buildDraft(db);
      console.log(`Draft ready for ${draft.weekOf}: ${draft.counts.closing} closing, ${draft.counts.fresh} new, guide=${draft.counts.guide}`);
      return;
    }

    const latest = await db.collection("digest_drafts").find({ status: { $in: ["draft", "approved"] } }).sort({ weekOf: -1 }).limit(1).next();
    if (!latest) throw new Error("No digest draft found. Run without --send first.");

    const subscribers = await db.collection<SubscriberRow>("newsletter").find({ status: "confirmed" }).limit(5000).toArray();
    let sent = 0;
    const errors: string[] = [];

    for (const subscriber of subscribers) {
      const unsubscribeUrl = appUrl(`/newsletter/unsubscribe?token=${signToken({ email: subscriber.email, purpose: "newsletter-unsubscribe" }, 60 * 60 * 24 * 365)}`);
      const html = String(latest.html).replaceAll(appUrl("/newsletter/preferences"), unsubscribeUrl);
      const result = await sendEmail({ to: subscriber.email, subject: String(latest.subject), html, text: String(latest.text ?? ""), unsubscribeUrl });
      if (result.success) sent += 1;
      else errors.push(`${subscriber.email}: ${result.error}`);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    await db.collection("digest_drafts").updateOne(
      { _id: latest._id },
      { $set: { status: errors.length ? "partially-sent" : "sent", sentAt: new Date(), sentCount: sent, errors } },
    );
    const summary = { source: "digest", status: errors.length ? "partial" : "success", startedAt, completedAt: new Date(), sent, errors };
    await db.collection("ingest_runs").insertOne(summary);
    console.log(JSON.stringify(summary));
    if (errors.length) process.exitCode = 1;
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error("Digest job failed:", error);
  process.exit(1);
});
