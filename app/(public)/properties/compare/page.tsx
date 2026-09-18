// ================================================================
// PAGE NAME  : Property Comparison Page
// ROUTE      : /properties/compare
// DESCRIPTION: Side-by-side comparison of selected real estate properties
// ================================================================
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, ArrowLeft, Check, X, Star, MapPin, Scale } from "lucide-react";
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
    <div className="min-h-screen bg-[#F8FAFC] py-10">
      <div className="section-container space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/properties" className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#10B981] mb-2 font-medium">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Properties
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
              <Scale className="h-7 w-7 text-[#10B981]" /> Compare Properties
            </h1>
            <p className="text-[#64748B] text-sm mt-1">
              Compare key specifications, pricing, amenities, and ratings side by side.
            </p>
          </div>
        </div>

        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-[#E2E8F0] shadow-card space-y-4 max-w-lg mx-auto">
            <Scale className="h-12 w-12 text-[#94A3B8] mx-auto opacity-40" />
            <h2 className="text-xl font-bold text-[#0F172A]">No Properties Selected for Comparison</h2>
            <p className="text-xs text-[#64748B]">
              Select properties from the listings page or pass property IDs in the URL parameter (e.g. `?ids=id1,id2`) to compare them.
            </p>
            <Button asChild className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl">
              <Link href="/properties">Browse Properties</Link>
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold text-[#64748B] w-48 sticky left-0 bg-[#F8FAFC] z-10">
                    Property Specs
                  </th>
                  {properties.map((p) => (
                    <th key={p.id} className="p-4 text-left min-w-[240px] align-top">
                      <div className="space-y-2">
                        <div className="h-36 rounded-xl bg-[#E2E8F0] overflow-hidden relative">
                          {p.images[0] ? (
                            <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                              <Building2 className="h-8 w-8" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-[#0F172A] text-sm line-clamp-1">{p.title}</h3>
                        <p className="text-base font-bold text-[#059669]">{formatPrice(p.price)}</p>
                        <Button asChild size="sm" className="w-full bg-[#0F172A] hover:bg-[#1E293B] text-white rounded-xl text-xs">
                          <Link href={`/properties/${p.id}`}>View Details</Link>
                        </Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                <tr>
                  <td className="p-4 font-semibold text-[#0F172A] bg-[#F8FAFC] sticky left-0">City &amp; Location</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#64748B] text-xs">
                      <span className="flex items-center gap-1 font-medium text-[#0F172A]">
                        <MapPin className="h-3.5 w-3.5 text-[#10B981]" /> {p.city} ({p.location})
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0F172A] bg-[#F8FAFC] sticky left-0">Property Type</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#64748B] text-xs">
                      <span className="px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] font-semibold">
                        {getPropertyTypeLabel(p.type)}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0F172A] bg-[#F8FAFC] sticky left-0">Bedrooms &amp; Baths</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#0F172A] text-xs font-medium">
                      🛏️ {p.bedrooms} Beds • 🚿 {p.bathrooms} Baths
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0F172A] bg-[#F8FAFC] sticky left-0">Total Area</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#0F172A] text-xs font-medium">
                      📐 {p.area} m² (${Math.round(p.price / (p.area || 1))}/m²)
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0F172A] bg-[#F8FAFC] sticky left-0">Year Built</td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#64748B] text-xs">
                      {p.yearBuilt || "N/A"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="p-4 font-semibold text-[#0F172A] bg-[#F8FAFC] sticky left-0">Average Rating</td>
                  {properties.map((p) => {
                    const avgRating = p.reviews.length > 0
                      ? (p.reviews.reduce((acc, r) => acc + r.rating, 0) / p.reviews.length).toFixed(1)
                      : "5.0";
                    return (
                      <td key={p.id} className="p-4 text-[#0F172A] text-xs font-bold flex items-center gap-1">
                        <Star className="h-4 w-4 text-[#EAB308] fill-[#EAB308]" /> {avgRating} ({p.reviews.length} reviews)
                      </td>
                    );
                  })}
                </tr>

                {/* Amenities comparison rows */}
                {allAmenities.length > 0 && (
                  <tr>
                    <td colSpan={properties.length + 1} className="p-3 bg-[#F1F5F9] font-bold text-[#0F172A] text-xs uppercase tracking-wider">
                      Amenities &amp; Features Comparison
                    </td>
                  </tr>
                )}
                {allAmenities.map((amenity) => (
                  <tr key={amenity}>
                    <td className="p-4 font-semibold text-[#0F172A] bg-[#F8FAFC] sticky left-0 text-xs">{amenity}</td>
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
                            <span className="inline-flex items-center gap-1 text-[#059669] font-bold">
                              <Check className="h-4 w-4 text-[#10B981]" /> Included
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[#94A3B8]">
                              <X className="h-4 w-4" /> No
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
