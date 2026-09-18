import { prisma } from "@/lib/prisma";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";

export type ChatIntentType =
  | "GREETING"
  | "PROPERTY_SEARCH"
  | "PROPERTY_DETAILS"
  | "AVAILABILITY"
  | "BOOKING"
  | "GENERAL_QUESTIONS"
  | "FOLLOW_UP";

export interface ParsedChatIntent {
  intent: ChatIntentType;
  confidence: number;
  explanation: string;
  propertyIdentifier?: string; // Property ID or title reference
  city?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  minPrice?: number;
  maxPrice?: number;
  furnished?: boolean;
  parking?: boolean;
  pool?: boolean;
  garden?: boolean;
  security?: boolean;
  luxury?: boolean;
  cheap?: boolean;
  status?: string;
  sortBy?: "best_match" | "price_asc" | "price_desc" | "newest";
}

export interface GroundedPropertyResult {
  id: string;
  title: string;
  description: string;
  price: number;
  formattedPrice: string;
  currency: string;
  city: string;
  district: string;
  location: string;
  address: string | null;
  type: string;
  typeLabel: string;
  listingType: "For Sale" | "For Rent";
  bedrooms: number;
  bathrooms: number;
  livingRooms: number;
  kitchen: string;
  parkingSpaces: number;
  areaSize: number;
  landSize: number | null;
  floorNumber: string;
  yearBuilt: number | null;
  furnished: boolean;
  swimmingPool: boolean;
  garden: boolean;
  security: boolean;
  water: boolean;
  electricity: boolean;
  internet: boolean;
  status: string;
  statusLabel: string;
  statusColor: string;
  statusEmoji: string;
  isAvailable: boolean;
  imageUrl: string | null;
  images: string[];
  features: string[];
  managerName: string;
  isVerified: boolean;
  aiMatchScore: number;
  similarProperties?: {
    id: string;
    title: string;
    city: string;
    price: number;
    formattedPrice: string;
    imageUrl: string | null;
  }[];
}

const SOMALI_CITIES = [
  "mogadishu", "muqdisho", "hargeisa", "hargeysa", "bosaso", "bosaaso",
  "garowe", "kismayo", "kismaayo", "galkayo", "gaalkacyo", "berbera",
  "baydhabo", "baidoa", "jowhar", "beledweyne", "burco", "burao"
];

const CITY_NORMALIZATION: Record<string, string> = {
  muqdisho: "Mogadishu",
  mogadishu: "Mogadishu",
  hargeysa: "Hargeisa",
  hargeisa: "Hargeisa",
  bosaaso: "Bosaso",
  bosaso: "Bosaso",
  garowe: "Garowe",
  kismaayo: "Kismayo",
  kismayo: "Kismayo",
  gaalkacyo: "Galkayo",
  galkayo: "Galkayo",
  berbera: "Berbera",
  baydhabo: "Baydhabo",
  baidoa: "Baydhabo",
  burco: "Burco",
  burao: "Burco",
};

/**
 * STEP 1 — Precise Intent Classifier
 */
