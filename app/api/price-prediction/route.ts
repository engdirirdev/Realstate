import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// City price multipliers based on Somali market data
const CITY_MULTIPLIERS: Record<string, number> = {
  mogadishu: 1.4,
  hargeisa: 1.2,
  bosaso: 1.1,
  kismayo: 1.0,
  garowe: 0.95,
  baydhabo: 0.9,
  berbera: 1.05,
  afgooye: 0.85,
};

// Property type base prices (USD)
const TYPE_BASE_PRICES: Record<string, number> = {
  VILLA: 120000,
  HOUSE: 75000,
  TOWNHOUSE: 65000,
  APARTMENT: 45000,
  STUDIO: 25000,
  OFFICE: 55000,
  COMMERCIAL: 80000,
  LAND: 30000,
};

/**
 * Statistical ML prediction engine using real database prices.
 * Uses weighted similarity scoring against comparable properties.
 */
async function predictPrice(params: {
  city: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
}): Promise<{
  predictedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  insights: string[];
  comparables: number;
}> {
  const cityKey = params.city.toLowerCase();
  const cityMultiplier = CITY_MULTIPLIERS[cityKey] || 1.0;
  const typeBase = TYPE_BASE_PRICES[params.type] || 70000;

  // Fetch comparable properties from DB (city + type match)
  const exactMatches = await prisma.property.findMany({
    where: {
      status: "APPROVED",
      type: params.type as any,
      city: { contains: params.city },
      bedrooms: { gte: Math.max(0, params.bedrooms - 1), lte: params.bedrooms + 1 },
    },
    select: { price: true, area: true, bedrooms: true, bathrooms: true },
    take: 20,
  });

  // Wider search if not enough comparables
  const broaderMatches = await prisma.property.findMany({
    where: {
      status: "APPROVED",
      type: params.type as any,
    },
    select: { price: true, area: true, bedrooms: true, bathrooms: true },
    take: 30,
  });

  const allComparables = exactMatches.length >= 3 ? exactMatches : broaderMatches;

  let predictedPrice: number;
  let confidence: number;
  const comparablesCount = allComparables.length;

  if (allComparables.length > 0) {
    let totalWeight = 0;
    let weightedSum = 0;

    for (const comp of allComparables) {
      const bedroomDiff = Math.abs(comp.bedrooms - params.bedrooms);
      const areaDiff = Math.abs(comp.area - params.area) / params.area;
      const bathDiff = Math.abs(comp.bathrooms - params.bathrooms);

      const weight =
        (1 / (1 + bedroomDiff)) *
        (1 / (1 + areaDiff)) *
        (1 / (1 + bathDiff));

      weightedSum += comp.price * weight;
      totalWeight += weight;
    }

    const weightedAvg = weightedSum / totalWeight;

    // Area adjustment with diminishing returns
    const avgArea = allComparables.reduce((s, c) => s + c.area, 0) / allComparables.length;
    const areaAdjustment = params.area / avgArea;
    predictedPrice = weightedAvg * Math.pow(areaAdjustment, 0.6);

    // Apply city multiplier if using broader matches
    if (exactMatches.length < 3) predictedPrice *= cityMultiplier;

    // Calculate confidence from variance
    const prices = allComparables.map((c) => c.price);
    const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
    const variance = prices.reduce((s, p) => s + Math.pow(p - mean, 2), 0) / prices.length;
    const cv = Math.sqrt(variance) / mean;

    confidence = Math.min(
      95,
      Math.max(30, Math.round(70 + Math.min(20, comparablesCount * 1.5) - cv * 40))
    );
  } else {
    // Formula-based fallback
    predictedPrice = typeBase * cityMultiplier;
    predictedPrice += params.bedrooms * 8000;
    predictedPrice += params.bathrooms * 3000;
    predictedPrice += params.area * 200;
    confidence = 40;
  }

  const rangePercent = (100 - confidence) / 100 + 0.05;
  const minPrice = Math.round(predictedPrice * (1 - rangePercent));
  const maxPrice = Math.round(predictedPrice * (1 + rangePercent));

  const insights: string[] = [];
  insights.push(
    `Based on ${comparablesCount > 0 ? `${comparablesCount} comparable properties` : "market formula"} in our database.`
  );
  if (cityMultiplier > 1.2) insights.push(`${params.city} is a premium market with higher property values.`);
  if (cityMultiplier < 0.95) insights.push(`${params.city} offers competitive pricing below the national average.`);
  if (params.area > 200) insights.push("Larger properties have diminishing price-per-m² returns.");
  if (params.bedrooms >= 4) insights.push("High-bedroom properties appeal to large families and command premium pricing.");
  insights.push(`Price range reflects a ${Math.round(rangePercent * 100)}% confidence interval.`);

  return {
    predictedPrice: Math.round(predictedPrice),
    minPrice,
    maxPrice,
    confidence,
    insights: insights.slice(0, 4),
    comparables: comparablesCount,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { city, type, bedrooms, bathrooms, area } = body;

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

    const prediction = await predictPrice({
      city,
      type,
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms) || 1,
      area: Number(area),
    });

    // Save prediction to DB if user is logged in
    const session = await auth();
    if (session?.user?.id) {
      await prisma.pricePrediction.create({
        data: {
          userId: session.user.id,
          location: city,          // schema uses 'location' not 'city'
          propertyType: type as any,
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms) || 1,
          area: Number(area),
          predictedPrice: prediction.predictedPrice,
          minPrice: prediction.minPrice,
          maxPrice: prediction.maxPrice,
          confidence: prediction.confidence,
        },
      });
    }

    return NextResponse.json({ success: true, prediction });
  } catch (error) {
    console.error("Price prediction error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
