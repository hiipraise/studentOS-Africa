/**
 * Daily deadline reminders (S6.3).
 *
 * Finds saved/tracked items closing in 7, 3 or 1 days, sends ONE consolidated
 * email per student per day, and records it in `reminders_sent` so a re-run is
 * idempotent. Respects quiet opt-outs, never emails closed items and skips
 * students who have not saved anything.
 *
 * Usage: npm run job:reminders [-- --dry-run]
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScriptDb } from "../scrapers/lib/db";
import { signToken, appUrl } from "../../src/lib/tokens";
import { deadlineReminderEmail } from "../../src/lib/email/templates";
import { sendEmail } from "../../src/lib/email/send";

const dryRun = process.argv.includes("--dry-run");
const DAY = 86_400_000;
const REMINDER_DAYS = new Set([7, 3, 1]);

interface SavedRow {
  userEmail: string;
  opportunitySlug: string;
  opportunityTitle: string;
  stage: string;
  deadline?: Date | null;
}

interface OppRow {
  slug: string;
  title: string;
  deadline?: Date | null;
  cycle?: { closesAt?: Date | null };
  status?: string;
}

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

async function main() {
  const { db, close } = await getScriptDb();
  const startedAt = new Date();
  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    const saved = await db.collection<SavedRow>("saved_items").find({ stage: { $ne: "result" } }).limit(5000).toArray();
    if (saved.length === 0) {
      console.log("No saved items; nothing to remind.");
      return;
    }

    const slugs = [...new Set(saved.map((row) => row.opportunitySlug))];
    const opportunities = await db
      .collection<OppRow>("opportunities")
      .find({ slug: { $in: slugs }, published: true })
      .toArray();
    const bySlug = new Map(opportunities.map((row) => [row.slug, row]));

    const optOuts = new Set(
      (await db.collection<{ email: string; remindersOptOut?: boolean }>("users").find({ remindersOptOut: true }).limit(5000).toArray()).map((row) =>
        row.email.toLowerCase(),
      ),
    );

    const grouped = new Map<string, Array<{ title: string; url: string; closesOn: string }>>();
    const now = new Date();

    for (const row of saved) {
      const opportunity = bySlug.get(row.opportunitySlug);
      if (!opportunity) continue;
      const closesAt = opportunity.cycle?.closesAt ?? opportunity.deadline ?? row.deadline ?? null;
      if (!closesAt) continue;
      const closes = new Date(closesAt);
      if (Number.isNaN(closes.getTime()) || closes <= now) continue;

      const days = Math.ceil((closes.getTime() - now.getTime()) / DAY);
      if (!REMINDER_DAYS.has(days)) continue;

      const email = row.userEmail.toLowerCase();
      if (optOuts.has(email)) continue;

      const items = grouped.get(email) ?? [];
      items.push({
        title: opportunity.title ?? row.opportunityTitle,
        url: appUrl(`/opportunities/${row.opportunitySlug}`),
        closesOn: closes.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }),
      });
      grouped.set(email, items);
    }

    const forDate = dayKey(now);
    for (const [email, items] of grouped) {
      const already = await db.collection("reminders_sent").findOne({ userEmail: email, forDate });
      if (already) {
        skipped += 1;
        continue;
      }

      const unsubscribe = appUrl(`/api/reminders/unsubscribe?token=${signToken({ email, purpose: "reminder-unsubscribe" }, 60 * 60 * 24 * 365)}`);
      const template = deadlineReminderEmail(email.split("@")[0], items, unsubscribe);

      if (dryRun) {
        console.log(`[dry-run] would email ${email}: ${items.map((item) => item.title).join(", ")}`);
        sent += 1;
        continue;
      }

      const result = await sendEmail({ to: email, ...template, unsubscribeUrl: unsubscribe });
      if (!result.success) {
        errors.push(`${email}: ${result.error}`);
        continue;
      }

      try {
        await db.collection("reminders_sent").insertOne({ userEmail: email, forDate, items: items.map((item) => item.title), sentAt: new Date() });
      } catch (error) {
        // Duplicate key means another run got there first; the email is still valid.
        if ((error as { code?: number }).code !== 11000) throw error;
      }
      sent += 1;
    }

    const summary = { source: "reminders", status: errors.length ? "partial" : "success", startedAt, completedAt: new Date(), sent, skipped, students: grouped.size, errors };
    if (!dryRun) await db.collection("ingest_runs").insertOne(summary);
    console.log(JSON.stringify(summary));
    if (errors.length) process.exitCode = 1;
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error("Reminder job failed:", error);
  process.exit(1);
});
