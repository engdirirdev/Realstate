/**
 * Canonical Property AI Document Builder
 *
 * Constructs a normalized, comprehensive textual representation of an approved property
 * for multilingual embedding generation and vector indexing.
 *
 * Includes SHA-256 content hashing to detect when property data has changed,
 * preventing unnecessary re-embedding requests.
 */
import crypto from "crypto";

export interface PropertyData {
  id: string;
  title: string;
  description: string;
  price: number;
  type: string;
  status: string;
  city: string;
  location?: string | null;
  address?: string | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt?: number | null;
  amenities?: string | null;
  parking?: number | null;
  isFurnished?: boolean;
  lotSize?: number | null;
}

export interface CanonicalDocumentResult {
  canonicalText: string;
  sourceHash: string;
}

/**
 * Builds the authoritative, comprehensive semantic document for a property.
 * Includes all searchable attributes in a structured, natural language format
 * that maximizes multilingual cross-lingual embedding retrieval.
 */
export function buildPropertyCanonicalDocument(
  property: PropertyData
): CanonicalDocumentResult {
  const parts: string[] = [];

  // Core Identity & Category
  parts.push(`Property Title: ${property.title.trim()}`);
  parts.push(`Property Type: ${property.type.toUpperCase()}`);
  parts.push(`City: ${property.city.trim()}`);

  if (property.location && property.location.trim().length > 0) {
    parts.push(`Location / Neighborhood: ${property.location.trim()}`);
  }

  if (property.address && property.address.trim().length > 0) {
    parts.push(`Address: ${property.address.trim()}`);
  }

  // Specifications
  parts.push(`Bedrooms: ${property.bedrooms}`);
  parts.push(`Bathrooms: ${property.bathrooms}`);
  parts.push(`Living Area: ${property.area} square meters`);
  parts.push(`Price: $${property.price.toLocaleString("en-US")} USD`);

  // Parking & Furnishing
  if (property.parking && property.parking > 0) {
    parts.push(`Parking: Available (${property.parking} spaces, private parking garage/compound)`);
  } else {
    parts.push(`Parking: Street or none`);
  }

  parts.push(`Furnished: ${property.isFurnished ? "Fully Furnished" : "Unfurnished"}`);

  if (property.yearBuilt) {
    parts.push(`Year Built: ${property.yearBuilt}`);
  }

  if (property.lotSize) {
    parts.push(`Lot Size: ${property.lotSize} square meters`);
  }

  // Amenities parsing
  if (property.amenities) {
    try {
      const parsed = JSON.parse(property.amenities);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parts.push(`Amenities and Features: ${parsed.join(", ")}`);
      } else if (typeof parsed === "string") {
        parts.push(`Amenities: ${parsed}`);
      }
    } catch {
      // If not JSON, append as raw text
      parts.push(`Amenities and Features: ${property.amenities}`);
    }
  }

  // Detailed Description
  if (property.description && property.description.trim().length > 0) {
    parts.push(`Detailed Description: ${property.description.trim()}`);
  }

  const canonicalText = parts.join("\n");

  // Compute deterministic SHA-256 hash of canonical content
  const sourceHash = crypto
    .createHash("sha256")
    .update(canonicalText, "utf8")
    .digest("hex");

  return {
    canonicalText,
    sourceHash,
  };
}
