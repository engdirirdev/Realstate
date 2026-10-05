/**
 * Location Resolver & Canonical Somali / East African City Directory
 * Standardized across Somali, English, and Arabic variants.
 */

export interface ResolvedLocation {
  canonicalCity: string;
  city: string;
  matchedAlias: string;
  confidence: number;
  isInDatabase: boolean;
}

export interface CityDefinition {
  canonicalName: string;
  dbCityName?: string; // If present in Prisma DB
  hasApprovedInventory: boolean;
  aliases: string[];
}

/**
 * Authoritative Somali, English, and Arabic City Directory
 */
export const SOMALI_CITY_DIRECTORY: CityDefinition[] = [
  // ─── 1. CITIES WITH ACTIVE DATABASE INVENTORY ──────────────────────────────
  {
    canonicalName: "Mogadishu",
    dbCityName: "Mogadishu",
    hasApprovedInventory: true,
    aliases: [
      "mogadishu", "mogadisho", "muqdisho", "muqdisho ah", "muqdishu", "hamar", "xamar",
      "banaadir", "banadir", "magaalada muqdisho", "magaalada xamar", "magaaladda muqdisho",
      "mogadiscio", "mogadishu city", "مقديشو", "مدينة مقديشو", "بندر"
    ],
  },
  {
    canonicalName: "Hargeisa",
    dbCityName: "Hargeisa",
    hasApprovedInventory: true,
    aliases: [
      "hargeisa", "hargeysa", "hargaysa", "magaalada hargeysa", "magaalada hargeisa",
      "hergeisa", "hargeisa city", "hargeysa city", "هرجيسا", "مدينة هرجيسا"
    ],
  },
  {
    canonicalName: "Bosaso",
    dbCityName: "Bosaso",
    hasApprovedInventory: true,
    aliases: [
      "bosaso", "boosaaso", "bosaaso", "magaalada boosaaso", "magaalada bosaso",
      "bossaso", "بوساسو", "بوصاصو"
    ],
  },
  {
    canonicalName: "Kismayo",
    dbCityName: "Kismayo",
    hasApprovedInventory: true,
    aliases: [
      "kismayo", "kismaayo", "kismayu", "magaalada kismaayo", "magaalada kismayo",
      "kismayo city", "كسمايو", "كيسمايو"
    ],
  },
  {
    canonicalName: "Garowe",
    dbCityName: "Garowe",
    hasApprovedInventory: true,
    aliases: [
      "garowe", "garoowe", "magaalada garoowe", "magaalada garowe",
      "garowe city", "غاروي", "جروي"
    ],
  },
  {
    canonicalName: "Baydhabo",
    dbCityName: "Baydhabo",
    hasApprovedInventory: true,
    aliases: [
      "baydhabo", "baidoa", "baydhaba", "magaalada baydhabo", "magaalada baidoa",
      "baidoa city", "بيداوا", "بيدوا"
    ],
  },
  {
    canonicalName: "Berbera",
    dbCityName: "Berbera",
    hasApprovedInventory: true,
    aliases: [
      "berbera", "barbera", "magaalada berbera", "berbera port", "berbera city", "بربرة"
    ],
  },

  // ─── 2. RECOGNIZED SOMALI REGIONAL HUBS (0 CURRENT DB INVENTORY) ───────────
  {
    canonicalName: "Caabudwaaq",
    hasApprovedInventory: false,
    aliases: [
      "caabudwaaq", "abudwak", "abudwaaq", "caabud waaq", "cabudwaaq", "caabud-waaq",
      "magaalada caabudwaaq", "abudwaq", "عابودواق"
    ],
  },
  {
    canonicalName: "Galkayo",
    hasApprovedInventory: false,
    aliases: [
      "galkayo", "gaalkacyo", "galka'yo", "galkaayo", "magaalada gaalkacyo",
      "galcaio", "جالكعيو", "غالكعيو"
    ],
  },
  {
    canonicalName: "Burao",
    hasApprovedInventory: false,
    aliases: [
      "burao", "burco", "magaalada burco", "burco city", "بورعو"
    ],
  },
  {
    canonicalName: "Beledweyne",
    hasApprovedInventory: false,
    aliases: [
      "beledweyne", "beled weyn", "belet weyne", "baladweyne", "beledweyn",
      "beletweyne", "magaalada beledweyne", "بلد وين", "بيليدوين"
    ],
  },
  {
    canonicalName: "Dhuusamareeb",
    hasApprovedInventory: false,
    aliases: [
      "dhuusamareeb", "dhusamareeb", "dhusamareb", "dhuusa mareeb", "samareeb",
      "dhuusamareb", "magaalada dhuusamareeb", "دوساماريب"
    ],
  },
  {
    canonicalName: "Guriceel",
    hasApprovedInventory: false,
    aliases: [
      "guriceel", "guriel", "guri ceel", "magaalada guriceel", "غوريعيل"
    ],
  },
  {
    canonicalName: "Cadaado",
    hasApprovedInventory: false,
    aliases: [
      "cadaado", "adado", "adado city", "magaalada cadaado", "عدادو"
    ],
  },
  {
    canonicalName: "Hobyo",
    hasApprovedInventory: false,
    aliases: [
      "hobyo", "xobyo", "magaalada hobyo", "هوبيو"
    ],
  },
  {
    canonicalName: "Jowhar",
    hasApprovedInventory: false,
    aliases: [
      "jowhar", "johar", "giohar", "magaalada jowhar", "جوهر"
    ],
  },
  {
    canonicalName: "Afgooye",
    hasApprovedInventory: false,
    aliases: [
      "afgooye", "afgoye", "afgoi", "magaalada afgooye", "أفجوي"
    ],
  },
  {
    canonicalName: "Marka",
    hasApprovedInventory: false,
    aliases: [
      "marka", "merca", "magaalada marka", "مركة"
    ],
  },
  {
    canonicalName: "Bardera",
    hasApprovedInventory: false,
    aliases: [
      "baardheere", "bardera", "bardhere", "magaalada baardheere", "بارطيري"
    ],
  },
  {
    canonicalName: "Las Anod",
    hasApprovedInventory: false,
    aliases: [
      "laascaanood", "las anod", "lascanod", "laas caanood", "magaalada laascaanood", "لاس عانود"
    ],
  },
  {
    canonicalName: "Erigavo",
    hasApprovedInventory: false,
    aliases: [
      "ceerigaabo", "erigavo", "erigabo", "magaalada ceerigaabo", "عيراجبو"
    ],
  },
  {
    canonicalName: "Borama",
    hasApprovedInventory: false,
    aliases: [
      "boorama", "borama", "magaalada boorama", "بوراما"
    ],
  },
  {
    canonicalName: "Qardho",
    hasApprovedInventory: false,
    aliases: [
      "qardho", "kardho", "magaalada qardho", "قرضو"
    ],
  },
  {
    canonicalName: "Doolow",
    hasApprovedInventory: false,
    aliases: [
      "doolow", "dollow", "dollo", "magaalada doolow", "دولو"
    ],
  },
  {
    canonicalName: "Beledxaawo",
    hasApprovedInventory: false,
    aliases: [
      "beledxaawo", "belet hawo", "beled hawo", "belet xaawo", "بلد حواء"
    ],
  },
  {
    canonicalName: "Garbahaarrey",
    hasApprovedInventory: false,
    aliases: [
      "garbahaarrey", "garbaharey", "garbahaarey", "غرباهاري"
    ],
  },
  {
    canonicalName: "Sheekh",
    hasApprovedInventory: false,
    aliases: [
      "sheekh", "sheikh", "magaalada sheekh", "شيخ"
    ],
  },
  {
    canonicalName: "Saylac",
    hasApprovedInventory: false,
    aliases: [
      "saylac", "zeila", "zayla", "magaalada saylac", "زيلع"
    ],
  },
];

