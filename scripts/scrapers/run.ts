/**
 * StudentOS Africa — Scraper CLI Runner
 *
 * Usage:
 *   npm run scrape:github-pack
 *   npm run scrape:scholarships
 *   npm run scrape:ai-tools
 *   npm run scrape:student-offers
 *   npm run scrape:all
 *
 *   Add --dry-run to any of the above to preview without writing to MongoDB:
 *   npm run scrape:github-pack -- --dry-run
 *
 * All scraped content is stored with published: false — review it in the
 * Admin Dashboard (or directly in MongoDB) before it goes live. Scrapers
 * pull from external sites whose structure can change at any time; treat
 * every run's output as a draft, not a guaranteed-accurate listing.
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { getScriptDb } from "./lib/db";
import { runPipeline, type PipelineConfig } from "./lib/pipeline";
import { githubStudentPackPipeline } from "./github-student-pack";
import { scholarshipSitesPipeline } from "./scholarship-sites";
import { aiToolDirectoriesPipeline } from "./ai-tool-directories";
import { studentOffersPipeline } from "./student-offers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPipeline = PipelineConfig<unknown, any>;

const PIPELINES: Record<string, AnyPipeline> = {
  "github-pack": githubStudentPackPipeline,
  scholarships: scholarshipSitesPipeline,
  "ai-tools": aiToolDirectoriesPipeline,
  "student-offers": studentOffersPipeline,
};

function parseArgs() {
  const args = process.argv.slice(2);
  const sourceArg = args.find((a) => a.startsWith("--source="));
  const source = sourceArg ? sourceArg.split("=")[1] : "all";
  const dryRun = args.includes("--dry-run");
  return { source, dryRun };
}

async function main() {
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

  const allStats = [];
  for (const pipeline of toRun) {
    const stats = await runPipeline(pipeline, db, { dryRun });
    allStats.push(stats);
  }

  console.log("\n📊 Summary");
  for (const s of allStats) {
    console.log(
      `  ${s.source.padEnd(20)} extracted=${s.extracted} validated=${s.validated} rejected=${s.rejected} stored=${s.stored}`
    );
    if (s.errors.length > 0) {
      console.log(`    ⚠ ${s.errors.length} error(s) — first: ${s.errors[0]}`);
    }
  }

  await close();
}

main().catch((err) => {
  console.error("❌ Scraper run failed:", err);
  process.exit(1);
});
