import "dotenv/config";
import { getDb, Collections, closeDb } from "@/lib/db";
import { mapCountryText } from "@/lib/domain/countries";
import { deriveStatus } from "@/lib/domain/status";
import type { Opportunity } from "@/types";

const apply = process.argv.includes("--apply");
async function main() {
const db = await getDb();
const cursor = db.collection<Opportunity>(Collections.opportunities).find({});
let migrated = 0;
const unmappable: { id: string; title: string; values: string[] }[] = [];
for await (const row of cursor) {
  if (row.eligibility) continue;
  const mapped = row.countries.map(mapCountryText);
  const invalid = row.countries.filter((_, i) => mapped[i] === null);
  const countries = [...new Set(mapped.flatMap((m) => m?.codes ?? []))];
  const regions = [...new Set(mapped.flatMap((m) => m?.regions ?? []))];
  if (invalid.length) unmappable.push({ id: row._id!.toString(), title: row.title, values: invalid });
  const cycle = { closesAt: row.deadline ?? undefined };
  const update: Partial<Opportunity> = {
    eligibility: { countries, regions, levels: [], fields: [], notes: invalid.length ? `Unmapped legacy eligibility: ${invalid.join(", ")}` : undefined },
    funding: { type: "unknown" }, cycle, status: deriveStatus({ ...cycle, deadline: row.deadline }),
    source: { type: "admin", url: row.officialLink }, confidence: "low", needsReview: true,
  };
  if (apply) await db.collection<Opportunity>(Collections.opportunities).updateOne({ _id: row._id }, { $set: update });
  migrated++;
}
if (apply && unmappable.length) {
  const attention = db.collection("needs_attention");
  for (const item of unmappable) await attention.updateOne({ kind: "opportunity-eligibility", sourceId: item.id }, { $set: { ...item, kind: "opportunity-eligibility", sourceId: item.id, createdAt: new Date(), resolved: false } }, { upsert: true });
}
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", migrated, unmappable }, null, 2));
await closeDb();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
