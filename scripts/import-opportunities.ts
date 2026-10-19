import "dotenv/config";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CreateOpportunitySchema } from "@/lib/schemas/opportunity";
import type { Opportunity } from "@/types";
import { getDb, Collections, closeDb } from "@/lib/db";
import { deriveStatus } from "@/lib/domain/status";

function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted && ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); if (row.some((v) => v.trim())) rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

async function main() {
const fileArg = process.argv.find((arg) => arg.startsWith("--file="))?.slice(7) ?? "docs/opportunity-import-template.csv";
const apply = process.argv.includes("--apply");
const [header = [], ...rows] = parseCsv(await readFile(resolve(fileArg), "utf8"));
const records: Record<string, string>[] = rows.map((row) => Object.fromEntries(header.map((key, i) => [key.trim(), row[i]?.trim() ?? ""])));
const valid: Partial<Opportunity>[] = []; const errors: { row: number; issues: string[] }[] = [];
for (const [i, record] of records.entries()) {
  const codes = (record.countries ?? "").split("|").filter(Boolean).map((s) => s.toUpperCase());
  const regions = (record.regions ?? "").split("|").filter(Boolean).map((s) => s.toUpperCase());
  const deadline = record.deadline ? new Date(record.deadline) : null;
  const candidate = {
    title: record.title, slug: record.slug, description: record.description, category: record.category,
    countries: codes.length ? codes : regions, deadline,
    requirements: [], benefits: [], applicationSteps: [], officialLink: record.sourceURL,
    featured: false, published: false,
    eligibility: { countries: codes, regions, levels: (record.levels ?? "").split("|").filter(Boolean), fields: (record.fields ?? "").split("|").filter(Boolean) },
    funding: { type: record.fundingType || "unknown" },
    deadlineNote: record.deadlineNote || undefined, timezone: record.timezone || undefined,
    source: { type: "official", url: record.sourceURL }, confidence: "low", needsReview: true,
  };
  const parsed = CreateOpportunitySchema.safeParse(candidate);
  if (!parsed.success) errors.push({ row: i + 2, issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`) });
  else valid.push({ ...parsed.data, cycle: { closesAt: deadline ?? undefined }, status: deriveStatus({ deadline }), needsReview: true, createdAt: new Date(), updatedAt: new Date() });
}
console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", valid: valid.length, errors }, null, 2));
if (errors.length) process.exitCode = 1;
else if (apply && valid.length) { const db = await getDb(); const result = await db.collection<Opportunity>(Collections.opportunities).insertMany(valid as Opportunity[]); console.log(`Created ${result.insertedCount} unpublished draft(s).`); }
await closeDb();
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
