import "server-only";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getDb, Collections } from "@/lib/db";
import type { StudentUser } from "@/types";
import { mapCountryText } from "@/lib/domain/countries";

const TIMEZONE_COUNTRY: Record<string, string> = {
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Accra": "GH",
  "Africa/Johannesburg": "ZA",
  "Africa/Cairo": "EG",
  "Africa/Addis_Ababa": "ET",
  "Africa/Kampala": "UG",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Douala": "CM",
  "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI",
  "Africa/Kigali": "RW",
  "Africa/Lusaka": "ZM",
  "Africa/Harare": "ZW",
  "Africa/Casablanca": "MA",
  "Africa/Tunis": "TN",
  "Africa/Algiers": "DZ",
  "Africa/Khartoum": "SD",
  "Africa/Maputo": "MZ",
  "Africa/Luanda": "AO",
};

/**
 * Best-effort country for the filter default: the student's saved profile,
 * then the Vercel edge timezone. Always overridable with ?country=.
 */
export async function defaultCountryForVisitor(): Promise<string> {
  try {
    const session = await auth();
    const email = session?.user?.email?.toLowerCase();
    if (email) {
      const db = await getDb();
      const user = await db.collection<StudentUser>(Collections.users).findOne({ email });
      const mapped = user?.country ? mapCountryText(user.country) : null;
      if (mapped?.codes[0]) return mapped.codes[0];
    }
  } catch {
    // Database or auth unavailable — fall back to timezone.
  }
  try {
    const timezone = (await headers()).get("x-vercel-ip-timezone");
    if (timezone && TIMEZONE_COUNTRY[timezone]) return TIMEZONE_COUNTRY[timezone];
  } catch {
    // Not a request context.
  }
  return "";
}
