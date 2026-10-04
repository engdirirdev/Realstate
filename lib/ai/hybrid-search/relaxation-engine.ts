/**
 * Controlled Query Relaxation & Alternative Match Engine
 *
 * Invoked when exact hard-constraint matching yields zero results.
 * Systematically tests relaxing ONE constraint at a time in prioritized order:
 * 1. Budget expansion (e.g. +15% to find closest matching properties)
 * 2. Bedroom count adjustment (+/- 1 bedroom in the requested city & type)
 * 3. Feature requirement relaxation (e.g. dropping strict parking requirement)
 *
 * CRITICAL RULE: Never silently violate constraints; every alternative is explicitly
 * annotated with the exact relaxed field, original value, relaxed value, and human explanation.
 */

import { prisma } from "@/lib/prisma";
import { HardConstraints } from "../nlu/constraint-classifier";
import { CandidateProperty } from "./rrf-ranker";

export interface RelaxedConstraintInfo {
  field: keyof HardConstraints;
  originalValue: any;
  relaxedValue: any;
  explanation: string;
}

export interface AlternativeResultItem {
  property: CandidateProperty;
  relaxedConstraint: RelaxedConstraintInfo;
  matchScore: number;
}

export interface RelaxationResult {
  hasAlternatives: boolean;
  relaxedField?: keyof HardConstraints;
  relaxationSummary?: string;
  alternatives: AlternativeResultItem[];
}

/**
 * Searches for high-quality alternative properties by relaxing a single constraint.
 */
export async function findControlledAlternatives(
  hardConstraints: HardConstraints,
  limit: number = 5
): Promise<RelaxationResult> {
  const typeFilter = hardConstraints.propertyType === "HOUSE"
    ? { in: ["HOUSE", "TOWNHOUSE"] }
    : hardConstraints.propertyType ? hardConstraints.propertyType : undefined;

  // Strategy 1: Budget Relaxation (closest matching properties above budget)
  if (hardConstraints.maxPrice && hardConstraints.maxPrice > 0) {
    const originalMax = hardConstraints.maxPrice;

    const where: any = {
      status: "APPROVED",
      price: { gt: originalMax },
    };

    if (hardConstraints.city) where.city = { contains: hardConstraints.city };
    if (typeFilter) where.type = typeFilter;
    if (hardConstraints.bedrooms && hardConstraints.bedrooms.value) {
      where.bedrooms = hardConstraints.bedrooms.value;
    }

    const budgetAlternatives = await prisma.property.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { price: "asc" }, // Closest to user's budget first
      take: limit,
    });

    if (budgetAlternatives.length > 0) {
      const minAvailable = budgetAlternatives[0].price;
      const explanation = `No ${hardConstraints.bedrooms?.value ? hardConstraints.bedrooms.value + "-bedroom " : ""}${
        hardConstraints.propertyType ? hardConstraints.propertyType.toLowerCase() + "s " : "properties "
      }under $${originalMax.toLocaleString()} were found in ${hardConstraints.city || "this location"}. Showing closest available options starting at $${minAvailable.toLocaleString()}.`;

      return {
        hasAlternatives: true,
        relaxedField: "maxPrice",
        relaxationSummary: explanation,
        alternatives: budgetAlternatives.map((prop, idx) => ({
          property: {
            id: prop.id,
            title: prop.title,
            type: prop.type,
            status: prop.status,
            city: prop.city,
            location: prop.location,
            price: prop.price,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            parking: prop.parking,
            isFurnished: prop.isFurnished,
            description: prop.description,
            imageUrl: prop.images[0]?.url || null,
          },
          relaxedConstraint: {
            field: "maxPrice",
            originalValue: originalMax,
            relaxedValue: prop.price,
            explanation,
          },
          matchScore: Math.round((0.95 - (idx * 0.05)) * 100) / 100,
        })),
      };
    }
  }

  // Strategy 2: Bedroom Relaxation (+/- 1 bedroom)
  if (hardConstraints.bedrooms && hardConstraints.bedrooms.value) {
    const originalBeds = hardConstraints.bedrooms.value;
    const candidateBedCounts = [originalBeds + 1, Math.max(1, originalBeds - 1)].filter(
      (b) => b !== originalBeds
    );

    for (const altBeds of candidateBedCounts) {
      const where: any = {
        status: "APPROVED",
        bedrooms: altBeds,
      };

      if (hardConstraints.city) where.city = { contains: hardConstraints.city };
      if (typeFilter) where.type = typeFilter;
      if (hardConstraints.maxPrice) where.price = { lte: hardConstraints.maxPrice };

      const bedAlternatives = await prisma.property.findMany({
        where,
        include: {
          images: { orderBy: { order: "asc" }, take: 1 },
        },
        take: limit,
      });

      if (bedAlternatives.length > 0) {
        const explanation = `No ${originalBeds}-bedroom properties matching all criteria were found. Showing available ${altBeds}-bedroom alternatives within your budget.`;

        return {
          hasAlternatives: true,
          relaxedField: "bedrooms",
          relaxationSummary: explanation,
          alternatives: bedAlternatives.map((prop, idx) => ({
            property: {
              id: prop.id,
              title: prop.title,
              type: prop.type,
              status: prop.status,
              city: prop.city,
              location: prop.location,
              price: prop.price,
              bedrooms: prop.bedrooms,
              bathrooms: prop.bathrooms,
              area: prop.area,
              parking: prop.parking,
              isFurnished: prop.isFurnished,
              description: prop.description,
              imageUrl: prop.images[0]?.url || null,
            },
            relaxedConstraint: {
              field: "bedrooms",
              originalValue: originalBeds,
              relaxedValue: altBeds,
              explanation,
            },
            matchScore: Math.round((0.85 - (idx * 0.05)) * 100) / 100,
          })),
        };
      }
    }
  }

  // Strategy 3: Parking Relaxation (if parking was mandatory)
  if (hardConstraints.parking === true) {
    const where: any = {
      status: "APPROVED",
      parking: 0,
    };

    if (hardConstraints.city) where.city = { contains: hardConstraints.city };
    if (hardConstraints.propertyType) where.type = hardConstraints.propertyType;
    if (hardConstraints.maxPrice) where.price = { lte: hardConstraints.maxPrice };
    if (hardConstraints.bedrooms && hardConstraints.bedrooms.value) {
      where.bedrooms = hardConstraints.bedrooms.value;
    }

    const parkingAlternatives = await prisma.property.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      take: limit,
    });

    if (parkingAlternatives.length > 0) {
      const explanation = `No matching properties with dedicated parking found. Showing matching properties without dedicated parking.`;

      return {
        hasAlternatives: true,
        relaxedField: "parking",
        relaxationSummary: explanation,
        alternatives: parkingAlternatives.map((prop, idx) => ({
          property: {
            id: prop.id,
            title: prop.title,
            type: prop.type,
            status: prop.status,
            city: prop.city,
            location: prop.location,
            price: prop.price,
            bedrooms: prop.bedrooms,
            bathrooms: prop.bathrooms,
            area: prop.area,
            parking: prop.parking,
            isFurnished: prop.isFurnished,
            description: prop.description,
            imageUrl: prop.images[0]?.url || null,
          },
          relaxedConstraint: {
            field: "parking",
            originalValue: true,
            relaxedValue: false,
            explanation,
          },
          matchScore: Math.round((0.80 - (idx * 0.05)) * 100) / 100,
        })),
      };
    }
  }

  return {
    hasAlternatives: false,
    alternatives: [],
  };
}
