/**
 * Conversational Language Manager & Multilingual Intelligence
 *
 * Tier 1: English (en), Somali (so), Arabic (ar), Mixed (mixed)
 * Tier 2: Swahili (sw), Amharic (am), Oromo (om), Tigrinya (ti)
 * Tier 3: French (fr), Spanish (es), German (de), Turkish (tr), etc.
 */

import { ExtendedLanguage, LanguageCapability } from "./types";
import { resolveLocation, cityHasApprovedInventory } from "../nlu/location-resolver";

// Unicode Script Detection
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ETHIOPIC_SCRIPT_REGEX = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/;
const CYRILLIC_SCRIPT_REGEX = /[\u0400-\u04FF]/;
const CJK_SCRIPT_REGEX = /[\u4E00-\u9FFF]/;
const JAPANESE_KANA_REGEX = /[\u3040-\u309F\u30A0-\u30FF]/;
const DEVANAGARI_SCRIPT_REGEX = /[\u0900-\u097F]/;
const BENGALI_SCRIPT_REGEX = /[\u0980-\u09FF]/;

// Specific script features for Perso-Arabic variants
const PERSIAN_SPECIFIC_CHARS = /[\u067E\u0686\u0698\u06AF]/; // پ چ ژ گ
const URDU_SPECIFIC_CHARS = /[\u0679\u0688\u0691\u06BA\u06D2]/; // ٹ ڈ ڑ ں ے

/**
 * Formal Multilingual Language Capability Registry (Master Specification Section 43 & 67)
 * Distinguishes detection, understanding, generation support and explicit fallback.
 */
