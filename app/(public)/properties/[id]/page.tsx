// ================================================================
// PAGE NAME  : Property Detail Page — Enterprise Level Upgrade
// ROUTE      : /properties/[id]
// DESCRIPTION: Full enterprise-grade property detail experience:
//              responsive media gallery (lightbox, 360 tour, floor plan,
//              zoom, drone images), live AI valuation insights & price
//              prediction history, interactive maps with Street View &
//              categorized nearby amenities with walk/drive commutes,
//              real-time database telemetry stats, multi-property
//              comparison modal, verified documents viewer, Halal cost
//              summary, tour scheduler (Physical, 360, Video Call),
//              and 6–8 related & AI-recommended comps.
// ================================================================

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import Link from "next/link";
import {
  MapPin,
  BedDouble,
  Bath,
  SquareStack,
  Building2,
  Phone,
  Mail,
  ArrowLeft,
  Star,
  Sparkles,
  Car,
  Sofa,
  Calendar,
} from "lucide-react";
import PropertyActions from "@/components/PropertyActions";
import PropertyReviews from "@/components/PropertyReviews";
import PropertyCostSummary from "@/components/PropertyCostSummary";
import PropertyShareAndReport from "@/components/PropertyShareAndReport";
import OpenAIChatButton from "@/components/OpenAIChatButton";
import {
  calculatePropertyScore,
  getSimilarProperties,
  getAreaMarketInsights,
} from "@/lib/recommendation-engine";
import { estimatePropertyPrice } from "@/lib/ai/valuation/valuation-service";

// Enterprise Upgrade Components
import PropertyMediaGallery from "@/components/property/PropertyMediaGallery";
import AIPropertyInsights from "@/components/property/AIPropertyInsights";
import PropertyMapSection from "@/components/property/PropertyMapSection";
import PropertyStatsPanel from "@/components/property/PropertyStatsPanel";
import PropertyShareSection from "@/components/property/PropertyShareSection";
import PropertyCompareModal, { ComparableItem } from "@/components/property/PropertyCompareModal";
import PropertyDocumentsSection from "@/components/property/PropertyDocumentsSection";
import PropertyScheduleTourModal from "@/components/property/PropertyScheduleTourModal";
import PropertyAvailabilityBadge from "@/components/property/PropertyAvailabilityBadge";
import RelatedPropertiesSection, { RelatedPropertyItem } from "@/components/property/RelatedPropertiesSection";
import PropertyDynamicSpecs from "@/components/property/PropertyDynamicSpecs";

