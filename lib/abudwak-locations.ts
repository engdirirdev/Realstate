// ================================================================
// MODULE     : Abudwak Geographic Configuration
// DESCRIPTION: Canonical location constants for Kiro-Maal Real Estate
//              Operating exclusively in Abudwak, Galmudug, Somalia
// ================================================================

export const SYSTEM_CITY = "Abudwak";
export const SYSTEM_REGION = "Galmudug";
export const SYSTEM_REGION_FULL = "Abudwak, Galmudug";
export const SYSTEM_COUNTRY = "Somalia";
export const SYSTEM_LOCATION_LABEL = "Abudwak, Galmudug, Somalia";

export const ABUDWAK_COORDS = {
  lat: 6.2417,
  lng: 46.3986,
};

export interface AbudwakVillage {
  name: string;
  emoji: string;
  desc: string;
  lat: number;
  lng: number;
}

export const ABUDWAK_VILLAGES: AbudwakVillage[] = [
  {
    name: "Ubah",
    emoji: "🏡",
    desc: "Vibrant residential & commercial quarter",
    lat: 6.2442,
    lng: 46.3971,
  },
  {
    name: "Horsed",
    emoji: "🏘️",
    desc: "Modern family homes & spacious villas",
    lat: 6.2465,
    lng: 46.4012,
  },
  {
    name: "October",
    emoji: "🏛️",
    desc: "Central business & bustling market zone",
    lat: 6.2408,
    lng: 46.3995,
  },
  {
    name: "1da-Lulio",
    emoji: "✨",
    desc: "Fast-growing residential neighborhood",
    lat: 6.2389,
    lng: 46.3958,
  },
  {
    name: "Ammano",
    emoji: "🌿",
    desc: "Peaceful living & prime residential plots",
    lat: 6.2429,
    lng: 46.3939,
  },
  {
    name: "Waberi",
    emoji: "🌅",
    desc: "Expanding hub with commercial & land plots",
    lat: 6.2374,
    lng: 46.4024,
  },
];

export const ABUDWAK_VILLAGE_NAMES: string[] = ABUDWAK_VILLAGES.map((v) => v.name);

export function normalizeAbudwakVillage(input: string): string | null {
  const cleaned = input.trim().toLowerCase().replace(/\s+/g, "-");
  const match = ABUDWAK_VILLAGES.find(
    (v) => v.name.toLowerCase() === cleaned || v.name.toLowerCase().replace(/-/g, " ") === input.trim().toLowerCase()
  );
  return match ? match.name : null;
}

