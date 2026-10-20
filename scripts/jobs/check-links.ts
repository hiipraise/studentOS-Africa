import { config } from "dotenv";
config({ path: ".env.local" });
import { isIP } from "node:net";
import { getScriptDb } from "../scrapers/lib/db";

const closingSoon = process.argv.includes("--closing-soon");
const BOT = "StudentOSAfricaBot/1.0 (+https://studentos.africa/bot; contact: hello@studentos.africa)";
function publicHttpUrl(input: string) {
  try { const url = new URL(input); if (!/^https?:$/.test(url.protocol)) return false; const host = url.hostname.toLowerCase(); if (["localhost", "::1"].includes(host) || host.endsWith(".local") || host.endsWith(".internal")) return false; if (isIP(host) && (/^(10\.|127\.|169\.254\.|192\.168\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host))) return false; return true; } catch { return false; }
}
async function check(url: string) {
  let response = await fetch(url, { method: "HEAD", redirect: "follow", headers: { "User-Agent": BOT }, signal: AbortSignal.timeout(12000) }).catch(() => null);
  if (!response || response.status === 405 || response.status === 501 || response.status >= 400) {
    response = await fetch(url, { method: "GET", redirect: "follow", headers: { "User-Agent": BOT, Range: "bytes=0-1023" }, signal: AbortSignal.timeout(15000) }).catch(() => null);
    if (response?.body) void response.body.cancel().catch(() => undefined);
  }
  return { ok: Boolean(response && response.status >= 200 && response.status < 400), httpCode: response?.status };
}
async function notify(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN; const chatId = process.env.TELEGRAM_CHAT_ID; if (!token || !chatId) return;
  await fetch("https://api.telegram.org/bot" + token + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text: message }) }).catch(() => undefined);
}

async function main() {
  const { db, close } = await getScriptDb(); const now = new Date(); const end = new Date(now.getTime() + 7 * 86400000); let checked = 0; let broken = 0;
  const names = ["opportunities", "benefits", "tools", "guides"];
  try {
    for (const name of names) {
      const query = closingSoon && name === "opportunities" ? { published: true, $or: [{ deadline: { $gte: now, $lte: end } }, { "cycle.closesAt": { $gte: now, $lte: end } }] } : closingSoon ? { published: true, _id: { $exists: false } } : { published: true };
      const col = db.collection(name); const rows = await col.find(query, { projection: { slug: 1, title: 1, officialLink: 1, linkCheckFailures: 1 } }).limit(500).toArray();
      for (const row of rows) {
        if (typeof row.officialLink !== "string" || !publicHttpUrl(row.officialLink)) continue;
        const result = await check(row.officialLink); checked++;
        const failures = result.ok ? 0 : Number(row.linkCheckFailures ?? 0) + 1;
        await col.updateOne({ _id: row._id }, { $set: { lastLinkCheck: { at: new Date(), status: result.ok ? "ok" : "broken", httpCode: result.httpCode }, linkCheckFailures: failures } });
        if (!result.ok) broken++;
        if (failures >= 3) {
          await col.updateOne({ _id: row._id }, { $set: { needsReview: true } });
          const already = await db.collection("needs_attention").findOne({ kind: "broken-link", sourceId: row.slug, resolved: { $ne: true } });
          if (!already) await db.collection("needs_attention").insertOne({ kind: "broken-link", sourceId: row.slug, collection: name, title: row.title, officialLink: row.officialLink, httpCode: result.httpCode, resolved: false, createdAt: new Date() });
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }
    const report = { source: "link-checker", mode: closingSoon ? "closing-soon" : "weekly", status: "success", startedAt: now, completedAt: new Date(), checked, broken, errors: [] };
    await db.collection("ingest_runs").insertOne(report);
    if (broken) await notify("StudentOS link check: " + broken + " broken links among " + checked + " checked. Three consecutive failures are sent to the admin review queue.");
    console.log(JSON.stringify(report));
  } finally { await close(); }
}
main().catch((error) => { console.error(error); process.exit(1); });
