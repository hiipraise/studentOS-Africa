import "server-only";
import { getDb, Collections } from "@/lib/db";

export type EventType =
  | "page_view"
  | "search"
  | "zero_result"
  | "finder_run"
  | "save"
  | "outbound_click"
  | "report_submitted"
  | "newsletter_confirmed"
  | "landing_view";

export interface AnalyticsEvent {
  type: EventType;
  /** Page type rather than full URL to avoid storing personal identifiers. */
  page?: string;
  query?: string;
  resultCount?: number;
  slug?: string;
  country?: string;
  level?: string;
  category?: string;
  engine?: string;
  meta?: Record<string, string | number | boolean>;
}

const TTL_DAYS = 180;

/**
 * First-party, privacy-light event logging. Never throws: analytics must not
 * break a page or an API response.
 */
export async function recordEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const db = await getDb();
    await db.collection(Collections.events).insertOne({
      ...sanitize(event),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + TTL_DAYS * 86400000),
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "test") {
      console.warn("[events] could not record event", error instanceof Error ? error.message : error);
    }
  }
}

function sanitize(event: AnalyticsEvent): AnalyticsEvent {
  const clean = (value?: string, max = 120) => value?.slice(0, max);
  return {
    type: event.type,
    page: clean(event.page, 60),
    query: clean(event.query, 100),
    resultCount: event.resultCount,
    slug: clean(event.slug, 220),
    country: clean(event.country, 60),
    level: clean(event.level, 40),
    category: clean(event.category, 40),
    engine: clean(event.engine, 20),
    meta: event.meta,
  };
}
