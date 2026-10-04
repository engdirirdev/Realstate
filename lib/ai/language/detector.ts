/**
 * Lightweight Multilingual Query Language Detector
 *
 * Detects languages: Somali (so), Arabic (ar), English (en), and Mixed.
 * Provides script analysis, detected language confidence, and matched concept tokens.
 *
 * Note: Language detection does NOT block search if uncertain; the underlying
 * multilingual embedding model maps all languages into the same semantic vector space.
 */

export type SupportedLanguage = "so" | "ar" | "en" | "mixed" | "unknown";

export interface LanguageDetectionResult {
  language: SupportedLanguage;
  confidence: number; // 0.0 to 1.0
  script: "Latn" | "Arab" | "Mixed";
  detectedKeywords: string[];
  isMultilingualQuery: boolean;
}

// Common Somali stopwords, real-estate nouns, prepositions and query phrases
const SOMALI_PATTERNS = [
  // Intent & pronouns
  /\b(waxaan|waan|waxa|aan|doonayaa|rabaa|raadinayaa|rabnaa|doonaynaa)\b/i,
  // Property nouns & plurals
  /\b(guri|guryo|guriga|qol|qolal|qolalka|musqul|musqulo|jiko|kushiin)\b/i,
  // Attributes & prepositions
  /\b(leh|ku|yaal|yaalla|oo|ah|u|dhow|fog|weyn|yar|cusub|qadiim)\b/i,
  // Amenities & features
  /\b(baarkin|parking|xeeb|xeebta|badda|dabaal|beero|dayr|ilaalo|shamsi|solar)\b/i,
  // Commercial & transactions
  /\b(iib|iibka|kiree|kiro|kirada|qiimo|jaban|qaali|fursad)\b/i,
  // Cities & regions
  /\b(muqdisho|hargeysa|boosaaso|bosaso|kismaayo|kismayo|garoowe|garowe|baydhabo|berbera)\b/i,
  // Numbers in Somali
  /\b(hal|kow|laba|saddex|afar|shan|lix|toddoba|sideed|sagaal|toban)\b/i,
];

// Common Arabic patterns (Unicode block \u0600-\u06FF)
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ARABIC_KEYWORDS = [
  "أبحث", "ابحث", "أريد", "اريد", "منزل", "شقة", "فيلا", "بيت",
  "غرف", "غرفة", "نوم", "حمام", "مطبخ", "موقف", "سيارات", "شاطئ",
  "بحر", "طاقة", "شمسية", "للبيع", "للإيجار", "للايجار", "مسبح",
  "حديقة", "مقديشو", "هرجيسا", "بوساسو", "كسمايو", "بربرة"
];

// Common English patterns
const ENGLISH_PATTERNS = [
  /\b(i|we|want|need|looking|searching|find|show|give|me)\b/i,
  /\b(house|home|apartment|flat|villa|townhouse|studio|office|commercial|land)\b/i,
  /\b(bedroom|bedrooms|bed|bds|bath|bathroom|bathrooms|baths)\b/i,
  /\b(with|near|close|to|beach|ocean|sea|pool|garden|parking|solar|furnished)\b/i,
  /\b(for|sale|rent|cheap|luxury|budget|modern|spacious)\b/i,
];

/**
 * Detects the language of a real-estate search query.
 */
export function detectQueryLanguage(text: string): LanguageDetectionResult {
  if (!text || text.trim().length === 0) {
    return {
      language: "unknown",
      confidence: 0,
      script: "Latn",
      detectedKeywords: [],
      isMultilingualQuery: false,
    };
  }

  const normalized = text.trim();
  const matchedTokens: string[] = [];

  // 1. Check for Arabic Script
  const hasArabicChars = ARABIC_SCRIPT_REGEX.test(normalized);
  const arabicMatches = ARABIC_KEYWORDS.filter((kw) => normalized.includes(kw));

  // Count character percentages
  let arabicCharCount = 0;
  let latinCharCount = 0;
  for (const char of normalized) {
    if (ARABIC_SCRIPT_REGEX.test(char)) arabicCharCount++;
    else if (/[a-zA-Z]/.test(char)) latinCharCount++;
  }

  const totalAlpha = arabicCharCount + latinCharCount;
  const isArabicDominant = totalAlpha > 0 && arabicCharCount / totalAlpha >= 0.5;

  if (hasArabicChars && isArabicDominant) {
    return {
      language: "ar",
      confidence: Math.min(1.0, 0.7 + arabicMatches.length * 0.1),
      script: "Arab",
      detectedKeywords: arabicMatches,
      isMultilingualQuery: latinCharCount > 0,
    };
  }

  // 2. Score Somali Patterns
  let somaliScore = 0;
  for (const pattern of SOMALI_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      somaliScore++;
      matchedTokens.push(match[0].toLowerCase());
    }
  }

  // 3. Score English Patterns
  let englishScore = 0;
  for (const pattern of ENGLISH_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      englishScore++;
      matchedTokens.push(match[0].toLowerCase());
    }
  }

  // 4. Determine Primary & Mixed Language
  const hasSomali = somaliScore > 0;
  const hasEnglish = englishScore > 0;
  const isMixed = (hasSomali && hasEnglish) || (hasArabicChars && latinCharCount > 0);

  if (isMixed && somaliScore >= 1 && englishScore >= 1) {
    return {
      language: "mixed",
      confidence: 0.85,
      script: hasArabicChars ? "Mixed" : "Latn",
      detectedKeywords: matchedTokens,
      isMultilingualQuery: true,
    };
  }

  if (somaliScore > englishScore) {
    const confidence = Math.min(0.95, 0.5 + somaliScore * 0.15);
    return {
      language: "so",
      confidence,
      script: "Latn",
      detectedKeywords: matchedTokens,
      isMultilingualQuery: false,
    };
  }

  if (englishScore > somaliScore) {
    const confidence = Math.min(0.95, 0.5 + englishScore * 0.15);
    return {
      language: "en",
      confidence,
      script: "Latn",
      detectedKeywords: matchedTokens,
      isMultilingualQuery: false,
    };
  }

  // If equal or low tokens, fallback gracefully
  return {
    language: somaliScore > 0 ? "so" : "en",
    confidence: 0.4,
    script: hasArabicChars ? "Arab" : "Latn",
    detectedKeywords: matchedTokens,
    isMultilingualQuery: false,
  };
}
