/**
 * Conversational Language Manager & Multilingual Intelligence
 *
 * Tier 1: English (en), Somali (so), Arabic (ar), Mixed (mixed)
 * Tier 2: Swahili (sw), Amharic (am), Oromo (om), Tigrinya (ti)
 * Tier 3: French (fr), Spanish (es), German (de), Turkish (tr), etc.
 */

import { ExtendedLanguage } from "./types";
import { resolveLocation, cityHasApprovedInventory } from "../nlu/location-resolver";

// Unicode Script Detection
const ARABIC_SCRIPT_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const ETHIOPIC_SCRIPT_REGEX = /[\u1200-\u137F\u1380-\u139F\u2D80-\u2DDF]/;
const CYRILLIC_SCRIPT_REGEX = /[\u0400-\u04FF]/;
const CJK_SCRIPT_REGEX = /[\u4E00-\u9FFF\u3040-\u30FF]/;

// Tier 1 Vocabulary
const SOMALI_MARKERS = [
  /\b(asc|asalaamu calaykum|slm|salaam|wcs|wa calaykum salaam|sxb|saaxiib|wlhi|wallahi|alx|alxmd|alxamdulillah|mahadsanid|mahadsan|abaayo|abowe|walaal|haye|haye sxb|soomaali|fadlan|haa|maya|ok)\b/i,
  /\b(waxaan|waan|waxa|aan|doonayaa|rabaa|raadinayaa|rabnaa|doonaynaa|baahanahay|u baahanahay)\b/i,
  /\b(guri|guryo|guriga|guryaha|guryaal|aqal|dabaq|dabaqyo|qol|qolal|musqul|musqulo|jiko|kushiin)\b/i,
  /\b(leh|ku|yaal|yaalla|yaalo|oo|ah|u|dhow|fog|weyn|yar|cusub|casri|qadiim)\b/i,
  /\b(baarkin|xeeb|xeebta|badda|dayr|ilaalo|shamsi|solar)\b/i,
  /\b(iib|iibka|kiree|kiro|kirro|kirada|kireeyo|kireysto|kireysan|kiraysanayaa|aan kireysto|la kireeyo|la kireysto|bishii|bishiiba|sanadkii|qiimo|jaban|qaali|fursad|miisaaniyad|miisaaniyadaadu|miisaaniyaddaadu|miisaaniyadeydu|waa|intee|kun|malyan|doolar|dollar)\b/i,
  /\b(muqdisho|hargeysa|boosaaso|kismaayo|garoowe|baydhabo|berbera|caabudwaaq|abudwak|abudwaaq|gaalkacyo|galkayo|burco|burao|beledweyne|belet weyne|dhuusamareeb|dhusamareeb|samareeb|guriceel|cadaado|adado|laascaanood|las anod|boorama|borama|ceerigaabo|erigavo|qardho|doolow|dollow|baardheere|bardera|jowhar|afgooye|marka|hobyo)\b/i,
  /\b(midka|kan|ugu|horeeya|labaad|saddexaad|tusi|sheeg|midka kale)\b/i,
];

const ARABIC_MARKERS = [
  "أبحث", "ابحث", "أريد", "اريد", "منزل", "شقة", "فيلا", "بيت",
  "غرف", "غرفة", "نوم", "حمام", "مطبخ", "موقف", "سيارات", "شاطئ",
  "للبيع", "للإيجار", "للايجار", "مسبح", "حديقة", "مقديشو", "هرجيسا",
  "الأول", "الثاني", "الثالث", "الأرخص", "الأغلى", "كم", "سعر", "قارن"
];

// Tier 2 (East African) Vocabulary
const SWAHILI_MARKERS = [
  /\b(ninataka|nahitaji|natafuta|nyumba|chumba|vyumba|ghorofa|bei|rahisi)\b/i,
  /\b(katika|ya|kwa|chumbani|choo|bafu|uwanja|eneo|shilingi|dola)\b/i,
  /\b(ya kwanza|ya pili|ya tatu|gani|ngapi|kulinganisha|hiki|ile|zaidi)\b/i,
];

const AMHARIC_MARKERS = [
  "ቤት", "መኖሪያ", "ክፍል", "መኝታ", "ዋጋ", "ኪራይ", "ሽያጭ", "መግዛት", "መፈለግ",
  "አዲስ", "አበባ", "መኪና", "ማቆሚያ", "የመጀመሪያው", "ሁለተኛው", "ስንት"
];

const OROMO_MARKERS = [
  /\b(mana|barbaada|gurgurtaa|kireeffannaa|kutaa|gatii|magaalaa|jalqaba|lammaffaa)\b/i,
];

