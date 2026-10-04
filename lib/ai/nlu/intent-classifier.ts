/**
 * Multilingual Intent Classifier for Real Estate Queries
 *
 * Classifies queries across Somali, English, Arabic, and mixed-language inputs into:
 * - property_search: User seeking to find, buy, or rent properties matching criteria
 * - property_recommendation: User asking for suggested, trending, or best-value properties
 * - property_inquiry: Asking about specific property details, availability, or contact
 * - general_inquiry: Asking general market questions, legal/buying processes, fees
 * - unsupported: Chit-chat, greetings, off-topic requests, or malicious prompt injection
 */

export type QueryIntent =
  | "property_search"
  | "property_recommendation"
  | "property_inquiry"
  | "general_inquiry"
  | "unsupported";

export interface IntentClassificationResult {
  intent: QueryIntent;
  confidence: number;
  isSearchable: boolean;
  explanation: string;
  matchedSignals: string[];
}

// Patterns indicating explicit search intent across languages
const SEARCH_SIGNALS = [
  // Somali search / desire tokens
  /\b(waxaan|waan|waxa|aan)\s+(rabaa|doonayaa|raadinayaa|rabnaa|doonaynaa)\b/i,
  /\b(guri|guryo|dabaq|fiilo|villa|boos|dhul|qol|musqul|xafiis|dukaan)\b/i,
  /\b(iib|iibka|kiro|kirada|kiree|kireysto|gadasho)\b/i,
  /\b(muqdisho|hargeysa|boosaaso|kismaayo|garoowe|baydhabo|berbera)\b/i,
  /\b(dollar|doolar|kun|qiimo|jaban)\b/i,

  // English search signals
  /\b(looking\s+for|search|find|show\s+me|want|need|browse|list)\b/i,
  /\b(bedroom|bedrooms|bed|bds|bath|bathrooms|house|apartment|villa|condo|property|flat)\b/i,
  /\b(for\s+sale|for\s+rent|under|below|budget|cheap|luxury)\b/i,
  /\b(in\s+mogadishu|in\s+hargeisa|in\s+bosaso|in\s+kismayo)\b/i,

  // Arabic search signals
  /(أبحث|ابحث|أريد|اريد|أفتش|افتِش|أود|نبحث)\s*(عن|في)?/iu,
  /(منزل|شقة|فيلا|بيت|عقار|أرض|مكتب|محل|غرف|غرفة|حمام)/iu,
  /(للبيع|للإيجار|للايجار|شراء|استئجار|رخيص|فاخر)/iu,
  /(في\s+مقديشو|في\s+هرجيسا|في\s+بوساسو|في\s+كسمايو)/iu,
];

// Recommendation signals
const RECOMMENDATION_SIGNALS = [
  /\b(recommend|recommendation|suggestions?|best\s+(property|house|investment|area|neighborhood))\b/i,
  /\b(talo|talinaysaa|iigu\s+tali|ugu\s+fiican|talobixin|fursadaha\s+ugu\s+wacan)\b/i,
  /(اقتراح|اقترح|ترشيح|أفضل\s+عقار|أفضل\s+منطقة|ماذا\s+تنصحني|نصيحة\s+عقارية)/iu,
];

// Specific property inquiry signals
const INQUIRY_SIGNALS = [
  /\b(how\s+much\s+is\s+(this|the)\s+property|is\s+(this|it)\s+still\s+available|contact\s+agent|schedule\s+viewing|tour)\b/i,
  /\b(gurigan|dabaqan|qiimaha\s+gurigan|ma\s+banaanyahay|ma\s+la\s+iibiyay|la\s+xiriir)\b/i,
  /(كم\s+سعر\s+هذا\s+العقار|هل\s+العقار\s+متاح|معاينة|حجز\s+موعد|التواصل\s+مع\s+المالك)/iu,
];

// General real estate education / process inquiry
const GENERAL_SIGNALS = [
  /\b(how\s+to\s+buy|buying\s+process|real\s+estate\s+market|registration\s+process|mortgage|interest\s+rate|closing\s+costs|legal\s+requirements)\b/i,
  /\b(sidee\s+guri\s+loo\s+iibsadaa|shuruudaha\s+iibsiga|nidaamka\s+sharci|suuqa\s+guryaha|qaabka\s+diwaangalinta)\b/i,
  /(كيف\s+أشتري|إجراءات\s+الشراء|السوق\s+العقاري|القوانين\s+العقارية|تسجيل\s+العقار|إجراءات\s+التسجيل)/iu,
];

