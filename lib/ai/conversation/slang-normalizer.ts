/**
 * Conversational Slang, Abbreviations, Short-Forms & Dialect Normalizer
 *
 * Handles:
 * - Somali conversational short forms (asc, slm, wcs, sxb, wlhi, m.a, alx, alxmd)
 * - Religious & cultural expressions (insha allah, masha allah, alhamdulillah)
 * - Gratitude, affirmation, and casual markers (mahadsanid, thx, pls, ok, brb)
 * - Somali inflectional variants (ku yaal, ku yaalla, yaalo, baan rabaa, doonayaa)
 * - Arabic and English code-switching markers
 */

export interface SlangAnalysis {
  isGreeting: boolean;
  isGreetingResponse: boolean;
  isGratitude: boolean;
  isCasualAffirmation: boolean;
  hasInformalAddress: boolean; // e.g. "sxb"
  hasConversationalEmphasis: boolean; // e.g. "wlhi"
  hasReligiousPhrase: boolean; // e.g. "alx", "inshallah", "m.a"
  normalizedText: string;
}

// Slang Patterns (Case-insensitive)
const GREETING_SLANG = [
  /\b(asc|slm|salaam|salan|asalamu\s*calaykum|assalamu\s*alaikum|assalaamu\s*alaykum)\b/i,
  /\b(marxaba|marhaban|ahlan|soo\s*dhawoow)\b/i,
  /\b(hello|hi|hey|greetings|good\s*morning|good\s*afternoon|good\s*evening)\b/i,
];

const GREETING_RESPONSE_SLANG = [
  /\b(wcs|wa\s*calaykum\s*salaam|walaikum\s*assalam|wa\s*aleikum\s*salam)\b/i,
];

const GRATITUDE_SLANG = [
  /\b(mahadsanid|waad\s*mahadsantahay|thx|thanks|thank\s*you|shukran|chokran)\b/i,
];

const CASUAL_AFFIRMATION_SLANG = [
  /\b(ok|okay|haye|waayahay|waa\s*hagaag|sure|yes|haa|na'am|aywa)\b/i,
  /\b(pls|plz|fadlan|min\s*fadlak|please)\b/i,
  /\b(lol|brb)\b/i,
];

const SOMALI_ADDRESS_TERMS = [
  /\b(sxb|saaxiib|saaxiibkay|walaal|walal|abowe|abaayo|bro|brother|friend)\b/i,
];

const SOMALI_EMPHASIS_TERMS = [
  /\b(wlhi|wallahi|walahi|wallah|xaqiiqdii|runtii)\b/i,
];

const RELIGIOUS_EXPRESSIONS = [
  /\b(alx|alxmd|alhamdulillah|alxamdulilaah|alxamdullilaah)\b/i,
  /\b(m\.a|ma\s+sha\s+allah|masha\s*allah|mashallah)\b/i,
  /\b(insha\s*allah|inshallah|insha'allah)\b/i,
];

/**
 * Analyzes conversational tone and extracts cultural/slang nuances
 */
export function analyzeConversationalSlang(rawText: string): SlangAnalysis {
  const text = (rawText || "").trim();

  const isGreeting = GREETING_SLANG.some((r) => r.test(text));
  const isGreetingResponse = GREETING_RESPONSE_SLANG.some((r) => r.test(text));
  const isGratitude = GRATITUDE_SLANG.some((r) => r.test(text));
  const isCasualAffirmation = CASUAL_AFFIRMATION_SLANG.some((r) => r.test(text));
  const hasInformalAddress = SOMALI_ADDRESS_TERMS.some((r) => r.test(text));
  const hasConversationalEmphasis = SOMALI_EMPHASIS_TERMS.some((r) => r.test(text));
  const hasReligiousPhrase = RELIGIOUS_EXPRESSIONS.some((r) => r.test(text));

  return {
    isGreeting,
    isGreetingResponse,
    isGratitude,
    isCasualAffirmation,
    hasInformalAddress,
    hasConversationalEmphasis,
    hasReligiousPhrase,
    normalizedText: text,
  };
}

/**
 * Normalizes colloquial Somali location and query phrases into standard forms
 * for entity extraction without losing meaning
 */
export function normalizeSomaliQueryPhrase(input: string): string {
  let s = input;

  // 1. Location expressions normalization:
  // "guryo ku yaalo Muqdisho" -> "guryo Muqdisho ku yaal"
  // "magaalada Muqdisho" -> "Muqdisho"
  s = s.replace(/\bmagaalada\s+([a-zA-Z\u0600-\u06FF]+)/gi, "$1");
  s = s.replace(/\bku\s*(?:yaal|yaalla|yaalo|yaallaan)\s+([a-zA-Z\u0600-\u06FF]+)/gi, "$1 ku yaal");

  // 2. Intent verbs normalization:
  // "baan rabaa", "waxaan rabaa", "doonayaa", "waxaan doonayaa" -> "waxaan rabaa"
  s = s.replace(/\b(?:baan\s*rabaa|waxaan\s*rabaa|rabaa|waxaan\s*doonayaa|doonayaa|aan\s*rabaa)\b/gi, "waxaan rabaa");

  // 3. Bedroom normalization:
  // "qol jiif", "qolalka jiifka" -> "qol"
  s = s.replace(/\bqol(?:alka)?\s+jiif(?:ka)?\b/gi, "qol");

  // 4. Bathrooms:
  // "musqul", "musqulaha" -> "musqul"
  s = s.replace(/\bmusqulo|musqulaha\b/gi, "musqul");

  // 5. Parking:
  // "baabuur", "garaash" -> "parking"
  s = s.replace(/\b(?:garaash|baabuur|meel\s+baabuur)\b/gi, "parking");

  // 6. Price:
  // "miisaaniyadeydu", "miisaaniyad", "lacag" -> "budget"
  s = s.replace(/\b(?:miisaaniyadeydu|miisaaniyad(?:da)?|lacag(?:ta)?|qiimo|qiimaha)\b/gi, "budget");

  return s;
}