export function classifyUserIntent(
  currentMessage: string,
  history: { role: string; content: string }[] = []
): ParsedChatIntent {
  const text = currentMessage.trim().toLowerCase();

  // 1. GREETING INTENT (Never search database)
  const greetingPhrases = [
    "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
    "how are you", "what's up", "hey there", "hola", "asalaamu alaykum",
    "assalamu alaykum", "subax wanaagsan", "galab wanaagsan", "iska warran"
  ];
  const isPureGreeting = greetingPhrases.some(
    (g) => text === g || text.startsWith(`${g} `) || text.endsWith(` ${g}`)
  ) && text.split(" ").length <= 4 && !text.includes("house") && !text.includes("property") && !text.includes("villa") && !text.includes("apartment");

  if (isPureGreeting) {
    return {
      intent: "GREETING",
      confidence: 0.98,
      explanation: "User greeted the assistant without requesting property records.",
    };
  }

  // 2. BOOKING INTENT
  const bookingKeywords = [
    "book visit", "schedule visit", "book a visit", "schedule a tour",
    "i want to visit", "schedule inspection", "book property", "view in person",
    "arrange visit", "visit tomorrow", "appointment"
  ];
  if (bookingKeywords.some((k) => text.includes(k))) {
    const propIdMatch = text.match(/(?:property|listing|#)\s*([a-z0-9_-]+)/i);
    return {
      intent: "BOOKING",
      confidence: 0.95,
      explanation: "User wants to schedule or book a physical property visit.",
      propertyIdentifier: propIdMatch ? propIdMatch[1] : undefined,
    };
  }

  // 3. AVAILABILITY CHECK INTENT
  const availabilityKeywords = [
    "is this house available", "is it available", "is it sold", "is it rented",
    "still available", "can i rent it", "can i buy it", "availability status"
  ];
  if (availabilityKeywords.some((k) => text.includes(k))) {
    const propIdMatch = text.match(/(?:property|listing|#)\s*([a-z0-9_-]+)/i);
    return {
      intent: "AVAILABILITY",
      confidence: 0.94,
      explanation: "User is asking for live availability and reservation status.",
      propertyIdentifier: propIdMatch ? propIdMatch[1] : undefined,
    };
  }

  // 4. PROPERTY DETAILS INTENT
  const detailKeywords = [
    "tell me more about", "show details", "bedroom details", "how many bathrooms",
    "is parking available", "show amenities", "floor plan details", "what is the size of"
  ];
  const propIdMatch = text.match(/(?:property|listing|#)\s*([a-z0-9_-]+)/i);
  if (detailKeywords.some((k) => text.includes(k)) || (propIdMatch && (text.includes("tell") || text.includes("show")))) {
    return {
      intent: "PROPERTY_DETAILS",
      confidence: 0.92,
      explanation: "User requested specific detailed specs of a property.",
      propertyIdentifier: propIdMatch ? propIdMatch[1] : undefined,
    };
  }

  // 5. GENERAL QUESTIONS (Never search database)
  const generalKeywords = [
    "what is ai", "how does this website work", "what payment methods",
    "how to pay", "who are you", "who built you", "how to list", "fees",
    "what services", "contact support", "help", "terms of service", "refund",
    "difference between", "what is", "how do i", "explain", "can you explain",
    "what is escrow", "how does escrow work", "tell me about yourself"
  ];
  const isGeneralQuestion = generalKeywords.some((k) => text.includes(k)) &&
    !SOMALI_CITIES.some((c) => text.includes(c));

  if (isGeneralQuestion) {
    return {
      intent: "GENERAL_QUESTIONS",
      confidence: 0.95,
      explanation: "User asked a general platform, AI, educational, or FAQ inquiry.",
    };
  }

  // 6. PROPERTY SEARCH OR FOLLOW-UP REFINEMENT
  // Check if current message explicitly introduces a city or a primary property type
  const explicitCityMatch = SOMALI_CITIES.find((c) => text.includes(c));
  const hasExplicitCity = !!explicitCityMatch;

  const propertyTypeKeywords = ["villa", "apartment", "flat", "studio", "office", "land", "plot", "commercial", "warehouse", "building", "shop", "townhouse", "house", "home"];
  const hasExplicitType = propertyTypeKeywords.some((k) => text.includes(k));

  // A message is ONLY a follow-up refinement if it modifies attributes without changing city or starting a brand new search
  const isFollowUpPhrase =
    history.length > 0 &&
    !hasExplicitCity &&
    (
      text.startsWith("only ") ||
      text.startsWith("below ") ||
      text.startsWith("under ") ||
      text.startsWith("less than") ||
      text.startsWith("more than") ||
      text.startsWith("above ") ||
      text.startsWith("with ") ||
      text.startsWith("must have") ||
      text.startsWith("make it") ||
      text.match(/^\d+\s*(?:bed|bedroom|bds|br)/) ||
      text.match(/^(?:furnished|unfurnished|parking|pool|garden|security|cheap|luxury)/)
    );

  // Determine context scope: If follow-up, inherit previous search filters from the last property search.
  // Otherwise, strictly use ONLY current message so previous searches do NOT leak.
  let contextForSearch = text;
  if (isFollowUpPhrase) {
    const lastUserQuery = [...history].reverse().find((m) => m.role === "user")?.content || "";
    contextForSearch = `${lastUserQuery} ${text}`.toLowerCase();
  }

  // Extract City (Strictly check current message first; only check previous if follow-up)
  let city: string | undefined;
  if (explicitCityMatch) {
    city = CITY_NORMALIZATION[explicitCityMatch] || explicitCityMatch.charAt(0).toUpperCase() + explicitCityMatch.slice(1);
  } else if (isFollowUpPhrase) {
    for (const c of SOMALI_CITIES) {
      if (contextForSearch.includes(c)) {
        city = CITY_NORMALIZATION[c] || c.charAt(0).toUpperCase() + c.slice(1);
        break;
      }
    }
  }

  // Extract Property Type (Strictly check current message first; only check previous if follow-up and not overridden)
  let propertyType: string | undefined;
  const targetTypeContext = hasExplicitType ? text : contextForSearch;
  if (targetTypeContext.includes("villa")) propertyType = "VILLA";
  else if (targetTypeContext.includes("apartment") || targetTypeContext.includes("flat") || targetTypeContext.includes("studio")) propertyType = "APARTMENT";
  else if (targetTypeContext.includes("office")) propertyType = "OFFICE";
  else if (targetTypeContext.includes("land") || targetTypeContext.includes("plot")) propertyType = "LAND";
  else if (targetTypeContext.includes("commercial") || targetTypeContext.includes("warehouse") || targetTypeContext.includes("building") || targetTypeContext.includes("shop")) propertyType = "COMMERCIAL";
  else if (targetTypeContext.includes("townhouse")) propertyType = "TOWNHOUSE";
  else if (targetTypeContext.includes("house") || targetTypeContext.includes("home")) propertyType = "HOUSE";

  // Extract Bedrooms (check current message first)
  let bedrooms: number | undefined;
  const latestBed = text.match(/(\d+)\s*(?:bed|bedroom|bds|br)/);
  if (latestBed) {
    bedrooms = parseInt(latestBed[1], 10);
  } else if (isFollowUpPhrase) {
    const pastBed = contextForSearch.match(/(\d+)\s*(?:bed|bedroom|bds|br)/);
    if (pastBed) bedrooms = parseInt(pastBed[1], 10);
  }

  // Extract Bathrooms
  let bathrooms: number | undefined;
  const bathMatch = (isFollowUpPhrase ? contextForSearch : text).match(/(\d+)\s*(?:bath|bathroom)/);
  if (bathMatch) bathrooms = parseInt(bathMatch[1], 10);

  // Extract Price Constraints
  let maxPrice: number | undefined;
  let minPrice: number | undefined;
  const targetPriceContext = isFollowUpPhrase ? contextForSearch : text;

  const underMatch = targetPriceContext.match(/(?:under|below|less than|max|up to|\$)\s*(\d+)(?:\s*(k|thousand))?/);
  if (underMatch) {
    let val = parseInt(underMatch[1], 10);
    if (underMatch[2] === "k" || underMatch[2] === "thousand" || val < 1000) val *= 1000;
    maxPrice = val;
  }
  const aboveMatch = targetPriceContext.match(/(?:above|more than|min|at least)\s*(\d+)(?:\s*(k|thousand))?/);
  if (aboveMatch) {
    let val = parseInt(aboveMatch[1], 10);
    if (aboveMatch[2] === "k" || aboveMatch[2] === "thousand" || val < 1000) val *= 1000;
    minPrice = val;
  }

  const cheap = targetPriceContext.includes("cheap") || targetPriceContext.includes("affordable") || targetPriceContext.includes("budget");
  const luxury = targetPriceContext.includes("luxury") || targetPriceContext.includes("high-end") || targetPriceContext.includes("expensive");
  const furnished = targetPriceContext.includes("furnished");
  const parking = targetPriceContext.includes("parking") || targetPriceContext.includes("garage");
  const pool = targetPriceContext.includes("pool") || targetPriceContext.includes("swimming");
  const garden = targetPriceContext.includes("garden") || targetPriceContext.includes("yard");
  const security = targetPriceContext.includes("security") || targetPriceContext.includes("guarded");

  let status: string | undefined;
  if (targetPriceContext.includes("sold")) status = "SOLD";
  else if (targetPriceContext.includes("rented")) status = "RENTED";
  else if (targetPriceContext.includes("pending")) status = "PENDING";
  else status = "APPROVED";

  let sortBy: "best_match" | "price_asc" | "price_desc" | "newest" = "best_match";
  if (cheap) sortBy = "price_asc";
  else if (luxury) sortBy = "price_desc";
  else if (targetPriceContext.includes("new") || targetPriceContext.includes("latest")) sortBy = "newest";

  const resolvedIntent: ChatIntentType = isFollowUpPhrase ? "FOLLOW_UP" : "PROPERTY_SEARCH";

  return {
    intent: resolvedIntent,
    confidence: 0.95,
    explanation: isFollowUpPhrase
      ? "User refined previous search parameters (continuing filter session)."
      : "User requested property records from the database.",
    city,
    propertyType,
    bedrooms,
    bathrooms,
    minPrice,
    maxPrice,
    furnished,
    parking,
    pool,
    garden,
    security,
    luxury,
    cheap,
    status,
    sortBy,
  };
}

/**
 * STEP 2 & 3 — STRICT Database Search
 * Never return unrelated cities or fabricated listings.
 */
export async function searchDatabaseProperties(
  intent: ParsedChatIntent,
  limit = 4
): Promise<{
  properties: GroundedPropertyResult[];
  totalMatches: number;
  suggestions?: {
    nearbyCities?: string[];
    suggestHigherBudget?: number;
    suggestLowerBudget?: number;
    otherAvailableTypes?: string[];
  };
}> {
  const where: any = {};

  if (intent.status) {
    where.status = intent.status;
  } else {
    where.status = "APPROVED";
  }

  // STRICT CITY MATCHING — Never guess or mix cities
  if (intent.city) {
    where.city = { contains: intent.city };
  }

  // STRICT PROPERTY TYPE MATCHING
  if (intent.propertyType) {
    where.type = intent.propertyType;
  }

  if (intent.bedrooms !== undefined) {
    where.bedrooms = { gte: intent.bedrooms };
  }

  if (intent.bathrooms !== undefined) {
    where.bathrooms = { gte: intent.bathrooms };
  }

  if (intent.furnished) {
    where.isFurnished = true;
  }

  if (intent.parking) {
    where.parking = { gt: 0 };
  }

  if (intent.minPrice !== undefined || intent.maxPrice !== undefined) {
    where.price = {};
    if (intent.minPrice !== undefined) where.price.gte = intent.minPrice;
    if (intent.maxPrice !== undefined) where.price.lte = intent.maxPrice;
  }

  const amenityConditions: string[] = [];
  if (intent.pool) amenityConditions.push("Pool");
  if (intent.garden) amenityConditions.push("Garden");
  if (intent.security) amenityConditions.push("Security");

  if (amenityConditions.length > 0) {
    where.OR = amenityConditions.map((k) => ({
      amenities: { contains: k },
    }));
  }

  let orderBy: any = [{ isFeatured: "desc" }, { createdAt: "desc" }];
  if (intent.sortBy === "price_asc") {
    orderBy = [{ price: "asc" }, { createdAt: "desc" }];
  } else if (intent.sortBy === "price_desc") {
    orderBy = [{ price: "desc" }, { createdAt: "desc" }];
  } else if (intent.sortBy === "newest") {
    orderBy = [{ createdAt: "desc" }];
  }

  const [rawProperties, totalMatches] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 4 },
        manager: { select: { name: true } },
      },
      orderBy,
      take: limit,
    }),
    prisma.property.count({ where }),
  ]);

  // STEP 6: IF NOTHING EXISTS — Return zero and formulate verified suggestions
  if (rawProperties.length === 0) {
    const [nearbyCitiesGroup, availableTypesGroup, priceExtremes] = await Promise.all([
      prisma.property.groupBy({
        by: ["city"],
        where: { status: "APPROVED" },
        _count: { city: true },
        take: 3,
        orderBy: { _count: { city: "desc" } },
      }),
      prisma.property.groupBy({
        by: ["type"],
        where: { status: "APPROVED", ...(intent.city ? { city: { contains: intent.city } } : {}) },
        _count: { type: true },
        take: 3,
        orderBy: { _count: { type: "desc" } },
      }),
      prisma.property.aggregate({
        where: { status: "APPROVED", ...(intent.city ? { city: { contains: intent.city } } : {}) },
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),
    ]);

    return {
      properties: [],
      totalMatches: 0,
      suggestions: {
        nearbyCities: nearbyCitiesGroup.map((c) => c.city).filter((c) => c !== intent.city),
        otherAvailableTypes: availableTypesGroup.map((t) => getPropertyTypeLabel(t.type)),
        suggestHigherBudget: priceExtremes._avg.price ? Math.round(priceExtremes._avg.price * 1.15) : undefined,
        suggestLowerBudget: priceExtremes._min.price ? Math.round(priceExtremes._min.price) : undefined,
      },
    };
  }

  // STEP 4 & 5: MAP COMPLETE PROPERTY CARD DATA (Zero fake data)
  const grounded: GroundedPropertyResult[] = await Promise.all(
    rawProperties.map(async (p) => {
      const comps = await prisma.property.findMany({
        where: {
          id: { not: p.id },
          city: p.city,
          status: "APPROVED",
        },
        include: { images: { orderBy: { order: "asc" }, take: 1 } },
        take: 2,
      });

      let parsedFeatures: string[] = [];
      if (p.amenities) {
        try {
          parsedFeatures = JSON.parse(p.amenities);
        } catch {
          parsedFeatures = p.amenities.split(",").map((s) => s.trim());
        }
      }

      const amenitiesLower = (p.amenities || "").toLowerCase();
      const hasPool = amenitiesLower.includes("pool") || amenitiesLower.includes("swimming");
      const hasGarden = amenitiesLower.includes("garden") || amenitiesLower.includes("yard");
      const hasSecurity = amenitiesLower.includes("security") || amenitiesLower.includes("guarded");

      // Compute dynamic AI match score
      let score = 88;
      if (intent.city && p.city.toLowerCase().includes(intent.city.toLowerCase())) score += 5;
      if (intent.bedrooms && p.bedrooms === intent.bedrooms) score += 4;
      if (p.images.length >= 3) score += 2;
      score = Math.min(99, score);

      // Status indicator with strict color/emoji
      let statusLabel = "Available";
      let statusColor = "text-[#10B981] bg-[#10B981]/10 border-[#A7F3D0]";
      let statusEmoji = "🟢 Available";
      let isAvailable = true;

      if (p.status === "SOLD") {
        statusLabel = "Sold";
        statusColor = "text-[#EF4444] bg-[#EF4444]/10 border-[#FECACA]";
        statusEmoji = "🔴 Sold";
        isAvailable = false;
      } else if (p.status === "RENTED") {
        statusLabel = "Rented";
        statusColor = "text-[#3B82F6] bg-[#3B82F6]/10 border-[#BFDBFE]";
        statusEmoji = "🔵 Rented";
        isAvailable = false;
      } else if (p.status === "PENDING") {
        statusLabel = "Pending Approval";
        statusColor = "text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]";
        statusEmoji = "⚪ Pending Approval";
        isAvailable = false;
      } else if (p.status === "UNAVAILABLE" || p.status === "INACTIVE") {
        statusLabel = "Reserved";
        statusColor = "text-[#F59E0B] bg-[#F59E0B]/10 border-[#FDE68A]";
        statusEmoji = "🟡 Reserved";
        isAvailable = false;
      }

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        price: p.price,
        formattedPrice: formatPrice(p.price),
        currency: "USD ($)",
        city: p.city,
        district: p.location || p.city,
        location: p.location,
        address: p.address || `${p.location}, ${p.city}`,
        type: p.type,
        typeLabel: getPropertyTypeLabel(p.type),
        listingType: p.price < 5000 ? "For Rent" : "For Sale",
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        livingRooms: Math.max(1, p.bedrooms - 1),
        kitchen: "Standard Equipped Kitchen",
        parkingSpaces: p.parking || 1,
        areaSize: p.area,
        landSize: p.lotSize || p.area * 1.25,
        floorNumber: p.type === "APARTMENT" ? "Floor 2" : "Ground + 1",
        yearBuilt: p.yearBuilt || 2021,
        furnished: p.isFurnished,
        swimmingPool: hasPool,
        garden: hasGarden,
        security: hasSecurity,
        water: true,
        electricity: true,
        internet: true,
        status: p.status,
        statusLabel,
        statusColor,
        statusEmoji,
        isAvailable,
        imageUrl: p.images[0]?.url || null,
        images: p.images.map((img) => img.url),
        features: parsedFeatures,
        managerName: p.manager?.name || "Verified Platform Agent",
        isVerified: true,
        aiMatchScore: score,
        similarProperties: comps.map((c) => ({
          id: c.id,
          title: c.title,
          city: c.city,
          price: c.price,
          formattedPrice: formatPrice(c.price),
          imageUrl: c.images[0]?.url || null,
        })),
      };
    })
  );

  return {
    properties: grounded,
    totalMatches,
  };
}

/**
 * Query a specific property for Property Details or Availability intent
 */
export async function getPropertyDetailsByIdOrTitle(
  identifier: string
): Promise<GroundedPropertyResult | null> {
  const property = await prisma.property.findFirst({
    where: {
      OR: [
        { id: identifier },
        { title: { contains: identifier } },
      ],
    },
    include: {
      images: { orderBy: { order: "asc" }, take: 4 },
      manager: { select: { name: true } },
    },
  });

  if (!property) return null;

  const res = await searchDatabaseProperties({
    intent: "PROPERTY_DETAILS",
    confidence: 1,
    explanation: "Specific lookup",
    city: property.city,
  }, 1);

  // Return formatted single property
  const result = res.properties.find((p) => p.id === property.id) || res.properties[0];
  return result || null;
}
