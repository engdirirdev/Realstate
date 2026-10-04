// ================================================================
// PAGE NAME  : Property Comparison Page
// ROUTE      : /properties/compare
// DESCRIPTION: Side-by-side comparison of selected real estate properties
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, ArrowLeft, Check, X, Star, MapPin, Scale, Sparkles } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function PropertyComparePage({ searchParams }: Props) {
  const { ids } = await searchParams;
  const propertyIds = ids ? ids.split(",").filter(Boolean) : [];

  const properties = propertyIds.length > 0
    ? await prisma.property.findMany({
        where: { id: { in: propertyIds } },
        include: {
          images: { take: 1, orderBy: { order: "asc" } },
          reviews: true,
        },
      })
    : [];

  const allAmenities = Array.from(
    new Set(
      properties.flatMap((p) => {
        try {
          return p.amenities ? JSON.parse(p.amenities) : [];
        } catch {
          return [];
        }
      })
    )
  );

  return (
    <div className="min-h-screen bg-[#F7F3EA] py-10">
      <div className="section-container space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/properties" className="inline-flex items-center gap-1.5 text-xs text-[#6B7280] hover:text-[#C89B3C] mb-2 font-medium transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Properties
            </Link>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#07111F] text-[#D9B45B]">
                <Scale className="h-5 w-5" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] tracking-tight">
                Compare Properties
              </h1>
            </div>
            <p className="text-[#6B7280] text-sm mt-1">
              Side-by-side comparative analysis of architectural specifications, market valuation, and luxury amenities.
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-[#FCFBF7] rounded-2xl p-12 text-center border border-[#E8E1D4] shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B]">
              <Scale className="h-7 w-7 opacity-80" />
            </div>
            <h2 className="text-xl font-serif font-bold text-[#07111F]">No Properties Selected for Comparison</h2>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Select properties from our exclusive listings or pass property IDs in the URL query to compare them side by side.
            </p>
            <Button asChild className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl border-0 shadow-sm">
              <Link href="/properties">Browse Verified Listings</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#07111F] text-white border-b border-[#C89B3C]/30">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wider text-[#D9B45B] w-48 sticky left-0 bg-[#07111F] z-10 border-r border-[#0B1728]">
                    Property Specs
                  </th>
                  {properties.map((p) => (
                    <th key={p.id} className="p-4 text-left min-w-[260px] align-top bg-[#07111F]">
                      <div className="space-y-3">
                        <div className="h-36 rounded-xl bg-[#0B1728] overflow-hidden relative border border-[#C89B3C]/30">
                          {p.images[0] ? (
                            <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                              <Building2 className="h-8 w-8" />
                            </div>
                          )}
                          <span className="absolute top-2 left-2 bg-[#07111F]/80 backdrop-blur-sm text-[#D9B45B] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#C89B3C]/40">
                            {p.city}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-white text-sm line-clamp-1">{p.title}</h3>
                          <p className="text-base font-bold text-[#D9B45B] mt-0.5">{formatPrice(p.price)}</p>
                        </div>
                        <Button asChild size="sm" className="w-full bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 rounded-xl text-xs border-0 shadow-sm">
                          <Link href={`/properties/${p.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                <tr className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#07111F] bg-[#FCFBF7] sticky left-0 border-r border-[#E8E1D4] text-xs">City &amp; Location</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#6B7280] text-xs">
                      <span className="flex items-center gap-1 font-medium text-[#07111F]">
                        <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {p.city} ({p.location})
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#07111F] bg-[#FCFBF7] sticky left-0 border-r border-[#E8E1D4] text-xs">Property Type</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#6B7280] text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30 font-semibold text-[11px]">
                        {getPropertyTypeLabel(p.type)}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#07111F] bg-[#FCFBF7] sticky left-0 border-r border-[#E8E1D4] text-xs">Bedrooms &amp; Baths</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#07111F] text-xs font-medium">
                      🛏️ {p.bedrooms} Beds • 🚿 {p.bathrooms} Baths
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#07111F] bg-[#FCFBF7] sticky left-0 border-r border-[#E8E1D4] text-xs">Total Area</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#07111F] text-xs font-medium">
                      📐 {p.area} m² (${Math.round(p.price / (p.area || 1))}/m²)
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#07111F] bg-[#FCFBF7] sticky left-0 border-r border-[#E8E1D4] text-xs">Year Built</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#6B7280] text-xs font-medium">
                      {p.yearBuilt || "N/A"}
                    </td>
                  ))}
                </tr>
                <tr className="hover:bg-[#F7F3EA]/50 transition-colors">
                  <td className="p-4 font-semibold text-[#07111F] bg-[#FCFBF7] sticky left-0 border-r border-[#E8E1D4] text-xs">Average Rating</td>
                  {properties.map((p) => {
                    const avgRating = p.reviews.length > 0
                      ? (p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length).toFixed(1)
                      : "5.0";
                    return (
                      <td key={p.id} className="p-4 text-[#07111F] text-xs font-bold flex items-center gap-1">
                        <Star className="h-4 w-4 text-[#C89B3C] fill-[#C89B3C]" /> {avgRating} ({p.reviews.length} reviews)
                      </td>
                    );
                  })}
                </tr>

                {/* Amenities comparison rows */}
                {allAmenities.length > 0 && (
                  <tr>
                    <td colSpan={properties.length + 1} className="p-3 bg-[#F7F3EA] font-serif font-bold text-[#07111F] text-xs uppercase tracking-wider border-y border-[#E8E1D4]">
                      Features &amp; Luxury Amenities
                    </td>
                  </tr>
                )}
                {allAmenities.map((amenity) => (
                  <tr key={amenity} className="hover:bg-[#F7F3EA]/50 transition-colors">
                    <td className="p-4 font-semibold text-[#07111F] bg-[#FCFBF7] sticky left-0 border-r border-[#E8E1D4] text-xs">{amenity}</td>
                    {properties.map((p) => {
                      let hasAmenity = false;
                      try {
                        hasAmenity = p.amenities ? JSON.parse(p.amenities).includes(amenity) : false;
                      } catch {
                        hasAmenity = false;
                      }
                      return (
                        <td key={p.id} className="p-4 text-xs">
                          {hasAmenity ? (
                            <span className="inline-flex items-center gap-1.5 text-[#07111F] font-bold">
                              <Check className="h-4 w-4 text-[#C89B3C]" /> Included
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]">
                              <X className="h-3.5 w-3.5 text-[#9CA3AF]" /> Not Available
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
