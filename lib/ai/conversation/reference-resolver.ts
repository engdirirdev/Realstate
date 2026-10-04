/**
 * Conversational Reference Resolver
 *
 * Resolves:
 * - Ordinal references ("the first one", "number 2", "kan labaad", "الأول", "ya pili")
 * - Comparative references ("the cheaper one", "which one is cheaper", "الأرخص")
 * - Multi-property comparisons ("compare the first and third", "compare 1 and 2")
 * - Attribute inquiries on referenced properties ("how many bedrooms does it have?", "how much is it?")
 * - Similarity anchors ("show me similar ones to the second property")
 */

import { ReferenceResolution, ResultItem } from "./types";

const ORDINAL_MAP: { pattern: RegExp; rank: number }[] = [
  // 1st
  { pattern: /\b(first(\s*one)?|1st|number\s*(1|one)|#1|top\s*one|(?:kan|kii|midka)\s*(?:ugu\s*)?(?:koowaad|hore|horeeya|horeeyey|1aad)|ugu\s*(?:horeeya|horeeyey)|al-awwal|الأول|kwanza)\b/i, rank: 1 },
  // 2nd
  { pattern: /\b(second(\s*one)?|2nd|number\s*(2|two)|#2|(?:kan|kii|midka)\s*(?:labaad|2aad)|al-thani|الثاني|pili)\b/i, rank: 2 },
  // 3rd
  { pattern: /\b(third(\s*one)?|3rd|number\s*(3|three)|#3|(?:kan|kii|midka)\s*(?:saddexaad|3aad)|al-thalith|الثالث|tatu)\b/i, rank: 3 },
  // 4th
  { pattern: /\b(fourth(\s*one)?|4th|number\s*(4|four)|#4|(?:kan|kii|midka)\s*(?:afraad|4aad)|al-rabi|الرابع|nne)\b/i, rank: 4 },
  // 5th
  { pattern: /\b(fifth(\s*one)?|5th|number\s*(5|five)|#5|(?:kan|kii|midka)\s*(?:shanaad|5aad)|al-khamis|الخامس|tano)\b/i, rank: 5 },
];

/**
 * Resolves conversational references against the active result set
 */
export function resolveConversationalReference(
  message: string,
  activeResultSet: ResultItem[],
  previousReferencedProperty?: ResultItem
): ReferenceResolution {
  const text = message.trim().toLowerCase();

  if (!activeResultSet || activeResultSet.length === 0) {
    return {
      type: "NONE",
      explanation: "No active property result set in conversational memory.",
    };
  }

  // 1. Multi-Property Comparison ("compare 1 and 2", "compare the first and third", "labadan kee jaban", "labadan kee fiican")
  const isComparisonQuery =
    text.includes("compare") ||
    text.includes("barbar dhig") ||
    text.includes("قارن") ||
    text.includes("kulinganisha") ||
    /\b(labadan\s+kee|labadaan\s+kee|kan\s+iyo\s+kii\s+hore|labadan|labadaan)\b/i.test(text);

  if (isComparisonQuery) {
    const matchedRanks: number[] = [];
    for (const ord of ORDINAL_MAP) {
      if (ord.pattern.test(text)) {
        matchedRanks.push(ord.rank);
      }
    }

    if (matchedRanks.length >= 2) {
      const pA = activeResultSet.find((p) => p.rank === matchedRanks[0]);
      const pB = activeResultSet.find((p) => p.rank === matchedRanks[1]);
      if (pA && pB) {
        return {
          type: "COMPARISON",
          targetProperty: pA,
          comparedProperties: [pA, pB],
          explanation: `Resolved comparison request between Property #${pA.rank} and Property #${pB.rank}.`,
        };
      }
    } else if (activeResultSet.length >= 2) {
      // Default dual comparison for "labadan kee jaban", "labadan kee fiican", "kan iyo kii hore"
      const pA = activeResultSet[0];
      const pB = activeResultSet[1];
      return {
        type: "COMPARISON",
        targetProperty: pA,
        comparedProperties: [pA, pB],
        explanation: `Resolved dual comparison between Property #${pA.rank} and Property #${pB.rank}.`,
      };
    }
  }

  // 2. Comparative Inquiries ("which one is cheaper?", "the cheaper one", "cheapest", "kan ugu jaban", "الأرخص")
  const isSearchCheaper =
    /\b(find|search|show|show me|ii raadi|raadi|i tus|keen|ابحث|اعرض)\b/i.test(text);

  const isCheaperQuery =
    !isSearchCheaper &&
    (text.includes("cheaper") ||
    text.includes("cheapest") ||
    text.includes("ka jaban") ||
    text.includes("ugu jaban") ||
    text.includes("الأرخص") ||
    text.includes("rahisi zaidi"));

  if (isCheaperQuery) {
    const sortedByPrice = [...activeResultSet].sort((a, b) => a.price - b.price);
    const cheapest = sortedByPrice[0];
    return {
      type: "COMPARATIVE",
      targetRank: cheapest.rank,
      targetProperty: cheapest,
      attributeQueried: "price",
      explanation: `Resolved comparative reference: Property #${cheapest.rank} is the cheapest at $${cheapest.price.toLocaleString()}.`,
    };
  }

  // 3. Most Expensive Inquiries ("most expensive", "qaalisan", "الأغلى")
  const isExpensiveQuery =
    text.includes("most expensive") ||
    text.includes("highest price") ||
    text.includes("ugu qaalisan") ||
    text.includes("الأغلى");

  if (isExpensiveQuery) {
    const sortedByPrice = [...activeResultSet].sort((a, b) => b.price - a.price);
    const expensive = sortedByPrice[0];
    return {
      type: "COMPARATIVE",
      targetRank: expensive.rank,
      targetProperty: expensive,
      attributeQueried: "price",
      explanation: `Resolved comparative reference: Property #${expensive.rank} is the most expensive at $${expensive.price.toLocaleString()}.`,
    };
  }

  // 4. Similarity Anchor ("similar ones to the second one", "show me similar ones")
  const isSimilarityQuery =
    text.includes("similar") ||
    text.includes("like this") ||
    text.includes("wax u eg") ||
    text.includes("مشابه") ||
    text.includes("inayofanana");

  if (isSimilarityQuery) {
    let target = previousReferencedProperty || activeResultSet[0];
    for (const ord of ORDINAL_MAP) {
      if (ord.pattern.test(text)) {
        const found = activeResultSet.find((p) => p.rank === ord.rank);
        if (found) target = found;
        break;
      }
    }
    return {
      type: "SIMILARITY",
      targetRank: target.rank,
      targetProperty: target,
      explanation: `Resolved similarity anchor to Property #${target.rank} ("${target.title}").`,
    };
  }

  // 5. Specific Ordinal Matching ("the second one", "tell me about #3", "kii labaad")
  for (const ord of ORDINAL_MAP) {
    if (ord.pattern.test(text)) {
      const target = activeResultSet.find((p) => p.rank === ord.rank);
      if (target) {
        // Detect attribute questioned
        let attr: "price" | "bedrooms" | "bathrooms" | "area" | "status" | "location" | "parking" | "furnished" | "all" = "all";
        if (text.includes("parking") || text.includes("baarkin") || text.includes("garaash") || text.includes("موقف")) {
          attr = "parking";
        } else if (text.includes("furnish") || text.includes("alaab") || text.includes("qalab") || text.includes("مفروش")) {
          attr = "furnished";
        } else if (text.includes("price") || text.includes("cost") || text.includes("qiimo") || text.includes("qiimihiisu") || text.includes("سعر") || text.includes("bei")) {
          attr = "price";
        } else if (text.includes("bed") || text.includes("qol") || text.includes("غرف") || text.includes("vyumba")) {
          attr = "bedrooms";
        } else if (text.includes("bath") || text.includes("musqul") || text.includes("حمام")) {
          attr = "bathrooms";
        } else if (text.includes("area") || text.includes("size") || text.includes("bedka") || text.includes("مساحة")) {
          attr = "area";
        } else if (text.includes("location") || text.includes("halkee") || text.includes("meesha") || text.includes("xaafad") || text.includes("موقع")) {
          attr = "location";
        }

        return {
          type: "ORDINAL",
          targetRank: target.rank,
          targetProperty: target,
          attributeQueried: attr,
          explanation: `Resolved ordinal reference #${target.rank}: "${target.title}".`,
        };
      } else if (activeResultSet.length > 0) {
        return {
          type: "ORDINAL",
          targetRank: ord.rank,
          targetProperty: null as any,
          attributeQueried: "all",
          explanation: `Ordinal reference #${ord.rank} is out of bounds (only ${activeResultSet.length} properties available).`,
        };
      }
    }
  }

  // 6. Pronoun Reference to Previous Single Property ("how many bedrooms does it have?", "is it furnished?", "can i buy it?", "parking?", "qiimihiisu?", "bedrooms?", "bathrooms?", "price?", "location?", "availability?")
  const isDirectAttributeQuery =
    previousReferencedProperty &&
    (text.match(/\b(parking\??|baarkin\??|furnished\??|alaab\??|qiimaha\??|qiimihiisu\??|price\??|bedrooms?\??|qolal?\??|bathrooms?\??|musqul\??|location\??|availability\??|ma\s+bannaan\s+yahay\??)\b/i) ||
     text.includes("parking ma leeyahay") || text.includes("ma furnished baa") || text.includes("ma leeyahay parking") ||
     text.includes("ma bannaan yahay") || text.includes("meesha ay ku taal") || text.includes("intee qol"));

  const isPronounQuery =
    ((text.includes("it") || text.includes("that one") || text.includes("that property") || text.includes("that house") ||
      text.includes("this property") || text.includes("this house") || text.includes("the property") || text.includes("the house") ||
      text.includes("kan") || text.includes("kaas") || text.includes("ذلك") || text.includes("هذا") || text.includes("hiki")) &&
     previousReferencedProperty) || isDirectAttributeQuery;

  if (isPronounQuery && previousReferencedProperty) {
    let attr: "price" | "bedrooms" | "bathrooms" | "area" | "status" | "location" | "parking" | "furnished" | "all" = "all";
    if (text.includes("parking") || text.includes("baarkin") || text.includes("garaash") || text.includes("موقف")) attr = "parking";
    else if (text.includes("furnish") || text.includes("alaab") || text.includes("qalab") || text.includes("مفروش")) attr = "furnished";
    else if (text.includes("bed") || text.includes("qol") || text.includes("غرف")) attr = "bedrooms";
    else if (text.includes("bath") || text.includes("musqul") || text.includes("حمامات") || text.includes("حمام")) attr = "bathrooms";
    else if (text.includes("price") || text.includes("cost") || text.includes("qiimo") || text.includes("qiimihiisu") || text.includes("سعر")) attr = "price";
    else if (text.includes("location") || text.includes("halkee") || text.includes("meesha") || text.includes("xaafad") || text.includes("موقع")) attr = "location";
    else if (text.includes("availab") || text.includes("bannaan") || text.includes("diyaar")) attr = "status";

    return {
      type: "PRONOUN",
      targetRank: previousReferencedProperty.rank,
      targetProperty: previousReferencedProperty,
      attributeQueried: attr,
      explanation: `Resolved pronoun reference to previously focused Property #${previousReferencedProperty.rank} ("${previousReferencedProperty.title}").`,
    };
  }

  return {
    type: "NONE",
    explanation: "No entity reference detected in query.",
  };
}
