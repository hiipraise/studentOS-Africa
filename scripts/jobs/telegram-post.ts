/**
 * Telegram channel auto-post (S8.5).
 *
 * Posts newly published opportunities and 3-day deadline alerts through the
 * free Bot API. Deduplicates through `telegram_posts`, so re-running never
 * spams the channel. Does nothing (exit 0) when the bot is not configured.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { getScriptDb } from "../scrapers/lib/db";
import { appUrl } from "../../src/lib/tokens";

const DAY = 86_400_000;
const MAX_POSTS = 8;

interface OpportunityRow {
  slug: string;
  title: string;
  category: string;
  deadline?: Date | null;
  cycle?: { closesAt?: Date | null };
  createdAt: Date;
  updatedAt?: Date;
}

async function post(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: text.slice(0, 3500), disable_web_page_preview: false }),
  }).catch(() => null);
  return Boolean(response?.ok);
}

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.log("Telegram is not configured (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID); skipping.");
    return;
  }

  const { db, close } = await getScriptDb();
  const startedAt = new Date();
  const now = new Date();
  let posted = 0;
  const errors: string[] = [];

  try {
    const state = await db.collection<{ _id: string; lastPostedAt?: Date }>("job_state").findOne({ _id: "telegram-post" });
    const since = state?.lastPostedAt ? new Date(state.lastPostedAt) : new Date(now.getTime() - 7 * DAY);

    const fresh = await db
      .collection<OpportunityRow>("opportunities")
      .find({ published: true, createdAt: { $gt: since } })
      .sort({ createdAt: -1 })
      .limit(MAX_POSTS)
      .toArray();

    const soon = await db
      .collection<OpportunityRow>("opportunities")
      .find({
        published: true,
        $or: [
          { "cycle.closesAt": { $gte: now, $lte: new Date(now.getTime() + 3 * DAY) } },
          { "cycle.closesAt": { $exists: false }, deadline: { $gte: now, $lte: new Date(now.getTime() + 3 * DAY) } },
        ],
      })
      .limit(MAX_POSTS)
      .toArray();

    const queue: Array<{ slug: string; kind: "new" | "closing"; text: string }> = [];
    for (const row of fresh) {
      queue.push({
        slug: row.slug,
        kind: "new",
        text: `New on StudentOS Africa\n\n${row.title}\n${row.category}\n\n${appUrl(`/opportunities/${row.slug}`)}`,
      });
    }
    for (const row of soon) {
      const closes = new Date(row.cycle?.closesAt ?? row.deadline ?? now);
      queue.push({
        slug: row.slug,
        kind: "closing",
        text: `Closing in 3 days\n\n${row.title}\nCloses ${closes.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}\n\n${appUrl(`/opportunities/${row.slug}`)}`,
      });
    }

    for (const item of queue) {
      if (posted >= MAX_POSTS) break;
      const already = await db.collection("telegram_posts").findOne({ slug: item.slug, kind: item.kind });
      if (already) continue;
      const ok = await post(item.text);
      if (!ok) {
        errors.push(`${item.kind}:${item.slug}`);
        continue;
      }
      await db.collection("telegram_posts").insertOne({ slug: item.slug, kind: item.kind, postedAt: new Date() });
      posted += 1;
      await new Promise((resolve) => setTimeout(resolve, 1100));
    }

    await db.collection<{ _id: string; lastPostedAt?: Date }>("job_state").updateOne({ _id: "telegram-post" }, { $set: { lastPostedAt: now } }, { upsert: true });
    const summary = { source: "telegram-post", status: errors.length ? "partial" : "success", startedAt, completedAt: new Date(), posted, candidates: queue.length, errors };
    await db.collection("ingest_runs").insertOne(summary);
    console.log(JSON.stringify(summary));
    if (errors.length) process.exitCode = 1;
  } finally {
    await close();
  }
}

main().catch((error) => {
  console.error("Telegram job failed:", error);
  process.exit(1);
});
