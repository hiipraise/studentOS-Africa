/**
 * Shared types for the scraper pipeline.
 * Mirrors the Extract -> Validate -> Normalize -> Store pipeline from the PRD.
 */

export interface RawScrapedItem {
  /** Which scraper produced this, for logging/debugging */
  source: string;
  /** Raw, unvalidated fields straight off the page — shape varies by scraper */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  raw: Record<string, any>;
}

export interface PipelineStats {
  source: string;
  extracted: number;
  validated: number;
  rejected: number;
  stored: number;
  errors: string[];
}

export interface PipelineOptions {
  /** If true, runs Extract + Validate + Normalize but skips the Store step */
  dryRun: boolean;
}
