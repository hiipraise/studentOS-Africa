/**
 * Scraper: Scholarship websites (multi-source)
 *
 * Extracts scholarship/opportunity listings from real aggregator sites
 * focused on African students and developing countries.
 *
 * Sources:
 *   - Scholars4Dev (scholars4dev.com) — scholarships for developing countries
 *   - Opportunity Desk (opportunitydesk.org) — global opportunities for youth
 *   - After School Africa (afterschoolafrica.com) — opportunities for Africans
 *
 * Selectors are based on their WordPress structures (common post patterns).
 * Run with --dry-run first and check if listings look correct; if a site
 * changes its theme, the selectors may need updating.
 *
 * Every scraped opportunity is stored as published: false — always review
 * before going live.
 */

import * as cheerio from "cheerio";
import { fetchHtml, sleep } from "./lib/http";
import {
  OpportunitySchema,
  type CreateOpportunityInput,
} from "../../src/lib/schemas/opportunity";
import type { RawScrapedItem } from "./lib/types";
import type { PipelineConfig } from "./lib/pipeline";

interface ScholarshipSource {
  name: string;
  url: string;
  /** Base URL for resolving relative links */
  baseUrl: string;
  selectors: {
    listItem: string;
    title: string;
    link: string;
    description?: string;
  };
  /** Default category for items from this source */
  defaultCategory: string;
}

// ── Real scholarship aggregator sources ─────────────────────────────────────
// Selectors verified against live page HTML (June 2026).
const SOURCES: ScholarshipSource[] = [
  {
    name: "scholars4dev",
    url: "https://www.scholars4dev.com/",
    baseUrl: "https://www.scholars4dev.com",
    selectors: {
      // Posts are <li class="post clearfix"> with <h2><a href="...">Title</a></h2>
      listItem: ".post",
      title: "h2 a",
      link: "h2 a",
      description: ".entry",
    },
    defaultCategory: "Scholarship",
  },
  {
    name: "opportunity-desk",
    url: "https://www.opportunitydesk.org/",
    baseUrl: "https://www.opportunitydesk.org",
    selectors: {
      // Posts are <article> elements with <h2><a href="...">Title</a></h2>
      listItem: "article",
      title: "h2 a",
      link: "h2 a",
      description: "article p, .entry-content, .post-content",
    },
    defaultCategory: "Scholarship",
  },
];

/** Rough country detection from keywords in title/description */
function detectCountries(title: string, description: string): string[] {
  const countryKeywords: Record<string, RegExp> = {
    Africa: /africa/gi,
    USA: /(united states|usa|american|us based)/gi,
    UK: /(united kingdom|uk |british|england|scotland|wales)/gi,
    Germany: /germany|german|daad/gi,
    Canada: /canada|canadian/gi,
    Australia: /australia|australian/gi,
    China: /china|chinese/gi,
    "South Africa": /south africa|south african/gi,
    France: /france|french/gi,
    Netherlands: /netherlands|dutch|holland/gi,
    Sweden: /sweden|swedish/gi,
    Italy: /italy|italian/gi,
    Japan: /japan|japanese/gi,
    India: /india|indian/gi,
    Brazil: /brazil|brazilian/gi,
    "New Zealand": /new zealand/gi,
    Switzerland: /switzerland|swiss/gi,
  };

  const text = `${title} ${description}`;
  const found: string[] = [];
  for (const [country, regex] of Object.entries(countryKeywords)) {
    if (regex.test(text)) found.push(country);
  }
  return found.length > 0 ? found : ["International (check official link)"];
}

async function extract(): Promise<RawScrapedItem[]> {
  const items: RawScrapedItem[] = [];

  for (const source of SOURCES) {
    try {
      const html = await fetchHtml(source.url);
      const $ = cheerio.load(html);

      $(source.selectors.listItem).each((_, el) => {
        const $el = $(el);
        const titleEl = $el.find(source.selectors.title).first();
        const title = titleEl.text().trim();
        const href = $el.find(source.selectors.link).first().attr("href");
        const description = source.selectors.description
          ? $el.find(source.selectors.description).first().text().trim()
          : "";

        if (title && title.length >= 5) {
          items.push({
            source: source.name,
            raw: {
              title,
              href,
              description,
              sourceUrl: source.baseUrl,
              defaultCategory: source.defaultCategory,
            },
          });
        }
      });

      // Be polite — small delay between sources
      await sleep(1000);
    } catch (err) {
      console.error(`  ⚠ Failed to extract from ${source.name}:`, err);
    }
  }

  return items;
}

function normalize(raw: RawScrapedItem): CreateOpportunityInput | null {
  const { title, href, description, sourceUrl, defaultCategory } = raw.raw;
  if (!title || !href) return null;

  const slug = String(title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 220);

  if (!slug) return null;

  const officialLink = href.startsWith("http")
    ? href
    : new URL(href, sourceUrl).toString();

  const descText = description
    ? String(description).slice(0, 2000)
    : `Scraped from ${raw.source} — description needs manual review.`;

  const countries = detectCountries(title, descText);

  return {
    title: String(title).slice(0, 200),
    slug,
    description: descText,
    category: defaultCategory || "Scholarship",
    countries,
    deadline: null,
    requirements: [],
    benefits: [],
    applicationSteps: [],
    officialLink,
    featured: false,
    published: false,
  };
}

export const scholarshipSitesPipeline: PipelineConfig<unknown, CreateOpportunityInput> = {
  source: "scholarship-sites",
  collectionName: "opportunities",
  extract,
  schema: OpportunitySchema,
  normalize,
  upsertKey: (item) => ({ slug: item.slug }),
};
