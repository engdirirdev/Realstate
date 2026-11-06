/**
 * Location Resolver & Canonical Somali / East African City Directory
 * Standardized across Somali, English, and Arabic variants.
 */

export interface ResolvedLocation {
  canonicalCity: string;
  city: string;
  district?: string;
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
      "hargeisa", "hargeysa", "hargaysa", "hargiesa", "hargesa", "hargisa", "magaalada hargeysa", "magaalada hargeisa",
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

export interface DistrictDefinition {
  canonicalDistrict: string;
  parentCity: string;
  aliases: string[];
}

export const SOMALI_DISTRICT_DIRECTORY: DistrictDefinition[] = [
  // ─── MOGADISHU DISTRICTS ───
  {
    canonicalDistrict: "Hodan",
    parentCity: "Mogadishu",
    aliases: ["hodan", "degmada hodan", "km4", "taleex", "tarabuunka", "sayidka", "taleex hodan"],
  },
  {
    canonicalDistrict: "Wadajir",
    parentCity: "Mogadishu",
    aliases: ["wadajir", "madiina", "medina", "degmada wadajir", "buulo xuubeey", "xalane"],
  },
  {
    canonicalDistrict: "Daarusalaam",
    parentCity: "Mogadishu",
    aliases: ["daarusalaam", "daaru salaam", "darussalam", "darusalaam", "magaalada daarusalaam"],
  },
  {
    canonicalDistrict: "Yaaqshiid",
    parentCity: "Mogadishu",
    aliases: ["yaaqshiid", "yaakhshiid", "degmada yaaqshiid", "fagax", "towfiiq"],
  },
  {
    canonicalDistrict: "Kaaraan",
    parentCity: "Mogadishu",
    aliases: ["kaaraan", "karan", "degmada kaaraan"],
  },
  {
    canonicalDistrict: "Dayniile",
    parentCity: "Mogadishu",
    aliases: ["dayniile", "deyniile", "degmada dayniile", "daynile"],
  },
  {
    canonicalDistrict: "Howlwadaag",
    parentCity: "Mogadishu",
    aliases: ["howlwadaag", "holwadag", "hawl wadaag", "degmada howlwadaag", "bakaaro", "bakaaraha"],
  },
  {
    canonicalDistrict: "Waaberi",
    parentCity: "Mogadishu",
    aliases: ["waaberi", "waberi", "degmada waaberi", "21 october"],
  },
  {
    canonicalDistrict: "Shibis",
    parentCity: "Mogadishu",
    aliases: ["shibis", "degmada shibis"],
  },
  {
    canonicalDistrict: "Boondheere",
    parentCity: "Mogadishu",
    aliases: ["boondheere", "bondhere", "degmada boondheere"],
  },
  {
    canonicalDistrict: "Hamar Weyne",
    parentCity: "Mogadishu",
    aliases: ["xamar weyne", "hamar weyne", "degmada xamar weyne"],
  },
  {
    canonicalDistrict: "Hamar Jajab",
    parentCity: "Mogadishu",
    aliases: ["xamar jajab", "hamar jajab", "degmada xamar jajab"],
  },
  {
    canonicalDistrict: "Shangaani",
    parentCity: "Mogadishu",
    aliases: ["shangaani", "shangani", "degmada shangaani"],
  },
  {
    canonicalDistrict: "Cabdicasis",
    parentCity: "Mogadishu",
    aliases: ["cabdicasis", "cabdicasiis", "abdi aziz", "liido", "lido", "lido beach"],
  },
  {
    canonicalDistrict: "Dharkenley",
    parentCity: "Mogadishu",
    aliases: ["dharkenley", "dharkeynley", "degmada dharkenley"],
  },
  {
    canonicalDistrict: "Kaxda",
    parentCity: "Mogadishu",
    aliases: ["kaxda", "degmada kaxda"],
  },

  // ─── HARGEISA DISTRICTS ───
  {
    canonicalDistrict: "Jigjiga Yar",
    parentCity: "Hargeisa",
    aliases: ["jigjiga yar", "jigjigayare", "jigjiga-yar"],
  },
  {
    canonicalDistrict: "26 June",
    parentCity: "Hargeisa",
    aliases: ["26 june", "26-ka june", "labaatan iyo lixda june"],
  },
  {
    canonicalDistrict: "Ibrahim Koodbuur",
    parentCity: "Hargeisa",
    aliases: ["ibrahim koodbuur", "koodbuur"],
  },
  {
    canonicalDistrict: "Maxamed Mooge",
    parentCity: "Hargeisa",
    aliases: ["maxamed mooge", "mooge"],
  },
  {
    canonicalDistrict: "Axmed Dhagax",
    parentCity: "Hargeisa",
    aliases: ["axmed dhagax", "ahmed dhagah"],
  },
  {
    canonicalDistrict: "Gacan Libaax",
    parentCity: "Hargeisa",
    aliases: ["gacan libaax", "gacan-libaax"],
  },
  {
    canonicalDistrict: "New Hargeisa",
    parentCity: "Hargeisa",
    aliases: ["new hargeisa", "hargeysa cusub"],
  },
  {
    canonicalDistrict: "Masalaha",
    parentCity: "Hargeisa",
    aliases: ["masalaha", "masalaha hargeysa"],
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

  // 2. Scan for specific District match first (e.g. "Hodan", "Daarusalaam", "KM4", "Jigjiga Yar")
  for (const dist of SOMALI_DISTRICT_DIRECTORY) {
    for (const alias of dist.aliases) {
      const isArabic = /[\u0600-\u06FF]/.test(alias);
      const matched = isArabic
        ? lower.includes(alias)
        : new RegExp(`\\b${escapeRegExp(alias)}\\b`, "i").test(lower);

      if (matched) {
        return {
          canonicalCity: dist.parentCity,
          city: dist.parentCity,
          district: dist.canonicalDistrict,
          matchedAlias: alias,
          confidence: 0.95,
          isInDatabase: true,
        };
      }
    }
  }

  // 3. Scan for multi-word or single-word city phrases within the text
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
 * Checks whether a given city name has approved property inventory in the platform database
 */
export function cityHasApprovedInventory(cityName: string): boolean {
  const resolved = resolveLocation(cityName);
  return resolved ? resolved.isInDatabase : false;
}

/**
 * Returns all database representation variants and canonical spellings for a given city.
 * Used for high-speed indexed Prisma queries (e.g. city IN ('Abudwak', 'Caabudwaaq')).
 */
export function getCityDbVariants(cityInput: string): string[] {
  if (!cityInput || typeof cityInput !== "string") return [];
  const raw = cityInput.trim();
  const lower = raw.toLowerCase();
  const resolved = resolveLocation(raw);
  const key = (resolved ? resolved.canonicalCity : raw).toLowerCase();

  const variantMap: Record<string, string[]> = {
    caabudwaaq: ["Abudwak", "Caabudwaaq", "Abudwaaq", "Cabudwaaq"],
    abudwak: ["Abudwak", "Caabudwaaq", "Abudwaaq", "Cabudwaaq"],
    burao: ["Burao", "Burco"],
    burco: ["Burao", "Burco"],
    mogadishu: ["Mogadishu", "Muqdisho", "Xamar", "Banaadir"],
    muqdisho: ["Mogadishu", "Muqdisho", "Xamar", "Banaadir"],
    xamar: ["Mogadishu", "Muqdisho", "Xamar", "Banaadir"],
    hargeisa: ["Hargeisa", "Hargeysa", "Hargaysa"],
    hargeysa: ["Hargeisa", "Hargeysa", "Hargaysa"],
    hargiesa: ["Hargeisa", "Hargeysa", "Hargaysa"],
    bosaso: ["Bosaso", "Boosaaso", "Bosaaso"],
    boosaaso: ["Bosaso", "Boosaaso", "Bosaaso"],
    kismayo: ["Kismayo", "Kismaayo"],
    kismaayo: ["Kismayo", "Kismaayo"],
    berbera: ["Berbera", "Barbera"],
    garowe: ["Garowe", "Garoowe"],
    garoowe: ["Garowe", "Garoowe"],
    baydhabo: ["Baydhabo", "Baidoa"],
    baidoa: ["Baydhabo", "Baidoa"],
  };

  const matched = variantMap[key] || variantMap[lower];
  if (matched) return matched;

  return resolved ? [resolved.canonicalCity] : [raw];
}

/**
 * Returns all search synonym terms and neighborhood aliases for a given district.
 */
export function getDistrictAliases(districtInput: string): string[] {
  if (!districtInput || typeof districtInput !== "string") return [];
  const raw = districtInput.trim();
  const lower = raw.toLowerCase();

  for (const dist of SOMALI_DISTRICT_DIRECTORY) {
    const isDirectMatch = dist.canonicalDistrict.toLowerCase() === lower;
    const isAliasMatch = dist.aliases.some(
      (a) => a.toLowerCase() === lower || lower.includes(a.toLowerCase())
    );
    if (isDirectMatch || isAliasMatch) {
      return Array.from(new Set([dist.canonicalDistrict, ...dist.aliases]));
    }
  }

  if (lower.includes("horseed")) return ["Horseed", "Xaafada Horseed"];
  if (lower.includes("habaana")) return ["Habaana", "Xaafada Habaana"];
  if (lower.includes("korjoog")) return ["Korjoog", "Xaafada Korjoog"];

  return [raw];
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
