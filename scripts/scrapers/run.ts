/**
 * StudentOS Africa — Scraper CLI Runner
 *
 * Usage:
 *   npm run scrape:scholarships
 *   npm run scrape:all
 *
 *   Add --dry-run to any of the above to preview without writing to MongoDB:
 *   npm run scrape:scholarships -- --dry-run
 *
 * All scraped content is stored with published: false — review it in the
 * Admin Dashboard (or directly in MongoDB) before it goes live. Scrapers
 * pull from external sites whose structure can change at any time; treat
 * every run's output as a draft, not a guaranteed-accurate listing.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getScriptDb } from "./lib/db";
import { beginCrawlRun } from "./lib/http";
import { runPipeline, type PipelineConfig } from "./lib/pipeline";
import type { PipelineStats } from "./lib/types";
import { scholarshipSitesPipeline } from "./scholarship-sites";

// The registry intentionally stores pipelines with different validated item shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPipeline = PipelineConfig<any>;

const PIPELINES: Record<string, AnyPipeline> = {
  scholarships: scholarshipSitesPipeline,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const sourceArg = args.find((a) => a.startsWith("--source="));
  const source = sourceArg ? sourceArg.split("=")[1] : "all";
  const dryRun = args.includes("--dry-run");
  return { source, dryRun };
}

async function main() {
  beginCrawlRun();
  const { source, dryRun } = parseArgs();

  console.log("🕷️  StudentOS Africa Scraper");
  console.log(`   Source: ${source}${dryRun ? "  (DRY RUN — no writes, no DB connection needed)" : ""}`);

  const toRun =
    source === "all"
      ? Object.values(PIPELINES)
      : PIPELINES[source]
        ? [PIPELINES[source]]
        : [];

  if (toRun.length === 0) {
    console.error(
      `\n❌ Unknown source "${source}". Valid options: ${Object.keys(PIPELINES).join(", ")}, all`
    );
    process.exit(1);
  }

  // Dry runs never touch the database, so skip connecting entirely —
  // lets you preview scraper output before MongoDB is even set up.
  const { db, close } = dryRun
    ? { db: null, close: async () => {} }
    : await getScriptDb();

  const runCollection = db?.collection("ingest_runs");
  const run = { source, status: "running", startedAt: new Date(), extracted: 0, validated: 0, rejected: 0, stored: 0, newDrafts: 0, changesQueued: 0, duplicatesQueued: 0, errors: [] as string[] };  const runId = runCollection ? (await runCollection.insertOne(run)).insertedId : null;
  try {
    const allStats = [];
    for (const pipeline of toRun) allStats.push(await runPipeline(pipeline, db, { dryRun }));
    const totals = allStats.reduce<PipelineStats>((sum, stats) => ({ source: "all", extracted: sum.extracted + stats.extracted, validated: sum.validated + stats.validated, rejected: sum.rejected + stats.rejected, stored: sum.stored + stats.stored, newDrafts: sum.newDrafts + stats.newDrafts, changesQueued: sum.changesQueued + stats.changesQueued, duplicatesQueued: sum.duplicatesQueued + stats.duplicatesQueued, errors: [...sum.errors, ...stats.errors.map((error) => stats.source + ": " + error)] }), { ...run, source: "all" });
    console.log("\n📊 Summary");
    for (const stats of allStats) console.log("  " + stats.source.padEnd(20) + " extracted=" + stats.extracted + " validated=" + stats.validated + " drafts=" + stats.newDrafts + " changes=" + stats.changesQueued + " duplicates=" + stats.duplicatesQueued + " rejected=" + stats.rejected);
    if (runCollection && runId) await runCollection.updateOne({ _id: runId }, { $set: { ...totals, status: totals.errors.length ? "partial" : "success", completedAt: new Date() } });
    if (!dryRun) await notifyOwner("StudentOS ingestion: " + totals.newDrafts + " drafts, " + totals.changesQueued + " changes, " + totals.duplicatesQueued + " duplicate candidates. Errors: " + totals.errors.length);
    if (totals.errors.length) process.exitCode = 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (runCollection && runId) await runCollection.updateOne({ _id: runId }, { $set: { status: "failed", errors: [message], completedAt: new Date() } });
    throw error;
  } finally { await close(); }
}

async function notifyOwner(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN; const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch("https://api.telegram.org/bot" + token + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: message.slice(0, 3500) }) }).then((response) => { if (!response.ok) console.warn("Telegram run summary failed with HTTP " + response.status); }).catch((error) => console.warn("Telegram notification unavailable:", error));
}

main().catch((err) => {
  console.error("❌ Scraper run failed:", err);
  process.exit(1);
});
