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
import type { RawScrapedItem, PipelineStats, PipelineOptions } from "./types";

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
  const validItems: TNormalized[] = [];

  for (const raw of rawItems) {
    try {
      const normalized = config.normalize(raw);
      if (!normalized) {
        stats.rejected++;
        continue;
      }

      const parsed = config.schema.safeParse(normalized);
      if (!parsed.success) {
        stats.rejected++;
        stats.errors.push(
          `Validation failed for item: ${parsed.error.errors[0]?.message ?? "unknown"}`
        );
        continue;
      }

      validItems.push(parsed.data);
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
    console.log(`  Preview of first item:`, JSON.stringify(validItems[0], null, 2));
    return stats;
  }

  const col = db.collection(config.collectionName);

  for (const item of validItems) {
    try {
      const now = new Date();
      await col.updateOne(
        config.upsertKey(item),
        { $set: { ...item, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { upsert: true }
      );
      stats.stored++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      stats.errors.push(`Store failed: ${msg}`);
    }
  }

  console.log(`  Store      → ${stats.stored} upserted into "${config.collectionName}"`);

  return stats;
}
