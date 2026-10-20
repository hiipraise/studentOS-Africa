/** Ingests capped aggregator entries but stores only original summaries and official URLs. */
import * as cheerio from "cheerio";
import { fetchHtml, fetchText, fetchWordPressFeed, sleep } from "./lib/http";
import { OpportunitySchema, type CreateOpportunityInput } from "../../src/lib/schemas/opportunity";
import type { RawScrapedItem } from "./lib/types";
import type { PipelineConfig } from "./lib/pipeline";
import { enrichOpportunity } from "./lib/extract-opportunity";

interface Source { name: string; url: string; selectors: { item: string; title: string; link: string; description: string } }
const SOURCES: Source[] = [
  { name: "scholars4dev", url: "https://www.scholars4dev.com/", selectors: { item: ".post", title: "h2 a", link: "h2 a", description: ".entry" } },
  { name: "opportunity-desk", url: "https://opportunitydesk.org/", selectors: { item: "article", title: "h2 a", link: "h2 a", description: "article p, .entry-content, .post-content" } },
];
const MAX_ITEMS_PER_SOURCE = 10;
const isHttp = (value: string) => /^https?:\/\//i.test(value);
const ignoredHosts = new Set(["facebook.com", "instagram.com", "linkedin.com", "twitter.com", "x.com", "youtube.com", "t.me"]);

function findOfficialLink(articleHtml: string, articleUrl: string) {
  const $ = cheerio.load(articleHtml); const articleHost = new URL(articleUrl).hostname.replace(/^www\./, "");
  const candidates: Array<{ url: string; priority: number }> = [];
  $("a[href]").each((_, anchor) => {
    const href = $(anchor).attr("href"); if (!href || (!isHttp(href) && !href.startsWith("/"))) return;
    try {
      const url = new URL(href, articleUrl); const host = url.hostname.replace(/^www\./, "");
      if (host === articleHost || [...ignoredHosts].some((ignored) => host === ignored || host.endsWith("." + ignored))) return;
      const label = ($(anchor).text() + " " + ($(anchor).attr("aria-label") ?? "") + " " + ($(anchor).attr("title") ?? "")).toLowerCase();
      candidates.push({ url: url.toString(), priority: /official|apply|application|programme website|program website|visit website/.test(label) ? 0 : 1 });
    } catch { /* malformed URL */ }
  });
  candidates.sort((a,b) => a.priority-b.priority); return candidates[0]?.url ?? null;
}

async function getFeedItems(source: Source) {
  const feed = await fetchWordPressFeed(source.url, MAX_ITEMS_PER_SOURCE); if (feed.length) return feed;
  const html = await fetchHtml(source.url); const $ = cheerio.load(html);
  return $(source.selectors.item).toArray().slice(0, MAX_ITEMS_PER_SOURCE).map((element) => {
    const node = $(element); const anchor = node.find(source.selectors.link).first(); const href = anchor.attr("href");
    return { url: href ? new URL(href, source.url).toString() : "", titleHtml: anchor.text(), excerptHtml: "", contentHtml: "" };
  }).filter((item) => item.url && item.titleHtml.trim());
}

async function extract(): Promise<RawScrapedItem[]> {
  const result: RawScrapedItem[] = [];
  for (const source of SOURCES) {
    try {
      const posts = await getFeedItems(source);
      for (const post of posts.slice(0, MAX_ITEMS_PER_SOURCE)) {
        const title = cheerio.load(post.titleHtml).text().trim().slice(0, 200); if (!title || !isHttp(post.url)) continue;
        try {
          const article = await fetchHtml(post.url); const officialLink = findOfficialLink(article, post.url);
          if (!officialLink) { console.info("Skipping " + title + ": no official programme link found."); continue; }
          const officialPage = await fetchText(officialLink);
          const officialDocument = cheerio.load(officialPage.text);
          officialDocument("script,style,noscript,svg").remove();
          const officialText = officialDocument.root().text().replace(/\s+/g, " ").trim().slice(0, 50000);
          if (officialText.length < 100) { console.info("Skipping " + title + ": official page had insufficient content."); continue; }
          result.push({ source: source.name, raw: { title, sourceUrl: post.url, sourcePostUrl: post.url, aggregatorUrl: source.url, officialLink: officialPage.url, sourceContent: officialText } });
        } catch (error) { console.info("Skipping " + title + ": " + (error instanceof Error ? error.message : String(error))); }
      }
      await sleep(1000);
    } catch (error) { console.error("Source " + source.name + " failed:", error); }
  }
  return result;
}

function slugify(title: string) { return title.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").slice(0, 220).replace(/-+$/g, ""); }
function normalize(raw: RawScrapedItem): CreateOpportunityInput | null {
  const title = String(raw.raw.title ?? ""); const officialLink = String(raw.raw.officialLink ?? "");
  if (!title || !isHttp(officialLink)) return null;
  const slug = slugify(title); if (slug.length < 3) return null;
  return {
    title: title.slice(0, 200), slug,
    description: "Review the official programme page for current eligibility, funding, dates and application requirements.",
    category: "Scholarship", tags: [], countries: ["Global"], deadline: null,
    eligibility: { countries: [], regions: ["GLOBAL"], levels: [], fields: [], notes: "Eligibility requires review on the official programme page." },
    funding: { type: "unknown" }, status: "unknown", source: { type: "aggregator", url: String(raw.raw.aggregatorUrl) },
    confidence: "low", needsReview: true, requirements: [], benefits: [], applicationSteps: [],
    officialLink, featured: false, published: false,
  };
}

export const scholarshipSitesPipeline: PipelineConfig<CreateOpportunityInput> = {
  source: "scholarship-sites", collectionName: "opportunities", extract,
  schema: OpportunitySchema, normalize, upsertKey: (item) => ({ slug: item.slug }),
  enrich: enrichOpportunity,
  sourceContent: (raw) => String(raw.raw.sourceContent ?? ""),
};
