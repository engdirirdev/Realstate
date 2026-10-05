/**
 * AI Consensus & Confidence Resolver
 *
 * Resolves interpretations from OpenAI and Google Gemini:
 * 1. Agreement: Combines and strengthens confidence when providers agree.
 * 2. Confidence-Weighted Resolution: If one provider has high confidence (>0.85)
 *    and the other has low confidence (<0.70), the high-confidence interpretation wins.
 * 3. Close Disagreement Safeguard: If both providers disagree with similar confidence
 *    (e.g., 0.74 vs 0.76), DOES NOT silently guess; triggers a natural clarification question.
 * 4. Graceful Degradation: If one provider fails or times out, seamlessly proceeds
 *    with the single available provider.
 */

import {
  AIStructuredUnderstanding,
  AIUnderstandingResult,
} from "../providers/ai-provider";
import { ExtendedLanguage } from "../conversation/types";

export interface ResolvedConsensus {
  understanding: AIStructuredUnderstanding;
  agreementStatus: "FULL_AGREEMENT" | "CONFIDENCE_WINNER" | "CLOSE_DISAGREEMENT" | "SINGLE_PROVIDER" | "ALL_FAILED";
  primaryProvider?: "openai" | "gemini";
  confidenceDelta: number;
  clarificationRequired: boolean;
  clarificationQuestion?: string;
  combinedConfidence: number;
}