export const LANGUAGE_CAPABILITY_REGISTRY: Record<ExtendedLanguage, LanguageCapability> = {
  so: {
    code: "so",
    name: "Somali",
    nativeName: "Af-Soomaali",
    detectionSupport: "NATIVE",
    understandingSupport: "NATIVE",
    generationSupport: "NATIVE",
    fallbackLanguage: "en",
    confidenceThreshold: 0.70,
    tier: 1,
    notes: "First-class language with full slang, short-forms, city aliases, and natural dialog.",
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    detectionSupport: "NATIVE",
    understandingSupport: "NATIVE",
    generationSupport: "NATIVE",
    fallbackLanguage: "en",
    confidenceThreshold: 0.70,
    tier: 1,
    notes: "Universal fallback and primary international language.",
  },
  ar: {
    code: "ar",
    name: "Arabic",
    nativeName: "العربية",
    detectionSupport: "NATIVE",
    understandingSupport: "HIGH",
    generationSupport: "HIGH",
    fallbackLanguage: "en",
    confidenceThreshold: 0.75,
    tier: 1,
    notes: "Official language of Somalia, full native Arabic script and real estate terms.",
  },
  sw: {
    code: "sw",
    name: "Swahili",
    nativeName: "Kiswahili",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "HIGH",
    fallbackLanguage: "en",
    confidenceThreshold: 0.75,
    tier: 1,
    notes: "Regional lingua franca of East Africa.",
  },
  am: {
    code: "am",
    name: "Amharic",
    nativeName: "አማርኛ",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 2,
    notes: "Ethiopic script detection with Horn of Africa real estate intent.",
  },
  om: {
    code: "om",
    name: "Oromo",
    nativeName: "Afaan Oromoo",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 2,
    notes: "Latin-script Horn language with distinct property vocabulary (mana, kireeffannaa).",
  },
  ti: {
    code: "ti",
    name: "Tigrinya",
    nativeName: "ትግርኛ",
    detectionSupport: "HIGH",
    understandingSupport: "PARTIAL",
    generationSupport: "FALLBACK_ONLY",
    fallbackLanguage: "en",
    confidenceThreshold: 0.85,
    tier: 2,
    notes: "Ethiopic script detection, state preservation with polite English/Somali fallback.",
  },
  fr: {
    code: "fr",
    name: "French",
    nativeName: "Français",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "HIGH",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
    notes: "Djibouti & global francophone market.",
  },
  es: {
    code: "es",
    name: "Spanish",
    nativeName: "Español",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "HIGH",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  de: {
    code: "de",
    name: "German",
    nativeName: "Deutsch",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "HIGH",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  pt: {
    code: "pt",
    name: "Portuguese",
    nativeName: "Português",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  it: {
    code: "it",
    name: "Italian",
    nativeName: "Italiano",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
    notes: "Historic connections with southern Somalia.",
  },
  tr: {
    code: "tr",
    name: "Turkish",
    nativeName: "Türkçe",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
    notes: "Key commercial and diplomatic partner for Somalia.",
  },
  hi: {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
    notes: "Devanagari script detection with property entity extraction.",
  },
  ur: {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  bn: {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  id: {
    code: "id",
    name: "Indonesian",
    nativeName: "Bahasa Indonesia",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  ms: {
    code: "ms",
    name: "Malay",
    nativeName: "Bahasa Melayu",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  zh: {
    code: "zh",
    name: "Chinese",
    nativeName: "中文",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  ja: {
    code: "ja",
    name: "Japanese",
    nativeName: "日本語",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  ko: {
    code: "ko",
    name: "Korean",
    nativeName: "한국어",
    detectionSupport: "HIGH",
    understandingSupport: "PARTIAL",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  ru: {
    code: "ru",
    name: "Russian",
    nativeName: "Русский",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  fa: {
    code: "fa",
    name: "Persian",
    nativeName: "فارسی",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "PARTIAL",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
  },
  ha: {
    code: "ha",
    name: "Hausa",
    nativeName: "Hausa",
    detectionSupport: "HIGH",
    understandingSupport: "PARTIAL",
    generationSupport: "FALLBACK_ONLY",
    fallbackLanguage: "en",
    confidenceThreshold: 0.80,
    tier: 3,
    notes: "Major African trade language, state preserved with safe English response.",
  },
  mixed: {
    code: "mixed",
    name: "Code-Switching (Mixed)",
    nativeName: "Somali-English / Mixed",
    detectionSupport: "HIGH",
    understandingSupport: "HIGH",
    generationSupport: "NATIVE",
    fallbackLanguage: "so",
    confidenceThreshold: 0.70,
    tier: 1,
  },
  unknown: {
    code: "unknown",
    name: "Unknown",
    nativeName: "Unknown",
    detectionSupport: "PARTIAL",
    understandingSupport: "PARTIAL",
    generationSupport: "FALLBACK_ONLY",
    fallbackLanguage: "en",
    confidenceThreshold: 0.50,
    tier: 3,
  },
};

// Tier 1 Vocabulary
const SOMALI_MARKERS = [
  /\b(asc|asalaamu calaykum|slm|salaam|wcs|wa calaykum salaam|sxb|saaxiib|wlhi|wallahi|alx|alxmd|alxamdulillah|mahadsanid|mahadsan|abaayo|abowe|walaal|haye|haye sxb|soomaali|fadlan|haa|maya|ok)\b/i,
  /\b(waxaan|waan|waxa|aan|doonayaa|rabaa|raadinayaa|rabnaa|doonaynaa|baahanahay|u baahanahay)\b/i,
  /\b(guri|guryo|guriga|guryaha|guryaal|aqal|dabaq|dabaqyo|qol|qolal|musqul|musqulo|jiko|kushiin)\b/i,
  /\b(leh|ku|yaal|yaalla|yaalo|oo|ah|u|dhow|fog|weyn|yar|cusub|casri|qadiim)\b/i,
  /\b(baarkin|xeeb|xeebta|badda|dayr|ilaalo|shamsi|solar)\b/i,
  /\b(iib|iibka|kiree|kiro|kirro|kirada|kireeyo|kireysto|kireysan|kiraysanayaa|aan kireysto|aan kiraysto|la kireeyo|la kireysto|bishii|bishiiba|sanadkii|qiimo|jaban|qaali|fursad|miisaaniyad|miisaaniyadaadu|miisaaniyaddaadu|miisaaniyadeydu|waa|intee|kun|malyan|doolar|dollar)\b/i,
  /\b(muqdisho|hargeysa|boosaaso|kismaayo|garoowe|baydhabo|berbera|caabudwaaq|abudwak|abudwaaq|gaalkacyo|galkayo|burco|burao|beledweyne|belet weyne|dhuusamareeb|dhusamareeb|samareeb|guriceel|cadaado|adado|laascaanood|las anod|boorama|borama|ceerigaabo|erigavo|qardho|doolow|dollow|baardheere|bardera|jowhar|afgooye|marka|hobyo)\b/i,
  /\b(midka|kan|ugu|horeeya|labaad|saddexaad|tusi|sheeg|midka kale|isbarbar|dhig|labadaas)\b/i,
  /\b(hubtaa|ma hubtaa|midaas|waxaas|sax miyaa|ma sax baa|runtii|dhab miyaa|ma dhab baa|faahfaahi|sharax|maxaad|ula jeedaa|ula jeeday|sidee|sabab|xaggee|goorma|keedaa|keena|keeda|kee|halkan|halkaas|gurigan|gurigaas|labadan|labada)\b/i,
  /\b(ma aqaan|ma garanayo|fiican|wax walba|bilow mar kale|start over|aan dib uga bilowno)\b/i,
];

const ARABIC_MARKERS = [
  "أبحث", "ابحث", "أريد", "اريد", "منزل", "شقة", "فيلا", "بيت",
  "غرف", "غرفة", "نوم", "حمام", "مطبخ", "موقف", "سيارات", "شاطئ",
  "للبيع", "للإيجار", "للايجار", "مسبح", "حديقة", "مقديشو", "هرجيسا",
  "الأول", "الثاني", "الثالث", "الأرخص", "الأغلى", "كم", "سعر", "قارن"
];

// Tier 2 (East African) Vocabulary
const SWAHILI_MARKERS = [
  /\b(ninataka|nahitaji|natafuta|nyumba|chumba|vyumba|ghorofa|bei|rahisi|habari|karibu|asante)\b/i,
  /\b(katika|ya|kwa|chumbani|choo|bafu|uwanja|eneo|shilingi|dola|kupanga|kununua)\b/i,
  /\b(ya kwanza|ya pili|ya tatu|gani|ngapi|kulinganisha|hiki|ile|zaidi)\b/i,
];

const AMHARIC_MARKERS = [
  "ቤት", "መኖሪያ", "ክፍል", "መኝታ", "ዋጋ", "ኪራይ", "ሽያጭ", "መግዛት", "መፈለግ",
  "አዲስ", "አበባ", "መኪنا", "ማቆሚያ", "የመጀመሪያው", "ሁለተኛው", "ስንት", "ሰላም"
];

const OROMO_MARKERS = [
  /\b(mana|barbaada|gurgurtaa|kireeffannaa|kutaa|gatii|magaalaa|jalqaba|lammaffaa|nagaa)\b/i,
];

const TIGRINYA_MARKERS = [
  "ገዛ", "ክፍሊ", "ዋጋ", "መሸጣ", "ክራይ", "ቀዳማይ", "ካልኣይ", "ክንደይ", "ሰላም"
];

// Tier 3 (Global & Regional) Vocabulary
const FRENCH_MARKERS = [
  /\b(je|veux|cherche|maison|appartement|chambre|chambres|prix|ville|combien|premier|deuxième|louer|acheter)\b/i,
];

const SPANISH_MARKERS = [
  /\b(quiero|busco|casa|apartamento|habitaciones|precio|cuánto|primero|segundo|barato|alquilar|comprar)\b/i,
];

const GERMAN_MARKERS = [
  /\b(ich|suche|brauche|haus|wohnung|zimmer|preis|wie|viel|erste|zweite|billiger|mieten|kaufen)\b/i,
];

const PORTUGUESE_MARKERS = [
  /\b(quero|procuro|casa|apartamento|quartos|preço|quanto|primeiro|segundo|alugar|comprar|barato)\b/i,
];

const TURKISH_MARKERS = [
  /\b(ev|daire|kiralık|satılık|oda|fiyat|nerede|istiyorum|kaç|ucuz)\b/i,
];

const HAUSA_MARKERS = [
  /\b(gida|haya|sayarwa|daki|dakuna|kudi|neman|ina|son)\b/i,
];

const INDONESIAN_MALAY_MARKERS = [
  /\b(saya|ingin|mencari|rumah|sewa|beli|kamar|harga|murah|apartemen)\b/i,
];

const ITALIAN_MARKERS = [
  /\b(cerco|affitto|casa|appartamento|camere|prezzo|quanto|primo|secondo|economico|vendita)\b/i,
];

export interface LanguageDetectionDetails {
  language: ExtendedLanguage;
  confidence: number;
  isCodeSwitching: boolean;
  script: "Latn" | "Arab" | "Ethi" | "Cyrl" | "CJK" | "Deva" | "Beng" | "Mixed";
  explicitPreferenceDetected?: ExtendedLanguage;
}

/**
 * Detect language of a conversational user turn with extended multilingual support
 */
export function detectConversationalLanguage(
  text: string,
  currentPreference?: ExtendedLanguage
): LanguageDetectionDetails {
  if (!text || text.trim().length === 0) {
    return {
      language: currentPreference || "en",
      confidence: 1.0,
      isCodeSwitching: false,
      script: "Latn",
    };
  }

  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  // 1. Check for Explicit Language Change Directives
  let explicitPreference: ExtendedLanguage | undefined = undefined;
  if (lower.match(/\b(speak|talk|write|respond)\s+(?:in\s+|to\s+me\s+in\s+)?somali\b/i) ||
      lower.includes("af soomaali igu hadal") || lower.includes("af soomaali ku hadal") || lower.includes("soomaali ii qor")) {
    explicitPreference = "so";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(?:in\s+|to\s+me\s+in\s+)?english\b/i) ||
             lower.includes("ingiriisi ku hadal") || lower.includes("بالإنجليزي") || lower.includes("بالانجليزية") || lower.includes("speak english")) {
    explicitPreference = "en";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(?:in\s+|to\s+me\s+in\s+)?arabic\b/i) ||
             lower.includes("تحدث معي بالعربية") || lower.includes("بالعربي") || lower.includes("carabi ku hadal") || lower.includes("العربية من فضلك")) {
    explicitPreference = "ar";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(?:in\s+|to\s+me\s+in\s+)?swahili\b/i) ||
             lower.includes("ongea kwa kiswahili") || lower.includes("kwa kiswahili tafadhali")) {
    explicitPreference = "sw";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(?:in\s+|to\s+me\s+in\s+)?french\b/i) ||
             lower.includes("parle en français") || lower.includes("parle en francais")) {
    explicitPreference = "fr";
  }

  // 2. Script Analysis
  const hasArabic = ARABIC_SCRIPT_REGEX.test(normalized);
  const hasEthiopic = ETHIOPIC_SCRIPT_REGEX.test(normalized);
  const hasCyrillic = CYRILLIC_SCRIPT_REGEX.test(normalized);
  const hasCJK = CJK_SCRIPT_REGEX.test(normalized);
  const hasKana = JAPANESE_KANA_REGEX.test(normalized);
  const hasDevanagari = DEVANAGARI_SCRIPT_REGEX.test(normalized);
  const hasBengali = BENGALI_SCRIPT_REGEX.test(normalized);

  if (hasArabic) {
    const isUrdu = URDU_SPECIFIC_CHARS.test(normalized) || /\b(مکان|کرایہ|چاہیے|کتنا)\b/.test(normalized);
    const isPersian = PERSIAN_SPECIFIC_CHARS.test(normalized) || /\b(می‌خواهم|اجاره|خانه|آپارتمان|چند)\b/.test(normalized);
    const arabicWords = ARABIC_MARKERS.filter(m => normalized.includes(m));
    const latinChars = (normalized.match(/[a-zA-Z]/g) || []).length;
    const arabicChars = (normalized.match(ARABIC_SCRIPT_REGEX) || []).length;
    const isCodeSwitching = latinChars > 2 && arabicChars > 2;

    const detectedLang: ExtendedLanguage = isUrdu ? "ur" : isPersian ? "fa" : isCodeSwitching ? "mixed" : "ar";

    return {
      language: detectedLang,
      confidence: Math.min(1.0, 0.75 + arabicWords.length * 0.1),
      isCodeSwitching,
      script: isCodeSwitching ? "Mixed" : "Arab",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  if (hasEthiopic) {
    const amharicMatch = AMHARIC_MARKERS.some(m => normalized.includes(m));
    const tigrinyaMatch = TIGRINYA_MARKERS.some(m => normalized.includes(m));
    return {
      language: tigrinyaMatch && !amharicMatch ? "ti" : "am",
      confidence: 0.90,
      isCodeSwitching: false,
      script: "Ethi",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  if (hasDevanagari) {
    return { language: "hi", confidence: 0.92, isCodeSwitching: false, script: "Deva", explicitPreferenceDetected: explicitPreference };
  }

  if (hasBengali) {
    return { language: "bn", confidence: 0.92, isCodeSwitching: false, script: "Beng", explicitPreferenceDetected: explicitPreference };
  }

  if (hasCyrillic) {
    return { language: "ru", confidence: 0.90, isCodeSwitching: false, script: "Cyrl", explicitPreferenceDetected: explicitPreference };
  }

  if (hasKana) {
    return { language: "ja", confidence: 0.92, isCodeSwitching: false, script: "CJK", explicitPreferenceDetected: explicitPreference };
  }

  if (hasCJK) {
    return { language: "zh", confidence: 0.85, isCodeSwitching: false, script: "CJK", explicitPreferenceDetected: explicitPreference };
  }

  // 3. Latin-Script Multilingual Token Scoring
  let somaliScore = 0;
  for (const pattern of SOMALI_MARKERS) {
    if (pattern.test(normalized)) somaliScore += 1;
  }

  let swahiliScore = 0;
  for (const pattern of SWAHILI_MARKERS) {
    if (pattern.test(normalized)) swahiliScore += 1;
  }

  let oromoScore = 0;
  for (const pattern of OROMO_MARKERS) {
    if (pattern.test(normalized)) oromoScore += 1;
  }

  let frenchScore = (lower.match(/\b(je|veux|cherche|maison|appartement|chambre|chambres|prix|ville|combien|premier|deuxième|louer|acheter)\b/g) || []).length;
  let spanishScore = (lower.match(/\b(quiero|busco|alquilar|habitaciones|habitación|precio|cuánto|primero|segundo|barato|comprar)\b/g) || []).length;
  let portugueseScore = (lower.match(/\b(quero|procuro|alugar|quartos|quarto|preço|quanto|primeiro|segundo|barato|moradia)\b/g) || []).length;
  let italianScore = (lower.match(/\b(cerco|affitto|camere|camera|prezzo|quanto|primo|secondo|economico|vendita)\b/g) || []).length;
  let germanScore = (lower.match(/\b(ich|suche|brauche|haus|wohnung|zimmer|preis|wie|viel|erste|zweite|billiger|mieten|kaufen)\b/g) || []).length;
  let turkishScore = (lower.match(/\b(ev|daire|kiralık|satılık|oda|fiyat|nerede|istiyorum|kaç|ucuz)\b/g) || []).length;
  let hausaScore = (lower.match(/\b(gida|haya|sayarwa|daki|dakuna|kudi|neman|ina|son)\b/g) || []).length;
  let indonesianScore = (lower.match(/\b(saya|ingin|mencari|rumah|sewa|beli|kamar|harga|murah|apartemen)\b/g) || []).length;

  let englishScore = 0;
  const englishMatches = lower.match(/\b(i|want|need|looking|for|house|bedroom|villa|apartment|under|with|parking|in|cheaper|second|first|show|more|price)\b/g);
  if (englishMatches) {
    englishScore = englishMatches.length;
  }

  // Location resolver signal: Any Somali recognized city boosts Somali evidence when not clearly another language
  const loc = resolveLocation(normalized);
  if (loc && swahiliScore === 0 && englishScore === 0 && spanishScore === 0 && frenchScore === 0 && oromoScore === 0 && italianScore === 0) {
    somaliScore += 1;
  }

  // 4. Strict Conversation Language Inheritance for Short Turns
  // Short messages (e.g. "caabudwaaq", "3", "80k", "haa", "maya", "kan labaad", "500 dollar bishii", "wax walba ii raadi")
  // MUST inherit conversation language unless there is strong counter-language evidence (>= 2 distinct words)
  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  const isShortMessage = normalized.length <= 40 || tokenCount <= 5;

  if (currentPreference && isShortMessage && englishScore < 2 && swahiliScore === 0 && explicitPreference === undefined) {
    // If user previously spoke Somali/Arabic/Swahili/etc. and this short message doesn't explicitly speak English:
    if (currentPreference !== "en") {
      return {
        language: currentPreference,
        confidence: 0.95,
        isCodeSwitching: false,
        script: "Latn",
        explicitPreferenceDetected: undefined,
      };
    }
  }

  // Code-switching detection (Somali + English)
  if (somaliScore >= 1 && englishScore >= 1 && tokenCount > 4) {
    return {
      language: "mixed",
      confidence: 0.90,
      isCodeSwitching: true,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Swahili takes precedence if swahiliScore >= somaliScore
  if (swahiliScore > 0 && swahiliScore >= somaliScore && swahiliScore >= englishScore) {
    return {
      language: "sw",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Oromo takes precedence if oromoScore >= somaliScore
  if (oromoScore > 0 && oromoScore >= somaliScore) {
    return {
      language: "om",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Hausa
  if (hausaScore > 0 && hausaScore >= somaliScore) {
    return {
      language: "ha",
      confidence: 0.85,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Turkish
  if (turkishScore > 0 && turkishScore >= somaliScore) {
    return {
      language: "tr",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // French
  if (frenchScore > 0 && frenchScore >= somaliScore && frenchScore >= englishScore) {
    return {
      language: "fr",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Spanish
  if (spanishScore > 0 && spanishScore >= somaliScore && spanishScore >= portugueseScore && spanishScore >= italianScore) {
    return {
      language: "es",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Portuguese
  if (portugueseScore > 0 && portugueseScore >= somaliScore && portugueseScore >= spanishScore && portugueseScore >= italianScore) {
    return {
      language: "pt",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Italian
  if (italianScore > 0 && italianScore >= somaliScore && italianScore > portugueseScore && italianScore > spanishScore) {
    return {
      language: "it",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // German
  if (germanScore > 0 && germanScore >= somaliScore) {
    return {
      language: "de",
      confidence: 0.88,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Indonesian / Malay
  if (indonesianScore > 0 && indonesianScore >= somaliScore) {
    return {
      language: "id",
      confidence: 0.85,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  if (somaliScore > 0 && somaliScore >= englishScore) {
    return {
      language: "so",
      confidence: Math.min(1.0, 0.8 + somaliScore * 0.1),
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Fallback to conversation preference if active, otherwise English
  const finalLang: ExtendedLanguage = currentPreference || (englishScore > 0 ? "en" : "en");
  return {
    language: finalLang,
    confidence: currentPreference ? 0.90 : (englishScore > 0 ? 0.85 : 0.60),
    isCodeSwitching: false,
    script: "Latn",
    explicitPreferenceDetected: explicitPreference,
  };
}

/**
 * Natural Conversational Dialog Generator in User's Language
 * Used when Gemini API is unconfigured (fallback mode) or for deterministic conversational grounding.
 */
export function generateNaturalDialogResponse(params: {
  language: ExtendedLanguage;
  templateType:
    | "GREETING"
    | "CLARIFICATION"
    | "GENERAL_CONVERSATION"
    | "SEARCH_RESULTS"
    | "ZERO_RESULTS"
    | "PROPERTY_DETAILS"
    | "CHEAPER_COMPARISON"
    | "ORDINAL_DETAILS"
    | "SIDE_BY_SIDE_COMPARISON"
    | "SLOT_UPDATE"
    | "PRICE_VALUATION"
    | "TOPIC_SHIFT"
    | "USER_UNCERTAIN"
    | "ADVICE"
    | "EDUCATION"
    | "VAGUE_GOAL"
    | "TRADE_OFF"
    | "RESET"
    | "DISTRICT_INQUIRY"
    | "OUT_OF_SCOPE"
    | "MIXED_QUERY"
    | "CONFIRMATION"
    | "CORRECTION"
    | "AMBIGUOUS";
  userName?: string;
  userMessage?: string;
  clarificationQuestion?: string;
  missingSlot?: string;
  properties?: any[];
  totalMatches?: number;
  slots?: any;
  referencedProperty?: any;
  comparedPropertyA?: any;
  comparedPropertyB?: any;
  updatedSlot?: { name: string; value: any };
  valuationData?: any;
  outOfScopeCategory?: "school_homework" | "crypto_finance" | "assignment" | "general_offtopic";
  hasActiveSearchContext?: boolean;
  lastAssistantMessage?: string;
  intent?: string;
}): string {
  const lang = params.language;
  const msg = (params.userMessage || "").toLowerCase();

  switch (params.templateType) {
    case "CONFIRMATION": {
      const lastAsst = (params.lastAssistantMessage || "").toLowerCase();
      // If previous assistant message was an introduction, greeting, or scope declaration:
      if (
        lastAsst.includes("kiro-maal") ||
        lastAsst.includes("ku soo dhowow") ||
        lastAsst.includes("soo dhawoow") ||
        lastAsst.includes("assistant") ||
        lastAsst.includes("welcome") ||
        lastAsst.includes("caawin karaa")
      ) {
        if (lang === "so") {
          return `Haa 😊 Waxaan ahay Kiro-Maal Real Estate Assistant, waxaana diiradda saaraa adeegyada Real Estate-ka sida guryaha, apartments-ka, villas-ka, dhulka, kirada iyo iibka.`;
        }
        if (lang === "ar") {
          return `نعم 😊 أنا المساعد العقاري الرسمي لـ كيرو-مال، وأتخصص حصرياً في خدمات العقارات من منازل، شقق، فلل، أراضي، إيجار وشراء.`;
        }
        return `Yes 😊 I am the Kiro-Maal Real Estate Assistant, and I specialize exclusively in real estate services such as houses, apartments, villas, land, rentals, and purchases.`;
      }
      // If previous assistant message was property results, pricing, or availability:
      if (lang === "so") {
        return `Haa, gabi ahaanba waan hubaa 👍 Dhammaan xogta aan kuu sheegay waxay si toos ah uga timid nidaamka xaqiijisan ee Kiro-Maal.`;
      }
      if (lang === "ar") {
        return `نعم، بالتأكيد 👍 جميع المعلومات مستخرجة مباشرة من قاعدة بيانات كيرو-مال المعتمدة.`;
      }
      return `Yes, I am certain 👍 All information provided is verified directly from Kiro-Maal's approved database.`;
    }

    case "CORRECTION": {
      const slotName = params.updatedSlot?.name || "shuruudaha";
      const slotVal = params.updatedSlot?.value || "";
      if (lang === "so") {
        if (slotName === "district") {
          return `Waan saxay 👍 Xaafadda waxaan ka dhigay ${slotVal}. Waxaan ku sii wadayaa shuruudahaagii hore.`;
        }
        if (slotName === "bedrooms") {
          return `Waan saxay 👍 Tirada qolalka waxaan ka dhigay ${slotVal} qol jiif. Waxaan ku sii wadayaa shuruudahaagii hore.`;
        }
        if (slotName === "maxPrice" || slotName === "budget") {
          return `Waan saxay 👍 Miisaaniyadda waxaan ka dhigay $${slotVal}. Waxaan ku sii wadayaa shuruudahaagii hore.`;
        }
        return `Waan saxay 👍 Xogtaada waan cusboonaysiiyay (${slotName}: ${slotVal}). Waxaan ku sii wadayaa shuruudahaagii hore.`;
      }
      if (lang === "ar") {
        return `تم التعديل 👍 تم تحديث ${slotName} إلى ${slotVal} مع الحفاظ على بقية متطلباتك.`;
      }
      return `Updated 👍 Set ${slotName} to ${slotVal} while preserving your previous requirements.`;
    }

    case "AMBIGUOUS": {
      if (params.clarificationQuestion) {
        return params.clarificationQuestion;
      }
      if (lang === "so") {
        return `Maxaad ula jeeddaa kan? Ii sheeg property-ga ama fariintii aad tixraacayso si aan si sax ah kaaga caawiyo.`;
      }
      if (lang === "ar") {
        return `ماذا تقصد بهذا؟ يرجى تحديد العقار أو الرسالة التي تشير إليها حتى أتمكن من مساعدتك.`;
      }
      return `What do you mean by that? Please specify the property or message you are referring to so I can assist you accurately.`;
    }

    case "GREETING": {
      if (lang === "so") {
        if (msg.includes("sxb") || msg.includes("saaxiib")) {
          return `Wa calaykum salaam sxb 😊 Ku soo dhowow Kiro-Maal. Maxaan kaa caawin karaa—guri kirro ah, iib, apartment, villa mise dhul?`;
        }
        return `Waad salaaman tahay 👋 Ku soo dhowow Kiro-Maal. Maxaan kaa caawin karaa—guri kirro ah, iib, apartment, villa mise dhul?`;
      }
      if (lang === "ar") {
        return `أهلاً ومرحباً بك 👋 مرحباً بك في كيرو-مال. كيف يمكنني مساعدتك—عقار للإيجار، للبيع، شقة، فيلا أم أرض؟`;
      }
      if (lang === "sw") {
        return `Habari na karibu sana 👋 Karibu Kiro-Maal. Ninawezaje kukusaidia—nyumba ya kupanga, kununua, apartment, villa au ardhi?`;
      }
      return `Welcome to Kiro-Maal 👋 How can I help you today—rental property, home purchase, apartment, villa, or land?`;
    }

    case "USER_UNCERTAIN": {
      if (lang === "so") {
        return `Dhib ma leh 😊 Aan kuu fududeeyo. Marka hore, ma rabtaa inaad guri kiraysato mise aad iibsato?`;
      }
      if (lang === "ar") {
        return `لا مشكلة على الإطلاق 😊 دعني أسهل الأمر عليك. في البداية، هل ترغب في الاستئجار أم الشراء؟`;
      }
      if (lang === "sw") {
        return `Hakuna shida kabisa 😊 Hebu nisaidie kufanya iwe rahisi. Kwanza, je, unataka kupanga au kununua nyumba?`;
      }
      return `No problem at all 😊 Let me help simplify this. First, are you looking to rent or buy a home?`;
    }

    case "ADVICE": {
      if (lang === "so") {
        return `Haddii aad kaligaa tahay oo budget-kaagu yahay $500 bishii, waxaan kugula talin lahaa inaad marka hore eegto apartment 1–2 qol jiif ah oo ku yaal meel kuu dhow shaqadaada. Haddii aad ii sheegto xaafadda ama meesha aad ka shaqeyso, waxaan kuu raadin karaa options ku habboon oo aan isbarbar dhigi karo.`;
      }
      if (lang === "ar") {
        return `إذا كنت تقيم بمفردك وميزانيتك 500 دولار شهرياً، فأنصحك بالبدء بشقة من غرفة إلى غرفتي نوم في منطقة قريبة من عملك. إذا أخبرتني بالحي المفضل، سأقارن لك الخيارات المناسبة.`;
      }
      if (lang === "sw") {
        return `Ikiwa unaishi peke yako na bajeti yako ni $500 kwa mwezi, ningekushauri uanze kwa kuangalia apartment ya vyumba 1–2 karibu na unakofanyia kazi. Ukiniambia mtaa unaopendelea, ninaweza kukulinganishia chaguzi zinazofaa.`;
      }
      return `If you're living alone with a $500/month budget, I'd recommend starting with 1–2 bedroom apartments in convenient areas close to your work. If you tell me your preferred neighborhood or where you work, I can help compare suitable options.`;
    }

    case "EDUCATION": {
      if (msg.includes("furnished") || msg.includes("qalabaysan") || msg.includes("مفروش")) {
        if (lang === "so") {
          return `Furnished waxaa loola jeedaa guri leh qaar ama dhammaan alaabta aasaasiga ah sida sariir, fadhiga, miis, iwm. Haddii aad rabto, waxaan sidoo kale kuu sharxi karaa farqiga u dhexeeya furnished iyo unfurnished.`;
        }
        if (lang === "ar") {
          return `العقار المفروش (Furnished) يعني أنه مجهز بالأثاث والأجهزة الأساسية مثل الأسرة والأرائك وطاولة الطعام. هل ترغب في معرفة المزيد؟`;
        }
        return `Furnished means a property that already includes basic furniture and appliances such as beds, sofas, and tables. If you'd like, I can explain the differences between furnished and unfurnished options.`;
      }
      if (msg.includes("villa") || msg.includes("fiilo") || msg.includes("فيلا")) {
        if (lang === "so") {
          return `Fiilo (Villa) waa guri weyn oo gaar ah, inta badan leh dayr u gooni ah, baarkin baabuur, beero yar, iyo qolal ballaaran oo loogu talagalay qoys.`;
        }
        if (lang === "ar") {
          return `الفيلا هي عقار سكني مستقل وواسع يضم عادة حديقة خاصة وموقف سيارات ومساحات رحبة تناسب العائلات.`;
        }
        return `A villa is a spacious, standalone residential property often featuring private grounds, private parking, and luxury amenities suited for family living.`;
      }
      if (msg.includes("lease") || msg.includes("heshiis") || msg.includes("عقد")) {
        if (lang === "so") {
          return `Lease (heshiiska kirada) waa heshiis sharciyeed oo dhexmara mulkiilaha iyo kiraystaha, kaasoo qeexaya muddada kirada, qiimaha bishii, iyo xuquuqda labada dhinac.`;
        }
        return `A lease is a binding legal contract between landlord and tenant defining rental duration, monthly price, and terms of occupancy.`;
      }
      if (msg.includes("deposit") || msg.includes("dhigaal") || msg.includes("تأمين")) {
        if (lang === "so") {
          return `Security deposit (lacagta dhigaalka) waa lacag hormaris ah oo mulkiiluhu hayo muddada heshiiska si loogu daboolo wixii burbur ah ama biilal baaqday, dibna loogu celiyo kiraystaha marka uu ka guuro.`;
        }
        return `A security deposit is an upfront deposit held by the landlord to cover potential damages or unpaid bills, refundable at move-out.`;
      }
      if (msg.includes("escrow") || msg.includes("iibsan") || msg.includes("buying")) {
        if (lang === "so") {
          return `Iibsashada guriga waxay u baahan tahay in la xaqiijiyo lahaanshaha sharciyeed, diiwaangelinta dowladda hoose, iyo isticmaalka nidaam sugan (escrow) oo lacagta haysa ilaa dukumiintiyada si rasmi ah lagugu wareejiyo.`;
        }
        return `Before buying property, always verify the registered title deed with local municipal authorities, inspect the physical structure, and use an escrow arrangement to secure transaction funds.`;
      }
      if (lang === "so") {
        return `Fadlan ii sheeg fikradda ama ereyga aad doonayso inaan kuu faahfaahiyo, waan kuu sharxayaa.`;
      }
      return `Please let me know which real estate term or concept you'd like me to explain.`;
    }

    case "VAGUE_GOAL": {
      if (lang === "so") {
        return `Markaad leedahay fiican, maxaa kuu muhiimsan—qiimo jaban, meel fiican, qolal badan, mise amenities-ka sida parking iyo security?`;
      }
      if (lang === "ar") {
        return `عندما تقول منزل جيد، ما هو الأهم بالنسبة لك—السعر المناسب، الموقع الحيوي، عدد الغرف، أم الخدمات مثل موقف السيارات والأمان؟`;
      }
      return `When you say a good home, what is most important to you—budget affordability, prime location, spacious rooms, or amenities like parking and security?`;
    }

    case "TRADE_OFF": {
      if (lang === "so") {
        return `Waan fahmay—waxaad raadineysaa dheelitirnaan u dhaxeysa qiimo jaban iyo goob fiican. Miisaaniyadda ugu badan ee aad awoodi karto bishii intee le'eg ayay tahay si aan kuugu soo xulo meelaha ugu habboon?`;
      }
      if (lang === "ar") {
        return `فهمت طلبك—تبحث عن التوازن بين السعر المنخفض والموقع الجيد. ما هو الحد الأقصى للميزانية التي تفضلها لنحدد أفضل الخيارات؟`;
      }
      return `Understood—balancing an affordable price with a great location is a great strategy. What is the maximum budget you would like to stay under so I can find the best options in convenient neighborhoods?`;
    }

    case "RESET": {
      if (lang === "so") {
        return `Waa hagaag! Waxaan dib uga bilaabaynaa raadinta. Maxaan hadda kuu qabtaa—guri noocee ah ayaad rabtaa?`;
      }
      if (lang === "ar") {
        return `حسناً! تم إعادة ضبط البحث من جديد. ما الذي تبحث عنه الآن؟`;
      }
      return `Sure! Resetting our search criteria. What kind of home or city would you like to explore now?`;
    }

    case "DISTRICT_INQUIRY": {
      const city = params.slots?.city || "magaalada";
      if (lang === "so") {
        return `Waayahay. Ma leedahay xaafad aad doorbidayso mise ${city} oo dhan ayaan ka raadiyaa?`;
      }
      if (lang === "ar") {
        return `حسناً. هل تفضل حياً معيناً أم أبحث في كافة أنحاء ${city}؟`;
      }
      if (lang === "sw") {
        return `Sawa. Je, una mtaa unaopendelea au nitafute kote ${city}?`;
      }
      return `Got it. Do you have a preferred neighborhood in mind, or should I search across all of ${city}?`;
    }

    case "CLARIFICATION": {
      if (params.clarificationQuestion) {
        return params.clarificationQuestion;
      }
      if (params.missingSlot === "district") {
        const city = params.slots?.city || "magaalada";
        if (lang === "so") return `Waayahay. Ma leedahay xaafad aad doorbidayso mise ${city} oo dhan ayaan ka raadiyaa?`;
        if (lang === "ar") return `حسناً. هل تفضل حياً معيناً أم أبحث في كافة أنحاء ${city}؟`;
        return `Got it. Do you have a preferred neighborhood in mind, or should I search across all of ${city}?`;
      }
      if (params.missingSlot === "city") {
        if (lang === "so") return `Waad heli kartaa. Magaalo noocee ah ayaad ka raadinaysaa?`;
        if (lang === "ar") return `بالتأكيد. في أي مدينة تبحث عن العقار؟`;
        return `Certainly. Which city are you looking to find a property in?`;
      }
      if (params.missingSlot === "budget") {
        const city = params.slots?.city || "halkaas";
        if (lang === "so") return `Waayahay, ${city}. Miisaaniyadda kiradaadu waa intee?`;
        if (lang === "ar") return `حسناً، ${city}. ما هي ميزانيتك الشهرية للإيجار؟`;
        return `Understood, ${city}. What is your target monthly budget?`;
      }
      if (params.missingSlot === "bedrooms") {
        if (lang === "so") return `Mahadsanid. Qolal jiif imisa ayaad rabtaa?`;
        if (lang === "ar") return `شكراً لك. كم عدد غرف النوم التي ترغب بها؟`;
        return `Thank you. How many bedrooms would you prefer?`;
      }
      if (lang === "so") return `Fadlan wax yar faahfaahin ka bixi waxa aad raadinayso.`;
      return `Could you please provide a few more details about what you are looking for?`;
    }

    case "GENERAL_CONVERSATION": {
      // Gratitude
      if (msg.includes("mahadsanid") || msg.includes("thanks") || msg.includes("thank you") || msg.includes("shukran")) {
        if (lang === "so") return `Adigaa mudan! Diyaar baan u ahay inaan kugu caawiyo wax kasta oo la xiriira guryaha.`;
        if (lang === "ar") return `على الرحب والسعة! أنا هنا لمساعدتك في أي وقت.`;
        return `You're very welcome! Let me know if you need anything else regarding properties.`;
      }
      // How are you / Sidee tahay
      if (msg.includes("how are you") || msg.includes("sidee tahay") || msg.includes("see tahay")) {
        if (lang === "so") return `Aad baan u fiicanahay 😊. Waxaan ahay Kiro-Maal Real Estate Assistant. Maxaad maanta ka raadinaysaa?`;
        if (lang === "ar") return `أنا بخير والحمد لله 😊. أنا مساعد كيرو-مال العقاري. ما الذي تبحث عنه اليوم؟`;
        if (lang === "sw") return `Niko vizuri sana 😊. Mimi ni Msaidizi wa Kiro-Maal Real Estate. Unatafuta nini leo?`;
        return `I'm doing great 😊. I am the Kiro-Maal Real Estate Assistant. What kind of property are you looking for today?`;
      }
      // Default conversational reply
      if (lang === "so") return `Waan ku maqlayaa! Ma jeclaan lahayd inaan kuu raadiyo guri, kuu qiimeeyo hanti, mise waxaad qabtaa su'aal kale?`;
      if (lang === "ar") return `أهلاً بك! هل ترغب في البحث عن عقار، أو تقييم سعر السوق، أو لديك أي استفسار آخر؟`;
      return `I'm here to assist! Would you like me to find properties, check market valuations, or answer real estate questions?`;
    }

    case "OUT_OF_SCOPE": {
      const cat = params.outOfScopeCategory;
      const isContextualFollowUp = params.hasActiveSearchContext;

      // 1. School / Homework / Math
      if (cat === "school_homework" || msg.includes("cashar") || msg.includes("school") || msg.includes("homework") || msg.includes("xisaab")) {
        if (lang === "so") {
          if (isContextualFollowUp) {
            return `Qaybtaas waxay ka baxsan tahay adeegga Kiro-Maal. Waxaan ku caawin karaa arrimaha Real Estate-ka.`;
          }
          return `Waan kaa caawin lahaa, laakiin waxaan ahay Kiro-Maal Real Estate Assistant, waxaana si gaar ah kaaga caawin karaa arrimaha Real Estate-ka sida guryaha, apartments-ka, villas-ka, dhulka, kirada iyo iibka. 🏠\n\nHaddii aad property raadinayso, ii sheeg waxa aad u baahan tahay.`;
        }
        if (lang === "ar") {
          if (isContextualFollowUp) {
            return `هذا الطلب خارج نطاق خدمة كيرو-مال. يمكنني مساعدتك في المسائل العقارية.`;
          }
          return `يسعدني مساعدتك، ولكنني مساعد كيرو-مال العقاري المتخصص فقط في العقارات مثل المنازل والشقق والفلل والأراضي والإيجار والشراء. 🏠\n\nإذا كنت تبحث عن عقار، يرجى إخباري بما تحتاجه.`;
        }
        if (isContextualFollowUp) {
          return `That request is outside of Kiro-Maal's service. I can help with Real Estate matters.`;
        }
        return `I would help, but I am the Kiro-Maal Real Estate Assistant, and I specialize exclusively in real estate matters such as houses, apartments, villas, land, rentals, and sales. 🏠\n\nIf you are looking for a property, please let me know what you need.`;
      }

      // 2. Bitcoin / Crypto / Finance
      if (cat === "crypto_finance" || msg.includes("bitcoin") || msg.includes("crypto") || msg.includes("btc")) {
        if (lang === "so") {
          return `Su'aashaas waxay ka baxsan tahay adeegga Kiro-Maal. Waxaan si gaar ah kaaga caawin karaa arrimaha Real Estate-ka sida guryo, apartments, villas, dhul, kirro iyo iib. 🏠\n\nMaxaad ka raadinaysaa property ahaan?`;
        }
        if (lang === "ar") {
          return `هذا السؤال خارج نطاق خدمة كيرو-مال. يمكنني مساعدتك تحديداً في الأمور العقارية مثل المنازل والشقق والفلل والأراضي والإيجار والبيع. 🏠\n\nما الذي تبحث عنه كعقار؟`;
        }
        return `That question is outside Kiro-Maal's service. I specialize specifically in real estate matters such as houses, apartments, villas, land, rentals, and sales. 🏠\n\nWhat kind of property are you looking for?`;
      }

      // 3. Assignment / Study
      if (cat === "assignment" || msg.includes("assignment")) {
        if (lang === "so") {
          return `Su'aashaas waxay ka baxsan tahay adeegga Kiro-Maal. Waxaan ahay Real Estate Assistant, sidaas darteed waxaan kaa caawin karaa oo keliya arrimaha property-ga, kirada, iibka iyo Real Estate-ka.`;
        }
        if (lang === "ar") {
          return `هذا السؤال خارج نطاق خدمة كيرو-مال. أنا مساعد عقاري، ولذلك يمكنني فقط مساعدتك في أمور العقارات والإيجار والشراء.`;
        }
        return `That question is outside Kiro-Maal's service. I am a Real Estate Assistant, so I can only help you with property, rentals, purchases, and real estate inquiries.`;
      }

      // 4. General out-of-scope fallback
      if (lang === "so") {
        return `Su'aashaas waxay ka baxsan tahay adeegga Kiro-Maal. Waxaan ahay Kiro-Maal Real Estate Assistant, waxaana si gaar ah kaaga caawin karaa arrimaha guryaha, apartments-ka, villas-ka, dhulka, kirada iyo iibka. 🏠\n\nMaxaad ka raadinaysaa property ahaan?`;
      }
      if (lang === "ar") {
        return `هذا الطلب خارج نطاق خدمة كيرو-مال. أنا مساعد كيرو-مال العقاري، وأتخصص حصرياً في المنازل والشقق والفلل والأراضي والإيجار والشراء. 🏠\n\nما نوع العقار الذي تبحث عنه؟`;
      }
      return `That request is outside the scope of Kiro-Maal. I am the Kiro-Maal Real Estate Assistant, specializing exclusively in homes, apartments, villas, land, rentals, and sales. 🏠\n\nWhat kind of property are you looking for?`;
    }

    case "MIXED_QUERY": {
      const items: string[] = [];
      const district = params.slots?.district;
      const city = params.slots?.city;
      if (district) {
        items.push(`- 📍 ${district}`);
      } else if (city) {
        items.push(`- 📍 ${city}`);
      }
      if (params.slots?.maxPrice) {
        const isRent = params.slots?.purpose === "RENT" || (params.slots?.maxPrice && params.slots.maxPrice <= 2500);
        items.push(`- 💰 Ilaa $${params.slots.maxPrice}${isRent ? "/bil" : ""}`);
      }
      if (params.slots?.bedrooms) {
        items.push(`- 🛏️ ${params.slots.bedrooms} qol`);
      }
      if (params.slots?.propertyType && params.slots.propertyType !== "HOUSE") {
        items.push(`- 🏠 ${params.slots.propertyType.toLowerCase()}`);
      }
      const itemsSummary = items.length > 0 ? items.join("\n") : "- 🏠 Property";

      let unrelatedNoteSo = "Qaybta casharka xisaabta waxay ka baxsan tahay adeegga Kiro-Maal.";
      if (msg.includes("bitcoin") || msg.includes("crypto")) {
        unrelatedNoteSo = "Qaybta bitcoin/crypto waxay ka baxsan tahay adeegga Kiro-Maal.";
      } else if (msg.includes("assignment")) {
        unrelatedNoteSo = "Qaybta assignment-ka waxay ka baxsan tahay adeegga Kiro-Maal.";
      } else if (!msg.includes("xisaab") && !msg.includes("cashar")) {
        unrelatedNoteSo = "Qaybta kale waxay ka baxsan tahay adeegga Kiro-Maal.";
      }

      if (lang === "so") {
        return `Waan kaa caawin karaa qaybta Real Estate-ka 👍\n\nWaxaad raadineysaa:\n${itemsSummary}\n\nWaxaan kuu raadin karaa properties ku habboon.\n\n${unrelatedNoteSo}`;
      }
      if (lang === "ar") {
        return `يمكنني مساعدتك في الجزء الخاص بالعقارات 👍\n\nأنت تبحث عن:\n${itemsSummary}\n\nيمكنني البحث لك عن عقارات مناسبة.\n\nأما بالنسبة للطلب الآخر فهو خارج نطاق خدمة كيرو-مال.`;
      }
      return `I can help with the Real Estate portion 👍\n\nYou are looking for:\n${itemsSummary}\n\nI can search for suitable properties for you.\n\nThe unrelated question is outside of Kiro-Maal's service.`;
    }

    case "SEARCH_RESULTS": {
      const count = params.totalMatches || (params.properties ? params.properties.length : 0);
      const city = params.slots?.city || "magaalada";
      const isRental = params.slots?.purpose === "RENT";
      const typeStr = isRental
        ? "guri kiro ah"
        : params.slots?.propertyType
        ? params.slots.propertyType.toLowerCase()
        : "guri";
      const beds = params.slots?.bedrooms ? `${params.slots.bedrooms} qol` : "";
      const price = params.slots?.maxPrice
        ? `ilaa $${params.slots.maxPrice.toLocaleString()}${params.slots?.pricePeriod === "month" ? " bishii" : ""}`
        : "";

      // Explainable match context for the top result (Master Specification Section 20, 59)
      const topProp = params.properties && params.properties[0];
      let matchExplanation = "";
      if (topProp) {
        if (lang === "so") {
          const reasons: string[] = [];
          if (topProp.price && params.slots?.maxPrice && topProp.price <= params.slots.maxPrice) {
            reasons.push("wuxuu ku jiraa budget-kaaga");
          }
          if (topProp.bedrooms) {
            reasons.push(`${topProp.bedrooms} qol ayuu leeyahay`);
          }
          if (topProp.city) {
            reasons.push(`${topProp.city} ayuu ku yaal`);
          }
          if (topProp.parking) {
            reasons.push("parking ayuu leeyahay");
          }
          if (reasons.length > 0) {
            matchExplanation = `\n\nKan 1aad (${topProp.title}) waxaan kuu soo jeediyay sababtoo ah:\n• ` + reasons.join("\n• ");
          }
        } else if (lang === "ar") {
          matchExplanation = `\n\nالعقار الأول (${topProp.title}) يناسب ميزانيتك وموقعك المطلوب تماماً.`;
        } else {
          matchExplanation = `\n\nI recommended Property #1 (${topProp.title}) because it aligns directly with your budget, bedroom count, and desired location.`;
        }
      }

      if (lang === "so") {
        const specSummary = [typeStr, `ku yaal ${city}`, beds, price].filter(Boolean).join(", ");
        return `Waayahay — waxaad raadineysaa ${specSummary}. Waxaan helay **${count} ${count === 1 ? "guri" : "guryo"}** oo shuruudahaas buuxinaya.${matchExplanation}\n\nKuwan ayaa ah kuwa ugu dhow waxa aad raadineyso:`;
      }
      if (lang === "ar") {
        const arBeds = params.slots?.bedrooms ? `${params.slots.bedrooms} غرف نوم` : "";
        const arPrice = params.slots?.maxPrice ? `بأقل من $${params.slots.maxPrice.toLocaleString()}` : "";
        const specSummary = [params.slots?.city ? `في ${params.slots.city}` : "", arBeds, arPrice].filter(Boolean).join("، ");
        return `وجدت **${count} ${count === 1 ? "عقار" : "عقارات"}** معتمدة ${specSummary ? `(${specSummary})` : ""} تطابق الشروط التي ذكرتها.${matchExplanation}\n\nإليك أفضل الخيارات:`;
      }
      if (lang === "sw") {
        return `Nimepata **${count} nyumba** zilizoidhinishwa huko ${city} zinazolingana na vigezo vyako.\n\nHizi hapa chaguzi zilizothibitishwa:`;
      }
      const enBeds = params.slots?.bedrooms ? `${params.slots.bedrooms} bedrooms` : "";
      const enPrice = params.slots?.maxPrice ? `under $${params.slots.maxPrice.toLocaleString()}` : "";
      const enSpecs = [enBeds, enPrice].filter(Boolean).join(", ");
      return `Understood — looking in **${params.slots?.city || "Somalia"}**${enSpecs ? ` (${enSpecs})` : ""}. I found **${count} approved properties** matching your requirements:${matchExplanation}\n\nHere are the verified listings from our active inventory:`;
    }

    case "ZERO_RESULTS": {
      const city = params.slots?.city || "magaalada aad dooratay";
      if (lang === "so") {
        if (params.slots?.city && !cityHasApprovedInventory(params.slots.city)) {
          return `Waxaan fahmay inaad ${city} ka raadinayso, laakiin hadda ma hayo guryo la ansixiyey oo halkaas ku jira. Haddii aad rabto, waxaan ka raadin karaa magaalo kale oo ay guryo ku jiraan.`;
        }
        return `Waxaan hubiyey guryaha ${city}, laakiin ma helin mid buuxinaya dhammaan shuruudahaas. Ma rabtaa inaan kordhiyo budget-ka, ama aan ka dhimo tirada qolalka?`;
      }
      if (lang === "ar") {
        if (params.slots?.city && !cityHasApprovedInventory(params.slots.city)) {
          return `بحثت في ${city}، لكن لا توجد حالياً عقارات معتمدة في هذه المدينة. إذا رغبت، يمكنني البحث في مدينة أخرى.`;
        }
        return `راجعت العقارات المعتمدة في ${city}، لكن لم أجد عقاراً يطابق كافة هذه الشروط. هل ترغب في رفع الميزانية أو تقليل عدد الغرف؟`;
      }
      if (lang === "sw") {
        return `Nimeangalia nyumba za ${city}, lakini hakuna inayotimiza vigezo hivyo vyote. Je, ungependa kurekebisha bajeti au idadi ya vyumba?`;
      }
      if (params.slots?.city && !cityHasApprovedInventory(params.slots.city)) {
        return `I understand you are looking in ${city}, but currently we have zero approved properties in that location. Would you like me to look in an adjacent city with available listings?`;
      }
      return `I checked our approved listings in ${city}, but found none strictly matching all those criteria. Would you like to adjust your budget or modify the bedroom requirement?`;
    }

    case "ORDINAL_DETAILS": {
      const p = params.referencedProperty;
      if (!p) return `Could not locate that referenced property in the recent result set.`;
      if (lang === "so") {
        return `**Xogta Guriga #${p.rank}: "${p.title}"**\n• **Goobta**: ${p.city}\n• **Qiimaha**: **$${p.price.toLocaleString()}**\n• **Qolalka**: ${p.bedrooms} qol | **Musqusha**: ${p.bathrooms}\n• **Bedka**: ${p.area} m²\n• **Baarkin**: ${p.parking ? "Haa" : "Maya"}\n• **Alaabta**: ${p.furnished ? "Guri qalabaysan" : "Aan qalabaysnayn"}\n\nMa jeclaan lahayd inaad ballansato booqasho ama aad ogaato qiimeyntiisa suuqa?`;
      }
      if (lang === "ar") {
        return `**تفاصيل العقار رقم #${p.rank}: "${p.title}"**\n• **المدينة**: ${p.city}\n• **السعر**: **$${p.price.toLocaleString()}**\n• **الغرف**: ${p.bedrooms} غرف نوم | **الحمامات**: ${p.bathrooms}\n• **المساحة**: ${p.area} م²\n• **موقف سيارات**: ${p.parking ? "متوفر" : "غير متوفر"}\n• **الفرش**: ${p.furnished ? "مفروش" : "غير مفروش"}\n\nهل ترغب في جدولة موعد زيارة أو معرفة التقييم السعري له؟`;
      }
      return `**Property #${p.rank} Specifications: "${p.title}"**\n• **City**: ${p.city}\n• **Price**: **$${p.price.toLocaleString()}**\n• **Bedrooms**: ${p.bedrooms} beds | **Bathrooms**: ${p.bathrooms} baths\n• **Area**: ${p.area} m²\n• **Parking**: ${p.parking ? "Available" : "No"}\n• **Furnished**: ${p.furnished ? "Yes" : "Unfurnished"}\n\nWould you like to schedule an in-person viewing or check its ML market appraisal?`;
    }

    case "CHEAPER_COMPARISON": {
      const p = params.referencedProperty;
      if (!p) return `No properties currently in comparison context.`;
      if (lang === "so") {
        return `Guryaha la soo bandhigay, **"${p.title}"** (Guri #${p.rank}) ayaa ugu jaban, qiimihiisuna waa **$${p.price.toLocaleString()}** (${p.bedrooms} qol oo ku yaal ${p.city}).`;
      }
      if (lang === "ar") {
        return `من بين العقارات المعروضة، **"${p.title}"** (العقار رقم #${p.rank}) هو الأرخص بسعر **$${p.price.toLocaleString()}** (${p.bedrooms} غرف نوم في ${p.city}).`;
      }
      return `Among the displayed options, **"${p.title}"** (Property #${p.rank}) is the most affordable at **$${p.price.toLocaleString()}** with ${p.bedrooms} bedrooms in ${p.city}.`;
    }

    case "SIDE_BY_SIDE_COMPARISON": {
      const a = params.comparedPropertyA;
      const b = params.comparedPropertyB;
      if (!a || !b) return `Please select two properties to compare.`;
      const diff = Math.abs(a.price - b.price);
      const cheaper = a.price < b.price ? a : b;
      if (lang === "so") {
        return `**Isbarbardhigga Guriga #${a.rank} iyo #${b.rank}:**\n• **#${a.rank} ${a.title}**: $${a.price.toLocaleString()} (${a.bedrooms} qol, ${a.area} m²)\n• **#${b.rank} ${b.title}**: $${b.price.toLocaleString()} (${b.bedrooms} qol, ${b.area} m²)\n\n**Farqiga Qiimaha**: Guriga #${cheaper.rank} ayaa ka jaban **$${diff.toLocaleString()}**.`;
      }
      if (lang === "ar") {
        return `**مقارنة بين العقار #${a.rank} والعقار #${b.rank}:**\n• **#${a.rank} ${a.title}**: $${a.price.toLocaleString()} (${a.bedrooms} غرف، ${a.area} م²)\n• **#${b.rank} ${b.title}**: $${b.price.toLocaleString()} (${b.bedrooms} غرف، ${b.area} م²)\n\n**الفارق السعري**: العقار #${cheaper.rank} أرخص بمقدار **$${diff.toLocaleString()}**.`;
      }
      return `**Side-by-Side Comparison (#${a.rank} vs #${b.rank}):**\n• **#${a.rank} ${a.title}**: $${a.price.toLocaleString()} (${a.bedrooms} beds, ${a.area} m²)\n• **#${b.rank} ${b.title}**: $${b.price.toLocaleString()} (${b.bedrooms} beds, ${b.area} m²)\n\n**Price Advantage**: Property #${cheaper.rank} is **$${diff.toLocaleString()} cheaper**.`;
    }

    case "SLOT_UPDATE": {
      const updateDesc = params.updatedSlot ? `${params.updatedSlot.name} = ${params.updatedSlot.value}` : "requirements";
      if (lang === "so") {
        return `Waa hagaag! Waxaan ilaalinayaa goobta iyo shuruudahaaga hore, waxaana cusboonaysiiyay (${updateDesc}). Halkan ka eeg natiijooyinka cusub:`;
      }
      if (lang === "ar") {
        return `تم التحديث بنجاح! تم الحفاظ على معاييرك وتعديل (${updateDesc}). إليك النتائج المحدثة:`;
      }
      return `Got it! I preserved your previous criteria while updating (${updateDesc}). Here are your refreshed results:`;
    }

    case "PRICE_VALUATION": {
      const v = params.valuationData;
      if (!v) return `Price intelligence calculated.`;
      if (lang === "so") {
        return `**Qiimeynta AI ee Hantidan**: Waxaa lagu qiyaasay **$${v.estimatedPrice.toLocaleString()}** (Inta u dhaxeysa: $${v.priceRange.lower.toLocaleString()} - $${v.priceRange.upper.toLocaleString()}).\n• Kalsoonida: ${v.confidence}%\n• Aragtida Suuqa: ${v.pricePosition || "Qiimo suuqeed caadi ah"}.`;
      }
      if (lang === "ar") {
        return `**التقييم الذكي للعقار**: القيمة التقديرية هي **$${v.estimatedPrice.toLocaleString()}** (النطاق السعري: $${v.priceRange.lower.toLocaleString()} - $${v.priceRange.upper.toLocaleString()}).\n• مستوى الثقة: ${v.confidence}%\n• وضع السعر في السوق: ${v.pricePosition || "سعر عادل"}.`;
      }
      return `**AI Property Appraisal**: Estimated fair market value is **$${v.estimatedPrice.toLocaleString()}** (Uncertainty Range: $${v.priceRange.lower.toLocaleString()} - $${v.priceRange.upper.toLocaleString()}).\n• Model Confidence: ${v.confidence}%\n• Market Position: ${v.pricePosition || "Fairly Priced"}.`;
    }

    case "TOPIC_SHIFT": {
      if (lang === "so") {
        return `Waa hagaag. Aynu ka hadalno su'aashaada cusub. Sideen kale kuugu caawin karaa?`;
      }
      if (lang === "ar") {
        return `بالتأكيد، لننتقل إلى موضوعك الجديد. كيف يمكنني مساعدتك؟`;
      }
      return `Sure, shifting topics. What would you like to know or explore next?`;
    }

    default:
      return `How can I help you with Somali real estate today?`;
  }
}
