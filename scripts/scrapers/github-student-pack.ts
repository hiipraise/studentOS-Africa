/**
 * Scraper: GitHub Student Developer Pack Partners
 * Target: https://education.github.com/pack
 *
 * Extracts individual partner offers from the GitHub Student Developer Pack
 * page. The page has two layers:
 *   1. "Experience cards" (curated bundles of offers)
 *   2. Dialog modals with the full individual partner listing
 *
 * This scraper extracts individual partner offers from the inline dialog
 * HTML (server-rendered on the page, not fetched via JS) and falls back
 * to extracting experience card metadata.
 *
 * Note: Some experience cards have a "+N more" button whose contents are
 * in a <dialog> element within the page HTML — those are parsed too.
 *
 * Run with --dry-run first to preview extracted data.
 */

import * as cheerio from "cheerio";
import { fetchHtml } from "./lib/http";
import { BenefitSchema, type CreateBenefitInput } from "../../src/lib/schemas/benefit";
import type { RawScrapedItem } from "./lib/types";
import type { PipelineConfig } from "./lib/pipeline";

const TARGET_URL = "https://education.github.com/pack";

/**
 * Page structure selectors (verified June 2026).
 * The page uses GitHub's Primer design system class names.
 */
const SELECTORS = {
  // Individual offer rows found in dialog modals
  offerRow: ".Box-row.company-list",
  // Experience cards on the main page
  experienceCard: ".pack-offer-grid > .border.rounded-2",
  experienceTitle: "h3.mb-3",
  experienceDescription: "p.color-fg-muted.mb-4",
  // Partner names listed inside experience cards
  experiencePartner: "[class*='pack__experiences__offers__wrapper'] li",
  experienceLink: "a[href^='/experiences/']",
};

async function extract(): Promise<RawScrapedItem[]> {
  const html = await fetchHtml(TARGET_URL);
  const $ = cheerio.load(html);
  const items: RawScrapedItem[] = [];
  const seenSlugs = new Set<string>();

  // ── Method 1: Extract individual offers from full partner listing ──
  // The page contains dialog modals with .Box-row.company-list elements
  // that list every individual partner with its tags/description
  $(SELECTORS.offerRow).each((_, el) => {
    const $el = $(el);
    // Extract partner name from the h2 inside
    const nameEl = $el.find("h2.text-bold");
    const title = nameEl.text().trim();
    if (!title) return;

    // Generate a stable slug
    const slug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (!slug || seenSlugs.has(slug)) return;
    seenSlugs.add(slug);

    // Extract tags (categories)
    const tags: string[] = [];
    $el.find(".Label--small, .Label").each((_, tagEl) => {
      const tag = $(tagEl).text().trim();
      if (tag) tags.push(tag);
    });

    // Extract description (some rows have a <p> after the heading)
    let description = "";
    $el.find("p").each((_, pEl) => {
      const txt = $(pEl).text().trim();
      if (txt && txt.length > description.length) description = txt;
    });

    // Find the offer link if any
    const linkEl = $el.find("a").first();
    const href = linkEl.attr("href");

    items.push({
      source: "github-student-pack",
      raw: {
        title,
        slug,
        description: description || `${title} — part of the GitHub Student Developer Pack.`,
        tags,
        href: href || "/pack",
        sourceUrl: TARGET_URL,
      },
    });
  });

  // ── Method 2: Extract experience-level data ──
  // The experience cards give a curated view of what's available
  $(SELECTORS.experienceCard).each((_, el) => {
    const $el = $(el);
    const title = $el.find(SELECTORS.experienceTitle).first().text().trim();
    const description = $el.find(SELECTORS.experienceDescription).first().text().trim();

    // Find the category subtitle
    const subtitle = $el.find("[aria-roledescription='subtitle']").first().text().trim();

    // Find partner names in the offer list
    const partners: string[] = [];
    $el.find(SELECTORS.experiencePartner).each((_, li) => {
      const name = $(li).attr("aria-label") || $(li).text().trim();
      if (name && name !== title) partners.push(name);
    });

    // Find the link
    const href = $el.find(SELECTORS.experienceLink).first().attr("href") || "";

    if (title) {
      items.push({
        source: "github-student-pack-experience",
        raw: {
          title: `${title} Experience Bundle`,
          description,
          category: subtitle,
          partners,
          href,
          sourceUrl: TARGET_URL,
        },
      });
    }
  });

  return items;
}

function normalize(raw: RawScrapedItem): CreateBenefitInput | null {
  const { title, description, href, tags, partners, category, sourceUrl, slug: existingSlug } = raw.raw;
  if (!title) return null;

  const slug = existingSlug || String(title)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) return null;

  const tagStr = tags?.length ? `Categories: ${tags.join(", ")}. ` : "";
  const partnerStr = partners?.length ? `Includes partners: ${partners.join(", ")}. ` : "";
  const fullDescription = (description || "") 
    ? `${description} ${tagStr}${partnerStr}Part of the GitHub Student Developer Pack.`.slice(0, 2000) 
    : `${title} — part of the GitHub Student Developer Pack. ${tagStr}${partnerStr}`.slice(0, 2000);

  return {
    title: String(title).slice(0, 200),
    slug,
    description: fullDescription || `${title} — part of the GitHub Student Developer Pack.`,
    eligibility: "Verified student via GitHub Student Developer Pack",
    requirements: ["Active GitHub Student Developer Pack membership"],
    officialLink: href
      ? new URL(href, sourceUrl || TARGET_URL).toString()
      : TARGET_URL,
    featured: false,
    published: false,
  };
}

export const githubStudentPackPipeline: PipelineConfig<unknown, CreateBenefitInput> = {
  source: "github-student-pack",
  collectionName: "benefits",
  extract,
  schema: BenefitSchema,
  normalize,
  upsertKey: (item) => ({ slug: item.slug }),
};
