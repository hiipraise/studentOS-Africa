export const AFRICAN_COUNTRIES = [
  ["DZ","Algeria"],["AO","Angola"],["BJ","Benin"],["BW","Botswana"],["BF","Burkina Faso"],["BI","Burundi"],["CV","Cabo Verde"],["CM","Cameroon"],["CF","Central African Republic"],["TD","Chad"],["KM","Comoros"],["CG","Republic of the Congo"],["CD","Democratic Republic of the Congo"],["CI","Côte d’Ivoire"],["DJ","Djibouti"],["EG","Egypt"],["GQ","Equatorial Guinea"],["ER","Eritrea"],["SZ","Eswatini"],["ET","Ethiopia"],["GA","Gabon"],["GM","Gambia"],["GH","Ghana"],["GN","Guinea"],["GW","Guinea-Bissau"],["KE","Kenya"],["LS","Lesotho"],["LR","Liberia"],["LY","Libya"],["MG","Madagascar"],["MW","Malawi"],["ML","Mali"],["MR","Mauritania"],["MU","Mauritius"],["MA","Morocco"],["MZ","Mozambique"],["NA","Namibia"],["NE","Niger"],["NG","Nigeria"],["RW","Rwanda"],["ST","Sao Tome and Principe"],["SN","Senegal"],["SC","Seychelles"],["SL","Sierra Leone"],["SO","Somalia"],["ZA","South Africa"],["SS","South Sudan"],["SD","Sudan"],["TZ","Tanzania"],["TG","Togo"],["TN","Tunisia"],["UG","Uganda"],["ZM","Zambia"],["ZW","Zimbabwe"],
] as const;

export const COUNTRY_BY_CODE = new Map<string, string>(AFRICAN_COUNTRIES);
const NORTH_AFRICAN_CODES = new Set(["DZ", "EG", "LY", "MA", "SD", "TN"]);
export function regionsForCountry(code: string) { return ["AFRICA", ...(NORTH_AFRICAN_CODES.has(code.toUpperCase()) ? ["NORTH_AFRICA"] : ["SSA"])]; }
const ALIASES: Record<string, string> = { "ivory coast": "CI", "cote d'ivoire": "CI", "the gambia": "GM", "dr congo": "CD", "democratic republic of congo": "CD", "congo": "CG", "cape verde": "CV", "swaziland": "SZ" };
export function mapCountryText(value: string): { codes: string[]; regions: string[] } | null {
  const text = value.trim().toLowerCase();
  if (/\bnorth africa\b|\bnorth african countries\b/.test(text)) return { codes: [], regions: ["NORTH_AFRICA"] };
  if (/\ball african countries\b|\ball 54 african countries\b|\bsub.?saharan africa\b/.test(text)) return { codes: [], regions: [text.includes("sub") ? "SSA" : "AFRICA"] };
  if (/\bglobal\b|\bworldwide\b/.test(text)) return { codes: [], regions: ["GLOBAL"] };
  const code = /^[a-z]{2}$/i.test(value.trim()) && COUNTRY_BY_CODE.has(value.trim().toUpperCase()) ? value.trim().toUpperCase() : ALIASES[text] ?? AFRICAN_COUNTRIES.find(([, name]) => name.toLowerCase() === text)?.[0];
  return code ? { codes: [code], regions: [] } : null;
}
