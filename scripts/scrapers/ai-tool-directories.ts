/**
 * Scraper: AI tool directories (multi-source)
 *
 * Extracts AI tool listings from directories that serve server-rendered HTML
 * (no JavaScript required for the data). Many modern AI directories (Futurepedia,
 * Toolify) are client-rendered SPAs or behind Cloudflare, so they require
 * a headless browser (Playwright/Puppeteer) instead — see the note below.
 *
 * Sources:
 *   - There's An AI For That (theresanaiforthat.com) — server-rendered
 *   - Adding more sources: if the site's listing HTML is not behind JS
 *     rendering or Cloudflare, add it below. Otherwise, use the headless
 *     approach described in the PRD.
 *
 * ⚠️ LIMITATION: theresanaiforthat.com serves ~13MB of HTML with tool data
 * embedded throughout — the selectors match its current DOM structure.
 * If the listing comes back empty, the site may have changed its markup.
 *
 * ⚠️ CLOUDFLARE NOTE: toolify.ai and similar sites use Cloudflare's browser
 * challenge, which blocks plain fetch requests. To scrape those, swap
 * fetchHtml() for a headless browser (Playwright/Puppeteer).
 *
 * Every scraped tool is stored as published: false — review before going live.
 */

import * as cheerio from "cheerio";
import { fetchHtml, sleep } from "./lib/http";
import { ToolSchema, type CreateToolInput, ToolCategoryEnum } from "../../src/lib/schemas/tool";
import type { RawScrapedItem } from "./lib/types";
import type { PipelineConfig } from "./lib/pipeline";
import { z } from "zod";

interface ToolDirectorySource {
  name: string;
  url: string;
  baseUrl: string;
  /** Maps this source's category label to our internal ToolCategory enum */
  defaultCategory: z.infer<typeof ToolCategoryEnum>;
  selectors: {
    listItem: string;
    title: string;
    link: string;
    description?: string;
  };
}

// ── Real AI tool directory sources ─────────────────────────────────────────
const SOURCES: ToolDirectorySource[] = [
  {
    name: "there-is-an-ai-for-that",
    url: "https://theresanaiforthat.com/",
    baseUrl: "https://theresanaiforthat.com",
    defaultCategory: "AI",
    selectors: {
      // TAAFT lists tools in a grid; look for linked tool items
      listItem: "a[href*='/ai/']:has(img), a.ai-card, [class*='tool'] a[href*='/ai/']",
      title: "span[class*='title'], h3, h4",
      link: "a[href]",
      description: "p, [class*='desc'], [class*='excerpt']",
    },
  },
];

async function extract(): Promise<RawScrapedItem[]> {
  const items: RawScrapedItem[] = [];

  for (const source of SOURCES) {
    try {
      const html = await fetchHtml(source.url);
      const $ = cheerio.load(html);

      // Fallback: try different selectors to find tool listings
      const potentialSelectors = [
        source.selectors.listItem,
        // Common AI directory patterns
        "a[href*='/ai/']",
        "[class*='tool']",
        "[class*='card']",
        "article",
        "li a[href*='ai']",
      ];

      let found = false;
      for (const selector of potentialSelectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          elements.each((_, el) => {
            const $el = $(el);
            // Try to extract title from various possible locations
            const title =
              $el.find("h2, h3, h4, [class*='title'], .name, strong").first().text().trim() ||
              $el.attr("title") ||
              $el.text().trim();

            const href = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href");
            const description =
              $el.find("p, [class*='desc'], [class*='excerpt']").first().text().trim() || "";

            if (title && title.length > 2 && href && !href.startsWith("#")) {
              items.push({
                source: source.name,
                raw: {
                  title: title.slice(0, 200),
                  href,
                  description: description.slice(0, 1000),
                  sourceUrl: source.baseUrl,
                  category: source.defaultCategory,
                },
              });
            }
          });
          found = true;
          break; // Use the first selector that found something
        }
      }

      if (!found) {
        console.warn(`  ⚠ No tool listings found on ${source.name} — the site structure may have changed.`);
      }

      await sleep(1000);
    } catch (err) {
      console.error(`  ⚠ Failed to extract from ${source.name}:`, err);
    }
  }

  return items;
}

function normalize(raw: RawScrapedItem): CreateToolInput | null {
  const { title, href, description, sourceUrl, category } = raw.raw;
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
    : new URL(href, sourceUrl || "https://theresanaiforthat.com").toString();

  return {
    title: String(title).slice(0, 200),
    slug,
    description:
      (description && String(description).slice(0, 1000)) ||
      `Scraped from ${raw.source} — description needs manual review.`,
    category,
    officialLink,
    free: false,
    featured: false,
    published: false,
  };
}

export const aiToolDirectoriesPipeline: PipelineConfig<unknown, CreateToolInput> = {
  source: "ai-tool-directories",
  collectionName: "tools",
  extract,
  schema: ToolSchema,
  normalize,
  upsertKey: (item) => ({ slug: item.slug }),
};
