import { describe, expect, it } from "vitest";
import { mapCountryText, regionsForCountry, COUNTRY_BY_CODE } from "@/lib/domain/countries";

describe("country mapping", () => {
  it("includes African alpha-2 codes and resolves Nigeria", () => {
    expect(COUNTRY_BY_CODE.get("NG")).toBe("Nigeria");
    expect(mapCountryText("Nigeria")).toEqual({ codes: ["NG"], regions: [] });
  });
  it("maps pan-African and global text to regions", () => {
    expect(mapCountryText("All 54 African Countries")).toEqual({ codes: [], regions: ["AFRICA"] });
    expect(mapCountryText("Sub-Saharan Africa")).toEqual({ codes: [], regions: ["SSA"] });
    expect(mapCountryText("Global — Open to African Applicants")).toEqual({ codes: [], regions: ["GLOBAL"] });
  });
  it("expands regions when filtering by a country", () => {
    expect(regionsForCountry("NG")).toEqual(["AFRICA", "SSA"]);
    expect(regionsForCountry("EG")).toEqual(["AFRICA", "NORTH_AFRICA"]);
  });
});
