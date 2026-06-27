/**
 * Shared HTTP helper for scrapers.
 *
 * Sets a real, identifying User-Agent (not a fake browser string) and adds
 * basic retry + rate limiting so scrapers don't hammer target sites. Be a
 * good citizen: check each target site's robots.txt and terms of service
 * before pointing a scraper at it in production, and keep request rates low.
 */

const DEFAULT_USER_AGENT =
  "StudentOSAfricaBot/1.0 (+https://studentos.africa/bot; contact: hello@studentos.africa)";

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchHtml(
  url: string,
  {
    retries = 2,
    delayMs = 1500,
    userAgent = DEFAULT_USER_AGENT,
  }: { retries?: number; delayMs?: number; userAgent?: string } = {}
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": userAgent,
          Accept: "text/html,application/xhtml+xml",
        },
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching ${url}`);
      }

      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await sleep(delayMs * (attempt + 1)); // backoff
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${url} after ${retries + 1} attempts`);
}