/**
 * Fast lookup map from alias to CityDefinition
 */
const ALIAS_LOOKUP_MAP = new Map<string, CityDefinition>();

for (const city of SOMALI_CITY_DIRECTORY) {
  // Map canonical name
  ALIAS_LOOKUP_MAP.set(city.canonicalName.toLowerCase(), city);
  if (city.dbCityName) {
    ALIAS_LOOKUP_MAP.set(city.dbCityName.toLowerCase(), city);
  }
  // Map all aliases
  for (const alias of city.aliases) {
    ALIAS_LOOKUP_MAP.set(alias.toLowerCase().trim(), city);
    // Also map without spaces/hyphens for compounds (e.g. "caabud waaq" -> "caabudwaaq")
    const collapsed = alias.toLowerCase().replace(/[\s\-_]/g, "");
    if (collapsed !== alias) {
      ALIAS_LOOKUP_MAP.set(collapsed, city);
    }
  }
}

/**
 * Resolves a raw text query or standalone city token into a canonical location.
 */
export function resolveLocation(text: string): ResolvedLocation | null {
  if (!text || typeof text !== "string") return null;

  const rawTrimmed = text.trim();
  const lower = rawTrimmed.toLowerCase();
  const collapsed = lower.replace(/[\s\-_]/g, "");

  // 1. Direct whole-string match (e.g. user just entered "caabudwaaq" or "Muqdisho")
  const directMatch = ALIAS_LOOKUP_MAP.get(lower) || ALIAS_LOOKUP_MAP.get(collapsed);
  if (directMatch) {
    const canonical = directMatch.dbCityName || directMatch.canonicalName;
    return {
      canonicalCity: canonical,
      city: canonical,
      matchedAlias: rawTrimmed,
      confidence: 1.0,
      isInDatabase: directMatch.hasApprovedInventory,
    };
  }

  // 2. Scan for multi-word or single-word city phrases within the text
  // Sort aliases by length descending so longer compound phrases match first
  for (const city of SOMALI_CITY_DIRECTORY) {
    for (const alias of city.aliases) {
      const isArabic = /[\u0600-\u06FF]/.test(alias);
      const matched = isArabic
        ? lower.includes(alias)
        : new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(lower);

      if (matched) {
        const canonical = city.dbCityName || city.canonicalName;
        return {
          canonicalCity: canonical,
          city: canonical,
          matchedAlias: alias,
          confidence: 0.95,
          isInDatabase: city.hasApprovedInventory,
        };
      }
    }
  }

  return null;
}

/**
 * Normalizes city name into canonical standard form for query filters and validation
 */
export function normalizeCanonicalCity(cityInput: string): string {
  const resolved = resolveLocation(cityInput);
  return resolved ? resolved.canonicalCity : cityInput.trim();
}

/**
 * Checks whether a given city name has approved property inventory in the platform database
 */
export function cityHasApprovedInventory(cityName: string): boolean {
  const resolved = resolveLocation(cityName);
  return resolved ? resolved.isInDatabase : false;
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
