import { escapeRegExp } from "@/lib/escape";

export function parsePage(value: string | null, fallback = 1): number { return boundedInt(value, fallback, 1, 1_000_000); }
export function parsePageSize(value: string | null, fallback = 12, max = 50): number { return boundedInt(value, fallback, 1, max); }
function boundedInt(value: string | null, fallback: number, min: number, max: number) {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}
export function parseEnum<T extends string>(value: string | null, values: readonly T[], fallback?: T): T | undefined { return value && values.includes(value as T) ? value as T : fallback; }
export function parseBool(value: string | null): boolean | undefined { return value === "true" ? true : value === "false" ? false : undefined; }
export function parseSearchText(value: string | null): string { return Array.from((value ?? "").trim().replace(/\s+/gu, " ")).slice(0, 100).join(""); }
export function safeRegex(value: string) { return escapeRegExp(parseSearchText(value)); }
