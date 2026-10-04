/**
 * Canonical AI Price Estimate & Market Valuation API Endpoint
 * POST /api/ai/price-estimate
 * Phase 3 — Real Estate AI
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
} from "@/lib/rate-limiter";
import { estimatePropertyPrice } from "@/lib/ai/valuation/valuation-service";
import { ValuationFeatures } from "@/lib/ai/valuation/types";
import { extractEntities } from "@/lib/ai/nlu/entity-extractor";

export async function POST(req: NextRequest) {
  try {
    // 1. Sliding-window rate limit (30 req/min)
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId, {
      limit: 30,
      windowSeconds: 60,
    });

    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    let { propertyId, features, askingPrice, query } = body;

    // Multilingual Natural Language Support (Phase 2B integration)
    if (query && typeof query === "string" && !features && !propertyId) {
      const entities = extractEntities(query);
      const beds =
        typeof entities.bedrooms === "object" && entities.bedrooms !== null
          ? Number((entities.bedrooms as any).value) || 3
          : Number(entities.bedrooms) || 3;
      const baths =
        typeof entities.bathrooms === "object" && entities.bathrooms !== null
          ? Number((entities.bathrooms as any).value) || 2
          : Number(entities.bathrooms) || 2;

      features = {
        city: entities.city || "Mogadishu",
        propertyType: entities.propertyType || "HOUSE",
        bedrooms: beds,
        bathrooms: baths,
        area: 160, // default realistic area for extracted query
        parking: entities.parking ? 1 : 0,
        isFurnished: false,
      };
      const extractedPrice = entities.price?.maxPrice || entities.price?.approxPrice;
      if (extractedPrice && !askingPrice) {
        askingPrice = extractedPrice;
      }
    }

    if (!propertyId && !features) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Either propertyId, features object, or natural-language query must be provided.",
        },
        { status: 400 }
      );
    }

    if (features) {
      if (
        typeof features.area !== "number" ||
        features.area <= 0 ||
        typeof features.bedrooms !== "number" ||
        typeof features.bathrooms !== "number" ||
        !features.city ||
        !features.propertyType
      ) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Features must include valid positive area, bedrooms, bathrooms, city, and propertyType.",
          },
          { status: 400 }
        );
      }
    }

    // 3. Execute AI Valuation Pipeline
    const result = await estimatePropertyPrice({
      propertyId: typeof propertyId === "string" ? propertyId : undefined,
      features: features as ValuationFeatures,
      askingPrice: typeof askingPrice === "number" ? askingPrice : undefined,
    });

    if ((result as any).status === "INSUFFICIENT_DATA") {
      return NextResponse.json(result);
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    console.error("[API:PriceEstimate] Valuation error:", err);
    const status = err.message?.includes("not found")
      ? 404
      : err.message?.includes("unavailable")
      ? 403
      : 500;

    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to calculate property valuation",
      },
      { status }
    );
  }
}
