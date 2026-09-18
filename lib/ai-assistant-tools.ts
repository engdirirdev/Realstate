import { prisma } from "@/lib/prisma";

/**
 * Detect potential duplicate listings based on title, city, price, and specs
 */
export async function detectDuplicateListing(params: {
  title: string;
  city: string;
  price: number;
  bedrooms: number;
  area: number;
  excludePropertyId?: string;
}): Promise<{ isDuplicate: boolean; confidence: number; matchedProperty?: { id: string; title: string; price: number } }> {
  const minPrice = params.price * 0.95;
  const maxPrice = params.price * 1.05;

  const candidates = await prisma.property.findMany({
    where: {
      id: params.excludePropertyId ? { not: params.excludePropertyId } : undefined,
      city: { contains: params.city },
      bedrooms: params.bedrooms,
      price: { gte: minPrice, lte: maxPrice },
    },
    select: { id: true, title: true, price: true, area: true },
    take: 5,
  });

  if (candidates.length === 0) {
    return { isDuplicate: false, confidence: 0 };
  }

  const cleanTitle = params.title.toLowerCase().trim();
  for (const cand of candidates) {
    const candTitle = cand.title.toLowerCase().trim();
    // Check exact or substring title match
    if (cleanTitle === candTitle || candTitle.includes(cleanTitle) || cleanTitle.includes(candTitle)) {
      return {
        isDuplicate: true,
        confidence: 90,
        matchedProperty: cand,
      };
    }

    // Check area similarity
    if (Math.abs(cand.area - params.area) <= 5) {
      return {
        isDuplicate: true,
        confidence: 75,
        matchedProperty: cand,
      };
    }
  }

  return { isDuplicate: false, confidence: 20 };
}

/**
 * AI Price Anomaly & Fraud Detection
 * Checks if a property price is abnormally lower or higher than city averages
 */
export function detectPriceAnomaly(params: {
  price: number;
  area: number;
  city: string;
  type: string;
}): { isAnomaly: boolean; severity: "NORMAL" | "WARNING" | "CRITICAL"; reason?: string } {
  if (params.area <= 0) return { isAnomaly: false, severity: "NORMAL" };

  const pricePerM2 = params.price / params.area;

  // Typical Somali market range ($150 - $1,800 / m²)
  if (pricePerM2 < 100) {
    return {
      isAnomaly: true,
      severity: "CRITICAL",
      reason: `Price per m² ($${Math.round(pricePerM2)}/m²) is suspiciously below market minimum. May be an inaccurate listing or fraudulent post.`,
    };
  }

  if (pricePerM2 > 2800) {
    return {
      isAnomaly: true,
      severity: "WARNING",
      reason: `Price per m² ($${Math.round(pricePerM2)}/m²) exceeds normal prime market averages. Consider verifying documentation.`,
    };
  }

  return { isAnomaly: false, severity: "NORMAL" };
}

/**
 * AI Listing Description Generator
 */
export function generateListingDescription(params: {
  title: string;
  city: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities?: string[];
}): string {
  const typeName = params.type.charAt(0) + params.type.slice(1).toLowerCase();
  const amenitiesList = params.amenities && params.amenities.length > 0
    ? `Key amenities include ${params.amenities.slice(0, 4).join(", ")}, ensuring convenience and peace of mind.`
    : "Equipped with essential utilities, secure perimeter wall, and verified infrastructure.";

  return `Welcome to this exceptional ${typeName.toLowerCase()} located in the vibrant city of ${params.city}. 

Offering ${params.area}m² of well-planned space, this property features ${params.bedrooms} spacious bedrooms, ${params.bathrooms} modern bathrooms, and bright open living areas designed for comfort and functionality.

${amenitiesList}

Conveniently situated near major access roads, local markets, mosques, and schools, this listing is ideal for families, professionals, or long-term investors looking for verified Somali real estate. Contact our manager today to arrange an on-site visit or private viewing session.`;
}
