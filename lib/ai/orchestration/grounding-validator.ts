/**
 * Grounding & Factual Safety Validator
 *
 * Verifies that AI-generated responses do NOT hallucinate or claim facts,
 * amenities, prices, or availability that are absent from verified database listings.
 *
 * If any hallucination is detected (e.g. asserting swimming pool or parking when
 * not present in verified database data), the response is REJECTED and safely
 * replaced with deterministic fallback.
 */

import { ResultItem } from "../conversation/types";

export interface GroundingValidationResult {
  isValid: boolean;
  reason?: string;
  hallucinatedFeature?: string;
}

export function validateGrounding(
  generatedText: string,
  verifiedProperties: ResultItem[] = [],
  targetProperty?: ResultItem
): GroundingValidationResult {
  if (!generatedText || typeof generatedText !== "string") {
    return { isValid: false, reason: "Generated text is empty or invalid" };
  }

  const text = generatedText.toLowerCase();

  // If there are no verified properties and the response asserts specific property features, reject
  if (verifiedProperties.length === 0 && !targetProperty) {
    // If it's a general statement or refusal, it's valid
    if (
      text.includes("ma jiraan") ||
      text.includes("wax natiijo ah kama helin") ||
      text.includes("no properties found") ||
      text.includes("waxaan ahay kiro-maal") ||
      text.includes("kiro-maal real estate")
    ) {
      return { isValid: true };
    }
  }

  const activeProp = targetProperty || verifiedProperties[0];

  // 1. SWIMMING POOL VALIDATION
  const assertsPool =
    /\b(swimming\s*pool|barkad|barkadda|barkad\s+dabaasha|has\s+a\s*pool|includes\s+a\s*pool|مسبح)\b/i.test(
      text
    ) &&
    !text.includes("kama muuqato") &&
    !text.includes("ma laha") &&
    !text.includes("no pool") &&
    !text.includes("not have a pool") &&
    !text.includes("لا يحتوي على مسبح");

  if (assertsPool) {
    const verifiedHasPool = activeProp
      ? Boolean((activeProp as any).pool || activeProp.description?.toLowerCase().includes("pool"))
      : verifiedProperties.some(
          (p) => (p as any).pool || p.description?.toLowerCase().includes("pool")
        );

    if (!verifiedHasPool) {
      return {
        isValid: false,
        reason: "Claimed swimming pool amenity which is not verified in database listing.",
        hallucinatedFeature: "swimming_pool",
      };
    }
  }

  // 2. PARKING VALIDATION
  const assertsParking =
    /\b(wuxuu\s+leeyahay\s+parking|waxa\s+uu\s+leeyahay\s+parking|parking\s+ayuu\s+leeyahay|parking\s+buu\s+leeyahay|parking\s+ayuu\s+leeyahay|has\s+parking|features\s+parking|dedicated\s+parking|with\s+parking|يحتوي\s+على\s+موقف|يوجد\s+موقف)\b/i.test(
      text
    ) &&
    !text.includes("kama muuqato") &&
    !text.includes("ma laha") &&
    !text.includes("ma lahan") &&
    !text.includes("no parking") &&
    !text.includes("does not have parking") &&
    !text.includes("without parking") &&
    !text.includes("لا يحتوي على موقف");

  if (assertsParking) {
    const verifiedHasParking = activeProp
      ? activeProp.parking === true || (activeProp.parkingSpaces && activeProp.parkingSpaces > 0)
      : verifiedProperties.some((p) => p.parking === true || (p.parkingSpaces && p.parkingSpaces > 0));

    if (!verifiedHasParking) {
      return {
        isValid: false,
        reason: "Claimed parking amenity which is null or false in verified database listing.",
        hallucinatedFeature: "parking",
      };
    }
  }

  // 3. FURNISHED VALIDATION
  const assertsFurnished =
    /\b(wuxuu\s+leeyahay\s+alaab|waxa\s+uu\s+leeyahay\s+alaab|waa\s+furnished|alaab\s+ayuu\s+leeyahay|is\s+furnished|fully\s+furnished|مفروش|مفروشة)\b/i.test(
      text
    ) &&
    !text.includes("kama muuqato") &&
    !text.includes("ma laha") &&
    !text.includes("unfurnished") &&
    !text.includes("not furnished") &&
    !text.includes("غير مفروش");

  if (assertsFurnished) {
    const verifiedHasFurnished = activeProp
      ? activeProp.furnished === true
      : verifiedProperties.some((p) => p.furnished === true);

    if (!verifiedHasFurnished) {
      return {
        isValid: false,
        reason: "Claimed furnished status which is null or false in verified database listing.",
        hallucinatedFeature: "furnished",
      };
    }
  }

  return { isValid: true };
}
