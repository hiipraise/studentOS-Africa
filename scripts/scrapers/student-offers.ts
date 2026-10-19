/**
 * Scraper: Student discount & offers aggregators
 *
 * Major student discount platforms (UNiDAYS, Student Beans, Varsity Vibe)
 * are client-rendered SPAs that require JavaScript to display offers —
 * a plain HTML fetch returns only the app shell, not the actual data.
 *
 * To scrape those platforms, set up a headless browser pipeline:
 *   npm install playwright
 *   Replace fetchHtml(url) with await browser.newPage() + page.content()
 *
 * For now, the GitHub Student Developer Pack + other manually curated
 * seed data provide the benefits content. The `github-student-pack.ts`
 * scraper already extracts 30+ partner offers to the "benefits" collection
 * — run that instead.
 *
 * ── Headless browser sources (add when Playwright is available) ──────
 *   - UNiDAYS:    https://www.myunidays.com/US/en-US
 *   - Student Beans: https://www.studentbeans.com/us
 *   - Varsity Vibe (SA): https://varsityvibe.co.za
 *
 * To add a source, create a new entry in SOURCES below with the real URL
 * and selectors matched from the site's DOM (use your browser's dev tools
 * to inspect the offer card structure).
 */

import { BenefitSchema, type CreateBenefitInput } from "../../src/lib/schemas/benefit";
import type { RawScrapedItem } from "./lib/types";
import type { PipelineConfig } from "./lib/pipeline";

// ── No server-rendered sources currently available ───────────────────────
// Most student discount platforms are client-rendered SPAs.
// When a Playwright-based extractor is added, list sources below.
async function extract(): Promise<RawScrapedItem[]> {
  // No server-rendered sources available yet.
  // See the file header for how to add headless-browser sources.
  return [];
}

function normalize(): CreateBenefitInput | null {
  return null;
}

export const studentOffersPipeline: PipelineConfig<CreateBenefitInput> = {
  source: "student-offers",
  collectionName: "benefits",
  extract,
  schema: BenefitSchema,
  normalize,
  upsertKey: (item) => ({ slug: item.slug }),
};
