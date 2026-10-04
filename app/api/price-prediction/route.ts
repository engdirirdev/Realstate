import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitResponse,
  RATE_LIMIT_PRESETS,
} from "@/lib/rate-limiter";
import { estimatePropertyPrice } from "@/lib/ai/valuation/valuation-service";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const identifier = getClientIdentifier(request, session?.user?.id);
    const rateLimitResult = checkRateLimit(identifier, RATE_LIMIT_PRESETS.PRICE_PREDICTION);

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { city, type, bedrooms, bathrooms, area, askingPrice, parking, isFurnished } = body || {};

    if (!city || !type || bedrooms == null || area == null) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: city, type, bedrooms, area" },
        { status: 400 }
      );
    }

    if (Number(area) < 10 || Number(area) > 50000) {
      return NextResponse.json(
        { success: false, error: "Area must be between 10 and 50,000 m²" },
        { status: 400 }
      );
    }

    // Execute genuine AI valuation engine
    const valResult = await estimatePropertyPrice({
      features: {
        city: String(city),
        propertyType: String(type),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms) || 1,
        area: Number(area),
        parking: Number(parking) || 0,
        isFurnished: !!isFurnished,
      },
      askingPrice: askingPrice ? Number(askingPrice) : undefined,
    });

    if ((valResult as any).status === "INSUFFICIENT_DATA") {
      return NextResponse.json(valResult);
    }

    const confidenceValue = valResult.calibration
      ? Math.round(Math.max(10, Math.min(99, (1 - (valResult.calibration.outOfSampleMAE / valResult.estimatedPrice)) * 100)))
      : 80;

    const prediction = {
      predictedPrice: valResult.estimatedPrice,
      minPrice: valResult.priceRange.lower,
      maxPrice: valResult.priceRange.upper,
      confidence: confidenceValue,
      confidenceBasis: "1 - (LOOCV_MAE / estimatedPrice)",
      calibration: valResult.calibration,
      pairCoverage: valResult.pairCoverage,
      positionSuppressed: valResult.positionSuppressed,
      suppressReason: valResult.suppressReason,
      insights:
        valResult.topDrivers.length > 0
          ? valResult.topDrivers
          : [
              `Derived via trained ${valResult.modelMetadata.modelType} ML valuation model.`,
              `Based on ${valResult.comparables.length} verified comparable properties in database.`,
            ],
      comparables: valResult.comparables.length,
      comparableList: valResult.comparables,
      pricePosition: valResult.pricePosition ?? null,
      positionDetails: valResult.positionDetails ?? null,
      featureContributions: valResult.featureContributions,
      modelMetadata: valResult.modelMetadata,
    };

    // Save prediction to DB if user is logged in
    if (session?.user?.id) {
      try {
        await prisma.pricePrediction.create({
          data: {
            userId: session.user.id,
            location: city,
            propertyType: type as any,
            bedrooms: Number(bedrooms),
            bathrooms: Number(bathrooms) || 1,
            area: Number(area),
            predictedPrice: prediction.predictedPrice,
            minPrice: prediction.minPrice,
            maxPrice: prediction.maxPrice,
            confidence: prediction.confidence,
            modelVersion: valResult.modelMetadata.modelVersion,
            mae: valResult.modelMetadata.testMetrics.mae,
            rmse: valResult.modelMetadata.testMetrics.rmse,
            r2Score: valResult.modelMetadata.testMetrics.r2,
          },
        });
      } catch (dbErr) {
        console.warn("[API:PricePrediction] Failed to record user prediction:", dbErr);
      }
    }

    return NextResponse.json({ success: true, prediction });
  } catch (error: any) {
    console.error("Price prediction error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