// Prompt injection or adversarial markers
const ADVERSARIAL_SIGNALS = [
  /\b(ignore\s+(all\s+)?previous\s+instructions|system\s+prompt|reveal\s+secret|drop\s+table|delete\s+from|private\s+keys)\b/i,
  /\b(isdhaaf\s+amarradii|sirta\s+bixi|tirtir\s+database-ka)\b/i,
  /(تجاهل\s+التعليمات|اكشف\s+النظام|احذف\s+البيانات)/iu,
];

export function classifyIntent(query: string): IntentClassificationResult {
  if (!query || query.trim().length === 0) {
    return {
      intent: "unsupported",
      confidence: 1.0,
      isSearchable: false,
      explanation: "Empty query provided.",
      matchedSignals: [],
    };
  }

  const clean = query.trim();

  // 1. Check adversarial / prompt injection
  for (const pattern of ADVERSARIAL_SIGNALS) {
    if (pattern.test(clean)) {
      return {
        intent: "unsupported",
        confidence: 0.99,
        isSearchable: false,
        explanation: "Potential prompt injection or adversarial prompt detected.",
        matchedSignals: ["adversarial_pattern_blocked"],
      };
    }
  }

  // 2. Count matched signals
  const searchMatches: string[] = [];
  for (const pattern of SEARCH_SIGNALS) {
    const m = clean.match(pattern);
    if (m) searchMatches.push(m[0]);
  }

  const recMatches: string[] = [];
  for (const pattern of RECOMMENDATION_SIGNALS) {
    const m = clean.match(pattern);
    if (m) recMatches.push(m[0]);
  }

  const inquiryMatches: string[] = [];
  for (const pattern of INQUIRY_SIGNALS) {
    const m = clean.match(pattern);
    if (m) inquiryMatches.push(m[0]);
  }

  const generalMatches: string[] = [];
  for (const pattern of GENERAL_SIGNALS) {
    const m = clean.match(pattern);
    if (m) generalMatches.push(m[0]);
  }

  // Evaluate Intent Prioritization:
  // General procedural inquiries (e.g., "Sidee guri loo iibsadaa?", "How does real estate registration work?")
  // should take precedence if matched without hard price/bedroom search constraints
  const hasHardConstraintIndicators = /\b(\$\d+|under|below|ka yar|أقل من|\d+\s*qol|\d+\s*bedroom|\d+\s*bed)\b/i.test(clean);

  if (generalMatches.length > 0 && !hasHardConstraintIndicators) {
    return {
      intent: "general_inquiry",
      confidence: 0.92,
      isSearchable: false,
      explanation: "User is asking a general real estate market or legal procedural question.",
      matchedSignals: generalMatches,
    };
  }

  if (recMatches.length > 0 && !hasHardConstraintIndicators) {
    return {
      intent: "property_recommendation",
      confidence: 0.88,
      isSearchable: true,
      explanation: "User is asking for property recommendations or market suggestions.",
      matchedSignals: recMatches,
    };
  }

  if (inquiryMatches.length > 0 && searchMatches.length <= 1) {
    return {
      intent: "property_inquiry",
      confidence: 0.85,
      isSearchable: false,
      explanation: "User is asking about a specific property's status, price, or booking.",
      matchedSignals: inquiryMatches,
    };
  }

  // If there are search signals or specific property entities
  if (searchMatches.length > 0) {
    const confidence = Math.min(0.98, 0.6 + searchMatches.length * 0.1);
    return {
      intent: "property_search",
      confidence,
      isSearchable: true,
      explanation: "Natural language query contains property search criteria and constraints.",
      matchedSignals: searchMatches,
    };
  }

  // Chit-chat / Greetings / Very short generic queries
  if (clean.length < 15 && /^(hi|hello|hey|salaam|asc|marxaba|ahlan|test)\b/i.test(clean)) {
    return {
      intent: "unsupported",
      confidence: 0.95,
      isSearchable: false,
      explanation: "Query is a greeting or casual conversational message.",
      matchedSignals: ["greeting"],
    };
  }

  // Fallback for semantic retrieval
  return {
    intent: "property_search",
    confidence: 0.5,
    isSearchable: true,
    explanation: "General search query fallback for semantic retrieval.",
    matchedSignals: [],
  };
}
