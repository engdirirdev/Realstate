// ================================================================
// PAGE NAME  : Property Detail Page
// ROUTE      : /properties/[id]
// DESCRIPTION: Full property details — image gallery, specs,
//              amenities, video tour, property documents,
//              ratings & reviews, compare property button,
//              and booking/inquiry actions.
// ================================================================
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import Link from "next/link";
import {
  MapPin, BedDouble, Bath, SquareStack, Building2,
  Phone, Mail, ArrowLeft, Star, Video, FileText, Scale,
  Sparkles, Compass, CheckCircle2, School, Hospital, ShoppingBag, ShieldAlert, Car, Sofa
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyActions from "@/components/PropertyActions";
import PropertyReviews from "@/components/PropertyReviews";
import MortgageCalculator from "@/components/MortgageCalculator";
import PropertyShareAndReport from "@/components/PropertyShareAndReport";
import { calculatePropertyScore, getSimilarProperties, getAreaMarketInsights } from "@/lib/recommendation-engine";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return { title: "Property Not Found" };
  return {
    title: `${property.title} – AI Real Estate`,
    description: property.description.slice(0, 155),
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      documents: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!property) notFound();

  const [similarProperties, areaInsights] = await Promise.all([
    getSimilarProperties(property.id, 3),
    getAreaMarketInsights(property.city),
  ]);

  const aiScore = calculatePropertyScore(property);

  const mainImage = property.images[0]?.url;
  const sideImages = property.images.slice(1, 4);

  const details = [
    { label: "Property Type", value: getPropertyTypeLabel(property.type), icon: Building2 },
    { label: "Bedrooms", value: `${property.bedrooms}`, icon: BedDouble },
    { label: "Bathrooms", value: `${property.bathrooms}`, icon: Bath },
    { label: "Area", value: `${property.area} m²`, icon: SquareStack },
    { label: "City", value: property.city, icon: MapPin },
    { label: "Year Built", value: property.yearBuilt ? `${property.yearBuilt}` : "N/A", icon: Star },
    { label: "Parking", value: (property as any).parking ? `${(property as any).parking} Spaces` : "Street / Included", icon: Car },
    { label: "Furnished", value: (property as any).isFurnished ? "Fully Furnished" : "Unfurnished", icon: Sofa },
  ];

  // Dynamic nearby amenities based on Somali city districts
  const nearbyLandmarks = [
    { name: "Primary & International Schools", distance: "0.8 km (5 min walk)", icon: School, color: "text-[#3B82F6] bg-[#3B82F6]/10" },
    { name: "Regional Hospital & Health Clinic", distance: "1.4 km (4 min drive)", icon: Hospital, color: "text-[#EF4444] bg-[#EF4444]/10" },
    { name: "Local Mosque & Community Center", distance: "350 m (3 min walk)", icon: Compass, color: "text-[#10B981] bg-[#10B981]/10" },
    { name: "Supermarket & Fresh Produce Bazaar", distance: "600 m (7 min walk)", icon: ShoppingBag, color: "text-[#8B5CF6] bg-[#8B5CF6]/10" },
  ];

  return (
    <div className="section-container py-10 bg-[#F8FAFC]">
      {/* Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <Link href="/properties" className="inline-flex items-center gap-2 text-sm text-[#10B981] hover:text-[#059669] font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </Link>
        <div className="flex items-center gap-2">
          <Link href={`/properties/compare?ids=${property.id}`}>
            <Button variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 border-[#E2E8F0] bg-white">
              <Scale className="h-4 w-4 text-[#10B981]" /> Compare
            </Button>
          </Link>
          <PropertyShareAndReport propertyId={property.id} propertyTitle={property.title} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Images + Details + Score + Features + Calculator + Reviews */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl overflow-hidden h-80">
            <div className="col-span-2 row-span-2 bg-gray-100">
              {mainImage ? (
                <img src={mainImage} alt={property.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC]">
                  <Building2 className="h-20 w-20 text-[#94A3B8]" />
                </div>
              )}
            </div>
            {sideImages.length > 0 ? sideImages.map((img) => (
              <div key={img.id} className="bg-gray-100">
                <img src={img.url} alt={property.title} className="w-full h-full object-cover" />
              </div>
            )) : (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-[#94A3B8]" />
                </div>
              ))
            )}
          </div>

          {/* Title, price & AI Quality Score Gauge */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div>
                <span className="bg-[#D1FAE5] text-[#065F46] px-2.5 py-1 rounded-lg text-xs font-semibold mb-2 inline-block">
                  {getPropertyTypeLabel(property.type)}
                </span>
                <h1 className="font-display text-2xl font-bold text-[#0F172A]">{property.title}</h1>
                <p className="flex items-center gap-1.5 text-[#64748B] mt-1 text-sm">
                  <MapPin className="h-4 w-4 text-[#10B981]" /> {property.address}, {property.city}
                </p>
              </div>
              <div className="text-left sm:text-right flex-shrink-0">
                <div className="text-3xl font-bold text-[#059669]">{formatPrice(property.price)}</div>
                <span className="text-xs text-[#94A3B8]">Est. {formatPrice(areaInsights.avgPricePerM2)}/m² in {property.city}</span>
              </div>
            </div>

            {/* AI Property Quality & Investment Badge */}
            <div className="bg-gradient-to-r from-[#8B5CF6]/10 via-[#10B981]/10 to-[#3B82F6]/10 border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#8B5CF6] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  {aiScore.score}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#8B5CF6]" />
                    <span className="font-bold text-[#0F172A] text-sm">AI Quality & Investment Index</span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 text-[#7C3AED]">
                      {aiScore.label}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Analyzed against {areaInsights.totalInventory} neighborhood comps in {property.city}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#065F46] font-semibold bg-white px-3 py-1.5 rounded-lg border border-[#E2E8F0]">
                <CheckCircle2 className="h-4 w-4 text-[#10B981]" /> Market Trend: {areaInsights.trend}
              </div>
            </div>
          </div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {details.map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl p-3.5 flex items-center gap-3 shadow-card">
                <div className="w-8 h-8 bg-[#F8FAFC] rounded-lg flex items-center justify-center flex-shrink-0 border border-[#E2E8F0]">
                  <Icon className="h-4 w-4 text-[#10B981]" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-[#64748B] truncate">{label}</p>
                  <p className="font-bold text-[#0F172A] text-xs sm:text-sm truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Floor Plan or 360 Virtual Tour if uploaded */}
          {((property as any).floorPlanUrl || (property as any).virtualTourUrl) && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-3">
              <h2 className="font-bold text-[#0F172A] flex items-center gap-2">
                <Compass className="h-5 w-5 text-[#8B5CF6]" /> Architectural Floor Plan &amp; 360 Tour
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(property as any).floorPlanUrl && (
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-[#F8FAFC] p-2 text-center">
                    <img
                      src={(property as any).floorPlanUrl}
                      alt="Floor Plan"
                      className="w-full h-48 object-contain rounded-lg mb-2"
                    />
                    <a
                      href={(property as any).floorPlanUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#10B981] hover:underline"
                    >
                      View High-Resolution Floor Plan ➔
                    </a>
                  </div>
                )}
                {(property as any).virtualTourUrl && (
                  <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-black flex flex-col items-center justify-center p-6 text-white text-center">
                    <Compass className="h-10 w-10 text-[#8B5CF6] mb-2 animate-spin duration-3000" />
                    <p className="text-sm font-bold">Interactive 360° Virtual Walkthrough</p>
                    <p className="text-xs text-white/70 mt-1 mb-3">Explore room dimensions and panoramic views</p>
                    <a
                      href={(property as any).virtualTourUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#8B5CF6] hover:bg-[#7C3AED] rounded-xl text-xs font-semibold"
                    >
                      Launch 360 Tour ➔
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Video Tour Player if present */}
          {property.videoUrl && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-3">
              <h2 className="font-bold text-[#0F172A] flex items-center gap-2">
                <Video className="h-5 w-5 text-[#10B981]" /> Virtual Video Tour
              </h2>
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <iframe
                  src={property.videoUrl.replace("watch?v=", "embed/")}
                  className="w-full h-full border-0"
                  allowFullScreen
                  title="Virtual Property Video Tour"
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card">
            <h2 className="font-bold text-[#0F172A] mb-3">About This Property</h2>
            <p className="text-[#64748B] leading-relaxed whitespace-pre-line text-sm">{property.description}</p>
          </div>

          {/* Nearby Neighborhood Infrastructure */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-3">
            <h2 className="font-bold text-[#0F172A] flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#10B981]" /> Nearby Amenities &amp; Commute
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {nearbyLandmarks.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${item.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#0F172A]">{item.name}</p>
                      <p className="text-[11px] text-[#64748B]">{item.distance}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Mortgage Calculator */}
          <MortgageCalculator propertyPrice={property.price} />

          {/* Property Documents */}
          {property.documents.length > 0 && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-3">
              <h2 className="font-bold text-[#0F172A] flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#10B981]" /> Verified Property Documents ({property.documents.length})
              </h2>
              <div className="space-y-2">
                {property.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#0F172A]">
                      <FileText className="h-4 w-4 text-[#10B981]" /> {doc.title} ({doc.fileType || "PDF"})
                    </div>
                    <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-[#10B981] hover:underline">
                      Download / View PDF ➔
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features & Amenities */}
          {property.amenities && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card">
              <h2 className="font-bold text-[#0F172A] mb-3">Features &amp; Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(() => {
                  try {
                    const items: string[] = JSON.parse(property.amenities as string);
                    return items.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-xs text-[#64748B] border border-[#E2E8F0] rounded-lg px-3 py-2 bg-[#F8FAFC]">
                        <div className="w-1.5 h-1.5 bg-[#10B981] rounded-full" />
                        {f}
                      </div>
                    ));
                  } catch {
                    return <p className="text-sm text-[#94A3B8] col-span-2">{property.amenities}</p>;
                  }
                })()}
              </div>
            </div>
          )}

          {/* Customer Reviews & Star Ratings */}
          <PropertyReviews propertyId={property.id} initialReviews={property.reviews as any} />

          {/* Similar Properties Section */}
          {similarProperties.length > 0 && (
            <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-[#0F172A] text-lg">Similar Properties in {property.city}</h2>
                  <p className="text-xs text-[#64748B]">Comparable listings by type and budget</p>
                </div>
                <Link href={`/properties?location=${encodeURIComponent(property.city)}`} className="text-xs font-semibold text-[#10B981] hover:text-[#059669]">
                  Explore all comps →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {similarProperties.map((sim) => {
                  const simImg = sim.images[0]?.url;
                  return (
                    <Link key={sim.id} href={`/properties/${sim.id}`} className="group block bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-all">
                      <div className="h-32 bg-gray-100 overflow-hidden relative">
                        {simImg ? (
                          <img src={simImg} alt={sim.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-[#94A3B8]">No image</div>
                        )}
                        <span className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-semibold">
                          {getPropertyTypeLabel(sim.type)}
                        </span>
                      </div>
                      <div className="p-3">
                        <p className="text-xs font-bold text-[#0F172A] truncate group-hover:text-[#10B981]">{sim.title}</p>
                        <p className="text-sm font-bold text-[#059669] mt-1">{formatPrice(sim.price)}</p>
                        <p className="text-[11px] text-[#64748B] flex items-center gap-1 mt-0.5">
                          <BedDouble className="h-3 w-3" /> {sim.bedrooms} Beds • {sim.city}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Contact Sidebar */}
        <div className="space-y-4">
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-card sticky top-24">
            <h3 className="font-bold text-[#0F172A] mb-4">Contact Agent &amp; Tour</h3>
            <div className="space-y-3 mb-6">
              <a href="tel:+252612000000" className="flex items-center gap-3 text-sm text-[#64748B] hover:text-[#10B981]">
                <div className="w-9 h-9 bg-[#F8FAFC] rounded-lg flex items-center justify-center border border-[#E2E8F0]">
                  <Phone className="h-4 w-4 text-[#10B981]" />
                </div>
                +252 61 200 0000
              </a>
              <a href="mailto:hello@airealestate.so" className="flex items-center gap-3 text-sm text-[#64748B] hover:text-[#10B981]">
                <div className="w-9 h-9 bg-[#F8FAFC] rounded-lg flex items-center justify-center border border-[#E2E8F0]">
                  <Mail className="h-4 w-4 text-[#10B981]" />
                </div>
                hello@airealestate.so
              </a>
            </div>
            <PropertyActions
              propertyId={property.id}
              propertyTitle={property.title}
              propertyPrice={property.price}
            />
          </div>

          {/* AI Assistant Prompt */}
          <div className="bg-[#ECFEFF] border border-[#A5F3FC] rounded-2xl p-5 text-[#0891B2] shadow-card">
            <div className="text-2xl mb-2">🤖</div>
            <h4 className="font-bold text-[#0F172A] mb-1">Have Questions?</h4>
            <p className="text-[#0891B2] text-sm mb-3">Ask our AI assistant about this property, zoning or financing.</p>
            <Link href={`/ai-assistant?q=Tell me about ${encodeURIComponent(property.title)}`}>
              <Button className="w-full bg-[#10B981] text-white hover:bg-[#059669] rounded-xl text-sm">
                Ask AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
