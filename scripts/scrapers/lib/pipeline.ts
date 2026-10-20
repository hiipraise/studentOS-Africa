/**
 * Generic pipeline orchestrator implementing the PRD's scraper pipeline:
 *
 *     Extract -> Validate -> Normalize -> Store
 *
 * Each scraper module supplies the four stage functions; this file just
 * wires them together with consistent logging, error collection, and a
 * dry-run mode so you can inspect output before writing to MongoDB.
 */

import type { ZodType, ZodTypeDef } from "zod";
import type { Db } from "mongodb";
import type { RawScrapedItem, PipelineStats, PipelineOptions } from "./types";import { createHash } from "node:crypto";
import { findDuplicate } from "./dedupe";
import { contentChanged, scraperOwnedSet } from "./upsert-policy";

export interface PipelineConfig<TNormalized> {
  source: string;
  collectionName: string;
  /** Fetches raw items from the target site */
  extract: () => Promise<RawScrapedItem[]>;
  /**
   * Zod schema each normalized item must satisfy before storage. Typed as
   * ZodType<TNormalized, ZodTypeDef, any> rather than ZodSchema<TNormalized>
   * because schemas using .default() have an input type that's narrower
   * than their output type (optional-with-default in, required out) —
   * ZodSchema<T> assumes input === output === T, which doesn't match.
   */
  schema: ZodType<TNormalized, ZodTypeDef, unknown>;
  /** Converts a raw scraped item into the shape your schema expects */
  normalize: (raw: RawScrapedItem) => TNormalized | null;
  /** Field to upsert on, so re-running doesn't create duplicates */
  upsertKey: (item: TNormalized) => Record<string, unknown>;
  /** Content fetched from the official site; used only for hashing/change detection. */
  sourceContent?: (raw: RawScrapedItem) => string;
  enrich?: (item: TNormalized, raw: RawScrapedItem, db: Db) => Promise<TNormalized>;
}

export async function runPipeline<TNormalized>(
  config: PipelineConfig<TNormalized>,
  db: Db | null,
  options: PipelineOptions
): Promise<PipelineStats> {
  const stats: PipelineStats = {
    source: config.source,
    extracted: 0,
    validated: 0,
    rejected: 0,
    stored: 0,
    newDrafts: 0,
    changesQueued: 0,
    duplicatesQueued: 0,
    errors: [],
  };

  console.log(`\n▶ ${config.source}`);

  // ── Extract ──────────────────────────────────────────────────────────
  let rawItems: RawScrapedItem[];
  try {
    rawItems = await config.extract();
    stats.extracted = rawItems.length;
    console.log(`  Extract    → ${rawItems.length} raw items`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    stats.errors.push(`Extract failed: ${msg}`);
    console.error(`  Extract    → FAILED: ${msg}`);
    return stats;
  }

  // ── Normalize + Validate ────────────────────────────────────────────
  const validItems: Array<{ item: TNormalized; raw: RawScrapedItem }> = [];

  for (const raw of rawItems) {
    try {
      const normalized = config.normalize(raw);
      if (!normalized) {
        stats.rejected++;
        continue;
      }

      const enriched = db && config.enrich ? await config.enrich(normalized, raw, db) : normalized;
      const parsed = config.schema.safeParse(enriched);
      if (!parsed.success) {
        stats.rejected++;
        stats.errors.push(
          `Validation failed for item: ${parsed.error.errors[0]?.message ?? "unknown"}`
        );
        continue;
      }

      validItems.push({ item: parsed.data, raw });
      stats.validated++;
    } catch (err) {
      stats.rejected++;
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Normalize threw: ${msg}`);
    }
  }

  console.log(
    `  Validate   → ${stats.validated} valid, ${stats.rejected} rejected`
  );

  // ── Store ────────────────────────────────────────────────────────────
  if (options.dryRun || !db) {
    console.log(`  Store      → SKIPPED (${options.dryRun ? "--dry-run" : "no DB connection"})`);
    console.log(`  Preview of first item:`, JSON.stringify(validItems[0]?.item ?? null, null, 2));
    return stats;
  }

  const col = db.collection(config.collectionName);

  const review = db.collection("review_queue");
  for (const { item, raw } of validItems) {
    try {
      const now = new Date();
      const sourceUrl = String(raw.raw.sourcePostUrl ?? raw.raw.sourceUrl ?? "");
      const aggregatorUrl = String(raw.raw.aggregatorUrl ?? raw.raw.sourceUrl ?? "");
      const content = config.sourceContent?.(raw) ?? String(raw.raw.sourceContent ?? raw.raw.description ?? JSON.stringify(raw.raw));
      const sourceHash = createHash("sha256").update(content).digest("hex");
      const key = config.upsertKey(item);
      const existing = await col.findOne<Record<string, unknown>>(key);
      const record = item as Record<string, unknown>;
      const metadata = {
        source: { type: "aggregator", url: aggregatorUrl }, sourceUrl, sourceHash,
        lastSeenAt: now,
      };
      if (existing) {
        // Editorial state is never controlled by a scraper. Detect upstream changes and queue them.
        if (contentChanged(existing.sourceHash as string | undefined, sourceHash)) {
          const pending = await review.findOne({ kind: "listing-changed", targetSlug: existing.slug, sourceHash, status: "pending" });
          if (!pending) {
            await review.insertOne({ kind: "listing-changed", entityType: config.collectionName, targetSlug: existing.slug, title: existing.title, live: existing, payload: record, sourceUrl, sourceHash, status: "pending", createdAt: now });
            stats.changesQueued++;
          }
          await col.updateOne(key, { $set: { lastSeenAt: now, needsReview: true } });
        } else {
          // Only refresh ingestion-owned metadata. Any field explicitly marked admin-edited remains untouched.
          const safeMetadata = scraperOwnedSet(existing as { editedByAdmin?: string[] }, metadata);
          await col.updateOne(key, { $set: safeMetadata });
        }
        stats.stored++;
        continue;
      }

      const existingRecords = await col.find({}, { projection: { title: 1, officialLink: 1, cycle: 1, deadline: 1, slug: 1 } }).limit(5000).toArray() as Array<{ title?: string; officialLink?: string; cycle?: { year?: number }; deadline?: Date | null; slug?: string }>;
      const duplicate = findDuplicate({ title: String(record.title ?? ""), officialLink: String(record.officialLink ?? ""), cycleYear: (record.cycle as { year?: number } | undefined)?.year }, existingRecords);
      if (duplicate) {
        const candidateKey = createHash("sha256").update(`${String(record.title)}:${String(record.officialLink)}`).digest("hex");
        const pending = await review.findOne({ kind: "possible-duplicate", candidateKey, status: "pending" });
        if (!pending) {
          await review.insertOne({ kind: "possible-duplicate", entityType: config.collectionName, targetSlug: duplicate.slug, title: record.title, live: duplicate, payload: record, candidateKey, sourceUrl, sourceHash, status: "pending", createdAt: now });
          stats.duplicatesQueued++;
        }
        continue;
      }

      const newRecord = { ...record, ...metadata, source: { type: "aggregator", url: aggregatorUrl }, firstSeenAt: now,
        published: false, featured: false, needsReview: true, confidence: "low", editedByAdmin: [], createdAt: now, updatedAt: now };
      await col.insertOne(newRecord);
      stats.stored++; stats.newDrafts++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Store failed: ${msg}`);
    }
  }

  console.log(`  Store      → ${stats.newDrafts} new drafts, ${stats.changesQueued} changes queued, ${stats.duplicatesQueued} possible duplicates in "${config.collectionName}"`);

  return stats;
}