export function resolveAIConsensus(
  openAIResult: AIUnderstandingResult | null,
  geminiResult: AIUnderstandingResult | null,
  preferredLanguage: ExtendedLanguage = "so"
): ResolvedConsensus {
  const openAISuccess = openAIResult?.success && openAIResult.understanding;
  const geminiSuccess = geminiResult?.success && geminiResult.understanding;

  // Case 1: Both providers failed or neither configured
  if (!openAISuccess && !geminiSuccess) {
    return {
      understanding: {
        intent: "REAL_ESTATE_SEARCH",
        confidence: 0.0,
        language: preferredLanguage,
        domain: "REAL_ESTATE",
        entities: {
          city: null,
          district: null,
          propertyType: null,
          listingType: null,
          bedrooms: null,
          bathrooms: null,
          budget: null,
          currency: null,
          furnished: null,
          parking: null,
        },
        reference: null,
        requestedAttribute: null,
        correction: null,
        pendingSlotAnswer: null,
        needsClarification: false,
        clarificationReason: null,
      },
      agreementStatus: "ALL_FAILED",
      confidenceDelta: 0,
      clarificationRequired: false,
      combinedConfidence: 0.0,
    };
  }

  // Case 2: Only OpenAI succeeded
  if (openAISuccess && !geminiSuccess) {
    return {
      understanding: openAIResult.understanding,
      agreementStatus: "SINGLE_PROVIDER",
      primaryProvider: "openai",
      confidenceDelta: 0,
      clarificationRequired: openAIResult.understanding.needsClarification,
      clarificationQuestion: openAIResult.understanding.clarificationReason || undefined,
      combinedConfidence: openAIResult.understanding.confidence,
    };
  }

  // Case 3: Only Gemini succeeded
  if (!openAISuccess && geminiSuccess) {
    return {
      understanding: geminiResult.understanding,
      agreementStatus: "SINGLE_PROVIDER",
      primaryProvider: "gemini",
      confidenceDelta: 0,
      clarificationRequired: geminiResult.understanding.needsClarification,
      clarificationQuestion: geminiResult.understanding.clarificationReason || undefined,
      combinedConfidence: geminiResult.understanding.confidence,
    };
  }

  // Case 4: Both providers succeeded — Evaluate consensus
  const oai = openAIResult!.understanding;
  const gem = geminiResult!.understanding;

  const oaiConf = oai.confidence || 0.5;
  const gemConf = gem.confidence || 0.5;
  const confidenceDelta = Math.abs(oaiConf - gemConf);

  // Check critical entity agreement (city, district, budget, bedrooms)
  const oaiCity = oai.entities.city?.toLowerCase().trim() || null;
  const gemCity = gem.entities.city?.toLowerCase().trim() || null;
  const citiesDisagree = Boolean(oaiCity && gemCity && oaiCity !== gemCity);

  const intentsAgree = oai.intent === gem.intent;
  const domainsAgree = oai.domain === gem.domain;

  // 4A: Check for close disagreement on critical attributes (e.g. City: Mogadishu 0.74 vs Hargeisa 0.76)
  if (citiesDisagree) {
    // If confidence is very close (delta < 0.20), DO NOT GUESS SILENTLY. Ask clarification!
    if (confidenceDelta < 0.20) {
      const cityA = oai.entities.city!;
      const cityB = gem.entities.city!;
      const question =
        preferredLanguage === "so"
          ? `Magaalada ma ${cityA} ayaad ula jeeddaa mise ${cityB}?`
          : preferredLanguage === "ar"
          ? `هل تقصد مدينة ${cityA} أم ${cityB}؟`
          : `Did you mean ${cityA} or ${cityB} for the city?`;

      return {
        understanding: {
          ...oai,
          intent: "CLARIFICATION_REQUEST",
          confidence: Math.max(oaiConf, gemConf),
          needsClarification: true,
          clarificationReason: question,
        },
        agreementStatus: "CLOSE_DISAGREEMENT",
        confidenceDelta,
        clarificationRequired: true,
        clarificationQuestion: question,
        combinedConfidence: Math.max(oaiConf, gemConf),
      };
    }

    // High confidence difference (>0.20): Higher confidence provider wins
    const winner = oaiConf > gemConf ? oai : gem;
    const winnerProvider = oaiConf > gemConf ? "openai" : "gemini";
    return {
      understanding: winner,
      agreementStatus: "CONFIDENCE_WINNER",
      primaryProvider: winnerProvider,
      confidenceDelta,
      clarificationRequired: winner.needsClarification,
      clarificationQuestion: winner.clarificationReason || undefined,
      combinedConfidence: Math.max(oaiConf, gemConf),
    };
  }

  // 4B: Intent & Domain Evaluation
  if (intentsAgree && domainsAgree) {
    // Merge entities cleanly (prefer non-null)
    const mergedEntities = {
      city: oai.entities.city || gem.entities.city || null,
      district: oai.entities.district || gem.entities.district || null,
      propertyType: oai.entities.propertyType || gem.entities.propertyType || null,
      listingType: oai.entities.listingType || gem.entities.listingType || null,
      bedrooms: oai.entities.bedrooms ?? gem.entities.bedrooms ?? null,
      bathrooms: oai.entities.bathrooms ?? gem.entities.bathrooms ?? null,
      budget: oai.entities.budget ?? gem.entities.budget ?? null,
      currency: oai.entities.currency || gem.entities.currency || null,
      furnished: oai.entities.furnished ?? gem.entities.furnished ?? null,
      parking: oai.entities.parking ?? gem.entities.parking ?? null,
    };

    const combinedConfidence = Math.min(1.0, (oaiConf + gemConf) / 2 + 0.05);

    return {
      understanding: {
        ...oai,
        confidence: combinedConfidence,
        entities: mergedEntities,
        reference: oai.reference || gem.reference || null,
        requestedAttribute: oai.requestedAttribute || gem.requestedAttribute || null,
        correction: oai.correction || gem.correction || null,
        pendingSlotAnswer: oai.pendingSlotAnswer || gem.pendingSlotAnswer || null,
        needsClarification: oai.needsClarification || gem.needsClarification,
        clarificationReason: oai.clarificationReason || gem.clarificationReason || null,
      },
      agreementStatus: "FULL_AGREEMENT",
      confidenceDelta,
      clarificationRequired: oai.needsClarification || gem.needsClarification,
      clarificationQuestion: (oai.clarificationReason || gem.clarificationReason) || undefined,
      combinedConfidence,
    };
  }

  // 4C: Intent disagreement
  if (confidenceDelta >= 0.15) {
    const winner = oaiConf > gemConf ? oai : gem;
    const winnerProvider = oaiConf > gemConf ? "openai" : "gemini";
    return {
      understanding: winner,
      agreementStatus: "CONFIDENCE_WINNER",
      primaryProvider: winnerProvider,
      confidenceDelta,
      clarificationRequired: winner.needsClarification,
      clarificationQuestion: winner.clarificationReason || undefined,
      combinedConfidence: Math.max(oaiConf, gemConf),
    };
  }

  // 4D: Close intent disagreement
  // Prioritize REAL_ESTATE_SEARCH if real-estate entities exist
  const hasEntities = Boolean(
    oai.entities.city ||
      gem.entities.city ||
      oai.entities.district ||
      gem.entities.district ||
      oai.entities.bedrooms ||
      gem.entities.bedrooms ||
      oai.entities.budget ||
      gem.entities.budget
  );

  const selectedUnderstanding = hasEntities
    ? (oai.intent === "REAL_ESTATE_SEARCH" ? oai : gem)
    : (oaiConf >= gemConf ? oai : gem);

  return {
    understanding: selectedUnderstanding,
    agreementStatus: "CONFIDENCE_WINNER",
    primaryProvider: oaiConf >= gemConf ? "openai" : "gemini",
    confidenceDelta,
    clarificationRequired: selectedUnderstanding.needsClarification,
    clarificationQuestion: selectedUnderstanding.clarificationReason || undefined,
    combinedConfidence: Math.max(oaiConf, gemConf),
  };
}
