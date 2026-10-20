import { NextResponse } from "next/server";
import { getDb, Collections } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RunRow {
  source: string;
  status: string;
  startedAt?: Date;
  completedAt?: Date;
  errors?: string[];
}

async function latestRun(source: string) {
  const db = await getDb();
  const row = await db.collection<RunRow>(Collections.ingestRuns).findOne({ source }, { sort: { startedAt: -1 } });
  if (!row) return null;
  return { status: row.status, startedAt: row.startedAt ?? null, completedAt: row.completedAt ?? null, errors: row.errors?.length ?? 0 };
}

/** Lightweight health probe for uptime monitors and the runbook. */
export async function GET() {
  const started = Date.now();
  const checks: Record<string, { ok: boolean; detail?: string }> = {};
  let dbOk = false;

  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    dbOk = true;
    checks.database = { ok: true };
  } catch (error) {
    checks.database = { ok: false, detail: error instanceof Error ? error.message.slice(0, 120) : "unavailable" };
  }

  let ingest = null;
  let reminders = null;
  let stale = null;
  if (dbOk) {
    try {
      [ingest, reminders, stale] = await Promise.all([latestRun("all"), latestRun("reminders"), latestRun("stale-listings")]);
      checks.ingestion = { ok: Boolean(ingest), detail: ingest ? `last run ${ingest.status}` : "no run recorded" };
      checks.reminders = { ok: Boolean(reminders), detail: reminders ? `last run ${reminders.status}` : "no run recorded" };
      checks.staleListings = { ok: !stale || stale.status !== "threshold-breached", detail: stale ? stale.status : "no run recorded" };
    } catch (error) {
      checks.operations = { ok: false, detail: error instanceof Error ? error.message.slice(0, 120) : "unavailable" };
    }
  } else {
    checks.ingestion = { ok: false, detail: "skipped (database unavailable)" };
    checks.reminders = { ok: false, detail: "skipped (database unavailable)" };
  }

  const ok = dbOk;
  return NextResponse.json(
    {
      ok,
      status: ok ? "healthy" : "degraded",
      checkedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
      checks,
      jobs: { ingest, reminders, stale },
    },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