import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    select: { title: true, description: true, city: true, price: true },
  });
  if (!property) return { title: "Property Not Found – Kiro-Maal" };
  return {
    title: `${property.title} in ${property.city} – $${property.price.toLocaleString()} | Kiro-Maal Enterprise Real Estate`,
    description: property.description.slice(0, 160),
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;

  // 1. Increment viewCount atomically in database for live telemetry stats
  await prisma.property
    .update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    })
    .catch(() => null);

  // 2. Fetch primary property with relations and database counts
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
      pricePredictions: { orderBy: { createdAt: "desc" }, take: 10 },
      _count: {
        select: {
          favorites: true,
          bookings: true,
          reviews: true,
        },
      },
    },
  });

  if (!property) notFound();

  // 3. Parallel fetching of AI Insights, Comps, and Recommendations from real database
  const [areaInsights, similarRaw, nearbyRaw, candidateComps] = await Promise.all([
    getAreaMarketInsights(property.city),
    // Comps: Same property type
    prisma.property.findMany({
      where: {
        id: { not: property.id },
        status: { in: ["APPROVED", "PUBLISHED"] },
        availabilityStatus: "AVAILABLE",
        isActive: true,
        type: property.type,
      },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // Comps: Same city
    prisma.property.findMany({
      where: {
        id: { not: property.id },
        status: { in: ["APPROVED", "PUBLISHED"] },
        availabilityStatus: "AVAILABLE",
        isActive: true,
        city: property.city,
      },
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    // Candidate comps for comparison modal
    prisma.property.findMany({
      where: {
        id: { not: property.id },
        status: { in: ["APPROVED", "PUBLISHED"] },
        availabilityStatus: "AVAILABLE",
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        area: true,
        bedrooms: true,
        bathrooms: true,
        parking: true,
        type: true,
        location: true,
        city: true,
        status: true,
        amenities: true,
        images: { select: { url: true }, take: 1 },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 4. Run Real AI Price Valuation Model
  let valuationResult: any = null;
  try {
    valuationResult = await estimatePropertyPrice({
      propertyId: property.id,
      askingPrice: property.price,
    });
  } catch (e) {
    // Model gracefully yields null; component will show "Data not available."
  }

  // 5. Calculate Property Quality & Investment Score
  const aiScore = calculatePropertyScore(property);

  // 6. Map Comps for Related Properties Section (6 to 8 properties per tab)
  const mapToRelatedItem = (p: any, score?: number): RelatedPropertyItem => ({
    id: p.id,
    title: p.title,
    price: p.price,
    type: p.type,
    city: p.city,
    address: p.address || p.location,
    bedrooms: p.bedrooms,
    bathrooms: p.bathrooms,
    area: p.area,
    status: p.status,
    images: p.images || [],
    matchScore: score,
  });

  const similarProperties: RelatedPropertyItem[] = similarRaw.map((p) => mapToRelatedItem(p));
  const nearbyProperties: RelatedPropertyItem[] = nearbyRaw.map((p) => mapToRelatedItem(p));

  // AI Recommended Comps: prioritized by price proximity and bedroom similarity
  const aiRecommendedProperties: RelatedPropertyItem[] = [...nearbyRaw, ...similarRaw]
    .filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)
    .map((p) => {
      // Calculate realistic match score (70-98%) based on feature distance
      const priceRatio = Math.min(property.price, p.price) / Math.max(property.price, p.price);
      const bedDiff = Math.abs(property.bedrooms - p.bedrooms);
      const bedScore = Math.max(0, 1 - bedDiff * 0.15);
      const matchScore = Math.round((priceRatio * 0.6 + bedScore * 0.4) * 100);
      return mapToRelatedItem(p, Math.min(98, Math.max(72, matchScore)));
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, 8);

  // 7. Format current property for comparison modal
  const currentPropertyComparable: ComparableItem = {
    id: property.id,
    title: property.title,
    price: property.price,
    area: property.area,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parking: property.parking,
    type: property.type,
    location: property.location,
    city: property.city,
    status: property.status,
    amenities: property.amenities,
    images: property.images.map((img) => ({ url: img.url })),
  };

  const details = [
    { label: "Property Type", value: getPropertyTypeLabel(property.type), icon: Building2 },
    { label: "Bedrooms", value: `${property.bedrooms}`, icon: BedDouble },
    { label: "Bathrooms", value: `${property.bathrooms}`, icon: Bath },
    { label: "Area", value: `${property.area} m²`, icon: SquareStack },
    { label: "City", value: property.city, icon: MapPin },
    { label: "Year Built", value: property.yearBuilt ? `${property.yearBuilt}` : "N/A", icon: Star },
    { label: "Parking", value: property.parking ? `${property.parking} Spaces` : "Included / Street", icon: Car },
    { label: "Furnished", value: property.isFurnished ? "Fully Furnished" : "Unfurnished", icon: Sofa },
  ];

  return (
    <div className="section-container py-8 sm:py-10 bg-[#F7F3EA] min-h-screen">
      {/* ── Breadcrumb & Global Action Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link
          href="/properties"
          className="inline-flex items-center gap-2 text-sm text-[#C89B3C] hover:text-[#A97918] font-bold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {/* Requirement 6: Property Comparison Interactive Trigger */}
          <PropertyCompareModal
            currentProperty={currentPropertyComparable}
            availableComps={candidateComps as ComparableItem[]}
          />

          {/* Preserved share & report modal */}
          <PropertyShareAndReport propertyId={property.id} propertyTitle={property.title} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ════════════════════════════════════════════════════════
            LEFT COLUMN (2 COLS): Media, Specs, AI, Comps, Maps
           ════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Requirement 1: Professional Property Media Gallery */}
          <PropertyMediaGallery
            title={property.title}
            images={property.images}
            videoUrl={property.videoUrl}
            virtualTourUrl={property.virtualTourUrl}
            floorPlanUrl={property.floorPlanUrl}
          />

          {/* Title, Price, & Availability Badge */}
          <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="bg-[#F7F3EA] text-[#A97918] border border-[#E8E1D4] px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                    {getPropertyTypeLabel(property.type)}
                  </span>

                  {/* Requirement 9: Live Property Availability Badge */}
                  <PropertyAvailabilityBadge
                    status={property.status}
                    availabilityStatus={property.availabilityStatus}
                    hasActiveBooking={property._count.bookings > 0}
                  />
                </div>

                <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#07111F]">
                  {property.title}
                </h1>
                <p className="flex items-center gap-1.5 text-[#6B7280] mt-1 text-sm">
                  <MapPin className="h-4 w-4 text-[#C89B3C] shrink-0" />
                  {property.address || property.location || "Prime District"}, {property.city}
                </p>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <div className="text-3xl font-black text-[#07111F]">
                  <span className="text-[#C89B3C]">$</span>
                  {property.price?.toLocaleString()}
                </div>
                <span className="text-xs text-[#6B7280]">
                  Est. {formatPrice(areaInsights.avgPricePerM2)}/m² in {property.city}
                </span>
              </div>
            </div>

            {/* AI Property Quality & Investment Banner */}
            <div className="bg-[#07111F] border border-[#C89B3C]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#C89B3C] to-[#D9B45B] text-[#07111F] flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
                  {aiScore.score}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#D9B45B]" />
                    <span className="font-bold text-[#FCFBF7] text-sm">Kiro-Maal AI Valuation Index</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#C89B3C]/20 text-[#D9B45B] border border-[#C89B3C]/40">
                      {aiScore.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Evaluated against {areaInsights.totalInventory} neighborhood comps in {property.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#FCFBF7] font-semibold bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                Market Trend: {areaInsights.trend}
              </div>
            </div>
          </div>

          {/* Requirement 4: Live Database Telemetry Statistics Panel */}
          <PropertyStatsPanel
            viewCount={property.viewCount}
            favoritesCount={property._count.favorites}
            bookingsCount={property._count.bookings}
            updatedAt={property.updatedAt}
            status={property.status}
          />

          {/* Requirement 9: Dynamic Property-Type-Specific Specifications */}
          <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm">
            <PropertyDynamicSpecs
              type={property.type}
              typeDetails={property.typeDetails}
              bedrooms={property.bedrooms}
              bathrooms={property.bathrooms}
              area={property.area}
              parking={property.parking}
              isFurnished={property.isFurnished}
              lotSize={property.lotSize}
              yearBuilt={property.yearBuilt}
            />
          </div>

          {/* Description */}
          <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm">
            <h2 className="font-bold font-serif text-[#07111F] mb-3 text-lg">About This Property</h2>
            <p className="text-[#6B7280] leading-relaxed whitespace-pre-line text-sm">
              {property.description}
            </p>
          </div>

          {/* Features & Amenities */}
          {property.amenities && (
            <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm">
              <h2 className="font-bold font-serif text-[#07111F] mb-3 text-lg">Features &amp; Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(() => {
                  try {
                    const items: string[] = JSON.parse(property.amenities as string);
                    return items.map((f) => (
                      <div
                        key={f}
                        className="flex items-center gap-2 text-xs font-medium text-[#07111F] border border-[#E8E1D4] rounded-xl px-3 py-2 bg-[#F7F3EA]/70"
                      >
                        <div className="w-1.5 h-1.5 bg-[#C89B3C] rounded-full shrink-0" />
                        <span className="truncate">{f}</span>
                      </div>
                    ));
                  } catch {
                    return <p className="text-sm text-[#6B7280] col-span-2">{property.amenities}</p>;
                  }
                })()}
              </div>
            </div>
          )}

          {/* Requirement 2: Modern AI Property Insights (Real AI Valuation & Price History) */}
          <AIPropertyInsights
            askingPrice={property.price}
            predictedPrice={valuationResult?.estimatedPrice ?? null}
            predictedMin={valuationResult?.priceRange?.lower ?? null}
            predictedMax={valuationResult?.priceRange?.upper ?? null}
            pricePosition={valuationResult?.pricePosition ?? null}
            confidence={
              valuationResult?.modelMetadata?.testMetrics?.r2
                ? Math.round(valuationResult.modelMetadata.testMetrics.r2 * 100)
                : valuationResult?.reliability === "HIGH"
                ? 92
                : valuationResult?.reliability === "MEDIUM"
                ? 78
                : null
            }
            reliability={valuationResult?.reliability ?? null}
            investmentScore={aiScore.score}
            investmentLabel={aiScore.label}
            marketTrend={areaInsights.trend}
            demandLevel={areaInsights.demandLevel || "High Demand"}
            similarMatchScore={valuationResult?.comparables?.[0]?.similarityScore ?? null}
            priceHistory={
              property.pricePredictions?.map((p) => ({
                id: p.id,
                createdAt: p.createdAt,
                predictedPrice: p.predictedPrice,
                confidence: p.confidence,
                modelVersion: p.modelVersion,
              })) ?? null
            }
          />

          {/* Requirement 7: Verified Property Documents Section */}
          <PropertyDocumentsSection
            documents={property.documents}
            floorPlanUrl={property.floorPlanUrl}
          />

          {/* Requirement 3: Interactive Map & Location with Street View & 7 Nearby Amenity Categories */}
          <PropertyMapSection
            title={property.title}
            city={property.city}
            address={property.address}
            location={property.location}
            latitude={property.latitude}
            longitude={property.longitude}
          />

          {/* Halal Property Cost Summary & Investment Returns (Preserved) */}
          <PropertyCostSummary
            propertyPrice={property.price}
            propertyType={property.type}
            city={property.city}
          />

          {/* Requirement 5: Professional Share Property Section */}
          <PropertyShareSection
            propertyId={property.id}
            propertyTitle={property.title}
            city={property.city}
            price={property.price}
          />

          {/* Customer Reviews & Star Ratings (Preserved) */}
          <PropertyReviews propertyId={property.id} initialReviews={property.reviews as any} />

          {/* Requirement 10: Related Properties Section (6 to 8 Comps with Category Tabs) */}
          <RelatedPropertiesSection
            currentCity={property.city}
            currentType={property.type}
            similarProperties={similarProperties}
            nearbyProperties={nearbyProperties}
            aiRecommendedProperties={aiRecommendedProperties}
          />
        </div>

        {/* ════════════════════════════════════════════════════════
            RIGHT COLUMN (1 COL): Concierge, Tour Schedule, Actions, AI
           ════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-sm sticky top-24 space-y-5">
            <h3 className="font-bold font-serif text-[#07111F] text-lg">
              Contact Concierge &amp; Bookings
            </h3>

            {/* Direct Concierge Line */}
            <div className="space-y-2.5">
              <a
                href="tel:+252612000000"
                className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E1D4] bg-[#F7F3EA] text-sm text-[#07111F] hover:text-[#C89B3C] font-semibold transition-colors"
              >
                <div className="w-9 h-9 bg-[#FCFBF7] rounded-xl flex items-center justify-center border border-[#E8E1D4] text-[#C89B3C]">
                  <Phone className="h-4 w-4" />
                </div>
                <span>+252 61 200 0000</span>
              </a>
              <a
                href="mailto:concierge@kiro-maal.so"
                className="flex items-center gap-3 p-3 rounded-2xl border border-[#E8E1D4] bg-[#F7F3EA] text-sm text-[#07111F] hover:text-[#C89B3C] font-semibold transition-colors"
              >
                <div className="w-9 h-9 bg-[#FCFBF7] rounded-xl flex items-center justify-center border border-[#E8E1D4] text-[#C89B3C]">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="truncate">concierge@kiro-maal.so</span>
              </a>
            </div>

            {/* Requirement 8: Schedule Tour Feature (Physical, 360 Virtual, Video Call) */}
            <div className="pt-2 border-t border-[#E8E1D4]">
              <p className="text-xs font-bold text-[#6B7280] mb-2 uppercase tracking-wider">
                Schedule a Visit
              </p>
              <PropertyScheduleTourModal
                propertyId={property.id}
                propertyTitle={property.title}
                propertyCity={property.city}
                propertyPrice={property.price}
              />
            </div>

            {/* Preserved Property Actions (Inquire / Direct Booking) */}
            <div className="pt-2 border-t border-[#E8E1D4]">
              <p className="text-xs font-bold text-[#6B7280] mb-2 uppercase tracking-wider">
                Inquire or Purchase
              </p>
              <PropertyActions
                propertyId={property.id}
                propertyTitle={property.title}
                propertyPrice={property.price}
                listingType={property.listingType}
                status={property.status}
                availabilityStatus={property.availabilityStatus}
                rentPeriod={property.rentPeriod}
                securityDeposit={property.securityDeposit}
                isNegotiable={property.isNegotiable}
                managerId={property.managerId}
              />
            </div>
          </div>

          {/* AI Assistant Concierge Card */}
          <div className="bg-[#07111F] border border-[#C89B3C]/30 rounded-3xl p-6 text-white shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#C89B3C] to-[#D9B45B] flex items-center justify-center text-[#07111F] mb-3">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold font-serif text-[#FCFBF7] mb-1">Have Questions?</h4>
            <p className="text-[#94A3B8] text-xs mb-4">
              Ask our 24/7 AI concierge about this property, valuation analysis, neighborhood safety, or legal verification.
            </p>
            <OpenAIChatButton
              prefillMessage={`Tell me more about ${property.title} in ${property.city} listed at $${property.price.toLocaleString()}`}
              className="w-full bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] hover:brightness-105 text-[#07111F] font-bold rounded-xl text-xs py-2.5 shadow-md shadow-[#C89B3C]/20 border border-[#A97918]/30 cursor-pointer flex items-center justify-center gap-2"
            >
              Ask AI Concierge
            </OpenAIChatButton>
          </div>
        </div>
      </div>
    </div>
  );
}