const TIGRINYA_MARKERS = [
  "ገዛ", "ክፍሊ", "ዋጋ", "መሸጣ", "ክራይ", "ቀዳማይ", "ካልኣይ", "ክንደይ"
];

// Tier 3 (Global) Vocabulary
const FRENCH_MARKERS = [
  /\b(je|veux|cherche|maison|appartement|chambre|chambres|prix|ville|combien|premier|deuxième)\b/i,
];

const SPANISH_MARKERS = [
  /\b(quiero|busco|casa|apartamento|habitaciones|precio|cuánto|primero|segundo|barato)\b/i,
];

const GERMAN_MARKERS = [
  /\b(ich|suche|brauche|haus|wohnung|zimmer|preis|wie|viel|erste|zweite|billiger)\b/i,
];

export interface LanguageDetectionDetails {
  language: ExtendedLanguage;
  confidence: number;
  isCodeSwitching: boolean;
  script: "Latn" | "Arab" | "Ethi" | "Cyrl" | "CJK" | "Mixed";
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
  if (lower.match(/\b(speak|talk|write|respond)\s+(in|to\s+me\s+in)\s+somali\b/i) ||
      lower.includes("af soomaali igu hadal") || lower.includes("af soomaali ku hadal") || lower.includes("soomaali ii qor")) {
    explicitPreference = "so";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(in|to\s+me\s+in)\s+english\b/i) ||
             lower.includes("ingiriisi ku hadal") || lower.includes("بالإنجليزي") || lower.includes("بالانجليزية")) {
    explicitPreference = "en";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(in|to\s+me\s+in)\s+arabic\b/i) ||
             lower.includes("تحدث معي بالعربية") || lower.includes("بالعربي") || lower.includes("carabi ku hadal")) {
    explicitPreference = "ar";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(in|to\s+me\s+in)\s+swahili\b/i) ||
             lower.includes("ongea kwa kiswahili")) {
    explicitPreference = "sw";
  } else if (lower.match(/\b(speak|talk|write|respond)\s+(in|to\s+me\s+in)\s+french\b/i) ||
             lower.includes("parle en français") || lower.includes("parle en francais")) {
    explicitPreference = "fr";
  }

  // 2. Script Analysis
  const hasArabic = ARABIC_SCRIPT_REGEX.test(normalized);
  const hasEthiopic = ETHIOPIC_SCRIPT_REGEX.test(normalized);
  const hasCyrillic = CYRILLIC_SCRIPT_REGEX.test(normalized);
  const hasCJK = CJK_SCRIPT_REGEX.test(normalized);

  if (hasArabic) {
    const arabicWords = ARABIC_MARKERS.filter(m => normalized.includes(m));
    const latinChars = (normalized.match(/[a-zA-Z]/g) || []).length;
    const arabicChars = (normalized.match(ARABIC_SCRIPT_REGEX) || []).length;
    const isCodeSwitching = latinChars > 2 && arabicChars > 2;

    return {
      language: isCodeSwitching ? "mixed" : "ar",
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

  if (hasCyrillic) {
    return { language: "ru", confidence: 0.90, isCodeSwitching: false, script: "Cyrl", explicitPreferenceDetected: explicitPreference };
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

  let frenchScore = 0;
  for (const pattern of FRENCH_MARKERS) {
    if (pattern.test(normalized)) frenchScore += 1;
  }

  let spanishScore = 0;
  for (const pattern of SPANISH_MARKERS) {
    if (pattern.test(normalized)) spanishScore += 1;
  }

  let englishScore = 0;
  const englishMatches = lower.match(/\b(i|want|need|looking|for|house|bedroom|villa|apartment|under|with|parking|in|cheaper|second|first|show|more|price)\b/g);
  if (englishMatches) {
    englishScore = englishMatches.length;
  }

  // Location resolver signal: Any Somali recognized city boosts Somali evidence when not clearly another language
  const loc = resolveLocation(normalized);
  if (loc && swahiliScore === 0 && englishScore === 0) {
    somaliScore += 1;
  }

  // 4. Strict Conversation Language Inheritance for Short Turns
  // Short messages (e.g. "caabudwaaq", "3", "80k", "haa", "maya", "kan labaad", "500 dollar bishii")
  // MUST inherit conversation language unless there is strong counter-language evidence (>= 2 distinct words)
  const tokenCount = normalized.split(/\s+/).filter(Boolean).length;
  const isShortMessage = normalized.length <= 35 || tokenCount <= 4;

  if (currentPreference && isShortMessage && englishScore < 2 && swahiliScore === 0 && explicitPreference === undefined) {
    // If user previously spoke Somali/Arabic/Swahili and this short message doesn't explicitly speak English:
    if (currentPreference === "so" || currentPreference === "ar" || currentPreference === "sw") {
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
      confidence: 0.85,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Oromo takes precedence if oromoScore >= somaliScore
  if (oromoScore > 0 && oromoScore >= somaliScore) {
    return {
      language: "om",
      confidence: 0.85,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // French takes precedence if frenchScore >= somaliScore
  if (frenchScore > 1 && frenchScore >= somaliScore) {
    return {
      language: "fr",
      confidence: 0.85,
      isCodeSwitching: false,
      script: "Latn",
      explicitPreferenceDetected: explicitPreference,
    };
  }

  // Spanish takes precedence if spanishScore >= somaliScore
  if (spanishScore > 1 && spanishScore >= somaliScore) {
    return {
      language: "es",
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
    | "TOPIC_SHIFT";
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
}): string {
  const lang = params.language;

  switch (params.templateType) {
    case "GREETING": {
      if (lang === "so") {
        return `Wa calaykum salaam! Soo dhawoow 😊 Maxaan kaa caawin karaa—guri raadis, qiime guri, mise xog ku saabsan property?`;
      }
      if (lang === "ar") {
        return `وعليكم السلام ورحمة الله وبركاته! أهلاً بك. كيف يمكنني مساعدتك اليوم في عقارات الصومال؟`;
      }
      if (lang === "sw") {
        return `Habari na karibu sana! Ninawezaje kukusaidia leo—kutafuta nyumba, kukadiria bei, au taarifa za majengo?`;
      }
      return `Hello and welcome! How can I assist you today—finding a property, checking price estimates, or general real estate advice?`;
    }

    case "CLARIFICATION": {
      if (params.clarificationQuestion) {
        return params.clarificationQuestion;
      }
      if (params.missingSlot === "city") {
        if (lang === "so") return `Waad heli kartaa. Magaalo noocee ah ayaad ka raadinaysaa?`;
        if (lang === "ar") return `بالتأكيد. في أي مدينة تبحث عن العقار؟`;
        return `Certainly. Which city are you looking to find a property in?`;
      }
      if (params.missingSlot === "budget") {
        const city = params.slots?.city || "halkaas";
        if (lang === "so") return `Waayahay. ${city} ayaad ka raadinaysaa. Miisaaniyaddaadu waa intee?`;
        if (lang === "ar") return `حسناً. تبحث في ${city}. كم هي ميزانيتك التقريبية؟`;
        return `Understood. Looking in ${city}. What is your target budget?`;
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
      const msg = (params.userMessage || "").toLowerCase();
      // Gratitude
      if (msg.includes("mahadsanid") || msg.includes("thanks") || msg.includes("thank you") || msg.includes("shukran")) {
        if (lang === "so") return `Adigaa mudan! Diyaar baan u ahay inaan kugu caawiyo wax kasta oo la xiriira guryaha.`;
        if (lang === "ar") return `على الرحب والسعة! أنا هنا لمساعدتك في أي وقت.`;
        return `You're very welcome! Let me know if you need anything else regarding properties.`;
      }
      // Villa explanation
      if (msg.includes("villa") || msg.includes("fiilo") || msg.includes("فيلا")) {
        if (lang === "so") return `Fiilo (Villa) waa guri weyn oo gaar ah, inta badan leh dayr u gooni ah, baarkin baabuur, beero yar, iyo qolal ballaaran oo loogu talagalay qoys.`;
        if (lang === "ar") return `الفيلا هي عقار سكني مستقل وواسع يضم عادة حديقة خاصة وموقف سيارات ومساحات رحبة تناسب العائلات.`;
        return `A villa is a spacious, standalone residential property often featuring private grounds, private parking, and luxury amenities suited for family living.`;
      }
      // Escrow / Buying check
      if (msg.includes("escrow") || msg.includes("buying") || msg.includes("check before") || msg.includes("iibsan") || msg.includes("shراء")) {
        if (lang === "so") return `Iibsashada guriga waxay u baahan tahay in la xaqiijiyo lahaanshaha sharciyeed, diiwaangelinta dowladda hoose, iyo isticmaalka nidaam sugan (escrow) oo lacagta haysa ilaa dukumiintiyada si rasmi ah lagugu wareejiyo.`;
        if (lang === "ar") return `شراء العقار يتطلب فحص صكوك الملكية والسجل العقاري المعتمد واستخدام حساب ضمان (Escrow) لحماية أموالك حتى اكتمال نقل الملكية.`;
        return `Before buying property, always verify the registered title deed with local municipal authorities, inspect the physical structure, and use an escrow arrangement to secure transaction funds.`;
      }
      // Rent vs Buy
      if (msg.includes("rent and buy") || msg.includes("iibka iyo kirada") || msg.includes("الإيجار والشراء")) {
        if (lang === "so") return `Kiradu (Rent) waa bixinta lacag bille ah oo aad ku degto guri adigoon lahayn, halka Iibku (Buy) yahay lahaansho buuxa oo joogto ah oo hantidaada noqonaya.`;
        if (lang === "ar") return `الإيجار يوفر سكناً مرناً بدفعات شهرية دون تملك، بينما الشراء يمنحك ملكية دائمة واستثماراً طويل الأجل.`;
        return `Renting provides flexible occupancy through recurring monthly payments, while buying grants permanent equity and legal ownership over the property.`;
      }
      // How are you
      if (msg.includes("how are you") || msg.includes("sidee tahay") || msg.includes("see tahay")) {
        if (lang === "so") return `Waan fiicanahay, alxamdullilaah! Sideen kuugu caawin karaa raadinta gurigaaga maanta?`;
        if (lang === "ar") return `أنا بخير، شكراً لسؤالك! كيف يمكنني مساعدتك في البحث العقاري اليوم؟`;
        return `I'm doing well, thank you! How can I assist you with your real estate search today?`;
      }
      // Default conversational reply
      if (lang === "so") return `Waan ku maqlayaa! Ma jeclaan lahayd inaan kuu raadiyo guri, kuu qiimeeyo hanti, mise waxaad qabtaa su'aal kale?`;
      if (lang === "ar") return `أهلاً بك! هل ترغب في البحث عن عقار، أو تقييم سعر السوق، أو لديك أي استفسار آخر؟`;
      return `I'm here to assist! Would you like me to find properties, check market valuations, or answer real estate questions?`;
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

      if (lang === "so") {
        const specSummary = [typeStr, `ku yaal ${city}`, beds, price].filter(Boolean).join(", ");
        return `Waayahay — waxaad raadineysaa ${specSummary}. Waxaan helay **${count} ${count === 1 ? "guri" : "guryo"}** oo shuruudahaas buuxinaya.\n\nKuwan ayaa ah kuwa ugu dhow waxa aad raadineyso:`;
      }
      if (lang === "ar") {
        const arBeds = params.slots?.bedrooms ? `${params.slots.bedrooms} غرف نوم` : "";
        const arPrice = params.slots?.maxPrice ? `بأقل من $${params.slots.maxPrice.toLocaleString()}` : "";
        const specSummary = [params.slots?.city ? `في ${params.slots.city}` : "", arBeds, arPrice].filter(Boolean).join("، ");
        return `وجدت **${count} ${count === 1 ? "عقار" : "عقارات"}** معتمدة ${specSummary ? `(${specSummary})` : ""} تطابق الشروط التي ذكرتها.\n\nإليك أفضل الخيارات:`;
      }
      if (lang === "sw") {
        return `Nimepata **${count} nyumba** zilizoidhinishwa huko ${city} zinazolingana na vigezo vyako.\n\nHizi hapa chaguzi zilizothibitishwa:`;
      }
      const enBeds = params.slots?.bedrooms ? `${params.slots.bedrooms} bedrooms` : "";
      const enPrice = params.slots?.maxPrice ? `under $${params.slots.maxPrice.toLocaleString()}` : "";
      const enSpecs = [enBeds, enPrice].filter(Boolean).join(", ");
      return `Understood — looking in **${params.slots?.city || "Somalia"}**${enSpecs ? ` (${enSpecs})` : ""}. I found **${count} approved properties** matching your requirements:\n\nHere are the verified listings from our active inventory:`;
    }

    case "ZERO_RESULTS": {
      const city = params.slots?.city || "magaalada aad dooratay";
      if (lang === "so") {
        if (params.slots?.city && !cityHasApprovedInventory(params.slots.city)) {
          return `Waxaan ka raadiyay ${city}, laakiin hadda ma helin guri la ansixiyey oo shuruudahaas buuxinaya. Haddii aad rabto, waxaan ka raadin karaa magaalo kale oo ay guryo ku jiraan.`;
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
        return `I searched in ${city}, but currently there are no approved listings available in that city. If you wish, I can search in another city with available inventory.`;
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
