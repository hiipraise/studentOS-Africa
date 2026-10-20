/** Polite, bounded crawler transport. Robots rules and crawl delays are cached per host for one process/run. */
const USER_AGENT = "StudentOSAfricaBot/1.0 (+https://studentos.africa/bot; contact: hello@studentos.africa)";
const USER_AGENT_TOKEN = "StudentOSAfricaBot";
const RUN_REQUEST_CAP = 60;
const ROBOTS_TTL = 60 * 60 * 1000;
type Robots = { fetchedAt: number; rules: Array<{ allow: boolean; path: string }>; delayMs: number; denied: boolean };
const robotsCache = new Map<string, Robots>();
const lastRequest = new Map<string, number>();
let requestsThisRun = 0;

export function beginCrawlRun() { requestsThisRun = 0; lastRequest.clear(); }
export function sleep(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }

async function getRobots(origin: string): Promise<Robots> {
  const existing = robotsCache.get(origin);
  if (existing && Date.now() - existing.fetchedAt < ROBOTS_TTL) return existing;
  if (requestsThisRun >= RUN_REQUEST_CAP) throw new Error("Per-run request cap reached.");
  requestsThisRun++;
  const response = await fetch(`${origin}/robots.txt`, { headers: { "User-Agent": USER_AGENT }, signal: AbortSignal.timeout(10000) }).catch(() => null);
  // Robots unavailable or server error: fail closed. A confirmed 404 means no published policy.
  if (!response || (response.status >= 400 && response.status !== 404)) {
    const denied = { fetchedAt: Date.now(), rules: [{ allow: false, path: "/" }], delayMs: 60000, denied: true };
    robotsCache.set(origin, denied); return denied;
  }
  if (response.status === 404) {
    const open = { fetchedAt: Date.now(), rules: [], delayMs: 1000, denied: false }; robotsCache.set(origin, open); return open;
  }
  const text = await response.text();
  const groups: Array<{ agents: string[]; rules: Array<{ allow: boolean; path: string }>; delayMs: number }> = [];
  let current: (typeof groups)[number] | null = null;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim(); if (!line) continue;
    const colon = line.indexOf(":"); if (colon < 0) continue;
    const name = line.slice(0, colon).trim().toLowerCase(); const value = line.slice(colon + 1).trim();
    if (name === "user-agent") {
      if (!current || current.rules.length) { current = { agents: [], rules: [], delayMs: 1000 }; groups.push(current); }
      current.agents.push(value.toLowerCase());
    } else if (current && name === "crawl-delay") {
      const seconds = Number(value); if (Number.isFinite(seconds)) current.delayMs = Math.max(1000, seconds * 1000);
    } else if (current && (name === "allow" || name === "disallow") && value) {
      current.rules.push({ allow: name === "allow", path: value });
    }
  }
  const matching = groups.filter((group) => group.agents.some((agent) => agent === "*" || USER_AGENT_TOKEN.toLowerCase().includes(agent)));
  const rules = matching.flatMap((group) => group.rules);
  const result = { fetchedAt: Date.now(), rules, delayMs: Math.max(1000, ...matching.map((group) => group.delayMs)), denied: false };
  robotsCache.set(origin, result); return result;
}

function allowedByRobots(pathname: string, rules: Robots["rules"]) {
  const matches = rules.filter(({ path }) => {
    const pattern = path.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\\\$$/, "$");
    try { return new RegExp(`^${pattern}`).test(pathname); } catch { return pathname.startsWith(path); }
  }).sort((a, b) => b.path.length - a.path.length);
  return matches[0]?.allow ?? true;
}

export async function fetchText(url: string, options: { accept?: string; retries?: number } = {}): Promise<{ text: string; url: string; status: number; contentType: string }> {
  const retries = options.retries ?? 1; let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      let target = new URL(url);
      for (let hop = 0; hop < 6; hop++) {
        const robots = await getRobots(target.origin);
        if (robots.denied || !allowedByRobots(target.pathname, robots.rules)) throw new Error(`Blocked by robots.txt: ${target}`);
        const wait = Math.max(0, (lastRequest.get(target.origin) ?? 0) + robots.delayMs - Date.now()); if (wait) await sleep(wait);
        if (requestsThisRun >= RUN_REQUEST_CAP) throw new Error("Per-run request cap reached.");
        requestsThisRun++; lastRequest.set(target.origin, Date.now());
        const response = await fetch(target, { headers: { "User-Agent": USER_AGENT, Accept: options.accept ?? "text/html,application/xhtml+xml" }, redirect: "manual", signal: AbortSignal.timeout(15000) });
        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location"); if (!location) throw new Error(`Redirect without a Location header: ${target}`);
          target = new URL(location, target); continue;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${target}`);
        return { text: await response.text(), url: target.toString(), status: response.status, contentType: response.headers.get("content-type") ?? "" };
      }
      throw new Error(`Too many redirects fetching ${url}`);
    } catch (error) { lastError = error; if (attempt < retries) await sleep(500 * (attempt + 1)); }
  }
  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`);
}

export async function fetchHtml(url: string, options: { retries?: number; delayMs?: number } = {}) {
  return (await fetchText(url, options)).text;
}

export async function fetchWordPressFeed(baseUrl: string, limit = 20) {
  const base = new URL(baseUrl);
  const apiUrl = new URL("/wp-json/wp/v2/posts", base);
  apiUrl.searchParams.set("per_page", String(Math.min(20, limit)));
  apiUrl.searchParams.set("_fields", "link,date,title,excerpt,content");
  try {
    const response = await fetchText(apiUrl.toString(), { accept: "application/json" });
    const rows = JSON.parse(response.text) as Array<{ link?: string; date?: string; title?: { rendered?: string }; excerpt?: { rendered?: string }; content?: { rendered?: string } }>;
    if (Array.isArray(rows) && rows.length) return rows.map((row) => ({ url: row.link ?? "", titleHtml: row.title?.rendered ?? "", excerptHtml: row.excerpt?.rendered ?? "", contentHtml: row.content?.rendered ?? "", date: row.date }));
  } catch { /* try RSS before HTML selectors */ }
  try {
    const response = await fetchText(new URL("/feed/", base).toString(), { accept: "application/rss+xml,application/atom+xml,application/xml,text/xml" });
    const cheerio = await import("cheerio"); const $ = cheerio.load(response.text, { xmlMode: true });
    return $("item").slice(0, Math.min(20, limit)).toArray().map((item) => ({ url: $(item).find("link").first().text().trim(), titleHtml: $(item).find("title").first().text(), excerptHtml: $(item).find("description").first().text(), contentHtml: $(item).find("content\\:encoded").first().text(), date: $(item).find("pubDate").first().text() }));
  } catch { return []; }
}
