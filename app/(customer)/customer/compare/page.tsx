// ================================================================
// PAGE NAME  : Customer Portal — Compare Properties
// ROUTE      : /customer/compare
// DESCRIPTION: Side-by-side comparative analysis of properties
//              inside the customer dashboard layout
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
  Scale,
  Building2,
  ArrowLeft,
  Check,
  X,
  MapPin,
  Sparkles,
  Bed,
  Bath,
  Maximize,
  DollarSign,
  Plus,
} from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Properties – Customer Portal | Kiro-Maal Real Estate",
};

export default async function CustomerComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { ids } = await searchParams;
  const propertyIds = ids ? ids.split(",").filter(Boolean) : [];

  // If no IDs provided, default to picking up to 3 featured or recent properties
  let properties = [];
  if (propertyIds.length > 0) {
    properties = await prisma.property.findMany({
      where: { id: { in: propertyIds }, status: "APPROVED" },
      include: {
        images: { take: 1, orderBy: { order: "asc" } },
      },
    });
  } else {
    // Show top 3 properties to compare as default demonstration
    properties = await prisma.property.findMany({
      where: { status: "APPROVED" },
      take: 3,
      include: {
        images: { take: 1, orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Also fetch customer's favorites so they can easily swap or add
  const customerFavorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        select: { id: true, title: true, price: true, city: true, type: true },
      },
    },
    take: 6,
  });

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
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      {/* ─── Header ─── */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Side-by-Side Analysis
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
            <Scale className="h-7 w-7 text-[#C89B3C]" /> Compare Properties
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
            Compare prices, specifications, locations, and amenities side-by-side
          </p>
        </div>

        <Link
          href="/customer/properties"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold hover:brightness-105 transition-all shadow-xs self-start sm:self-auto"
        >
          <Building2 className="w-4 h-4" /> Browse More Listings
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-12 text-center max-w-md mx-auto shadow-xs">
          <Scale className="w-12 h-12 text-[#C89B3C] mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-sm text-[#07111F]">No properties selected to compare</h3>
          <p className="text-xs text-[#6B7280] mt-1 mb-4">
            Select properties from the catalog to run a side-by-side comparison.
          </p>
          <Link
            href="/customer/properties"
            className="inline-block text-xs font-bold text-[#07111F] bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] px-5 py-2.5 rounded-xl"
          >
            Go to Properties Catalog
          </Link>
        </div>
      ) : (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-[#E8E1D4] bg-[#FAF7F2]">
                  <th className="p-4 text-left text-xs font-bold text-[#6B7280] uppercase tracking-wider w-48 shrink-0">
                    Feature
                  </th>
                  {properties.map((p) => (
                    <th key={p.id} className="p-4 text-left w-72 min-w-[260px] align-top">
                      <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 bg-slate-100 border border-[#E8E1D4]">
                        {p.images[0]?.url ? (
                          <Image
                            src={p.images[0].url}
                            alt={p.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Building2 className="w-8 h-8" />
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#07111F]/80 text-[#D9B45B] text-[10px] font-bold uppercase backdrop-blur-xs">
                          {p.type}
                        </span>
                      </div>
                      <h4 className="font-bold text-[#07111F] text-sm leading-snug line-clamp-2">
                        {p.title}
                      </h4>
                      <p className="text-lg font-serif font-black text-[#C89B3C] mt-1">
                        {formatPrice(Number(p.price))}
                      </p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4] text-xs">
                {/* Location */}
                <tr className="hover:bg-white/50 transition-colors">
                  <td className="p-4 font-bold text-[#07111F] bg-[#FAF7F2]/50">
                    City & Location
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#475569]">
                      <div className="flex items-center gap-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
                        <span>{p.city}</span>
                        {p.location && (
                          <span className="text-[#8C7A6B]">({p.location})</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Bedrooms & Bathrooms */}
                <tr className="hover:bg-white/50 transition-colors">
                  <td className="p-4 font-bold text-[#07111F] bg-[#FAF7F2]/50">
                    Bedrooms / Baths
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 font-semibold text-[#07111F]">
                      {p.bedrooms || 1} Beds · {p.bathrooms || 1} Baths
                    </td>
                  ))}
                </tr>

                {/* Area */}
                <tr className="hover:bg-white/50 transition-colors">
                  <td className="p-4 font-bold text-[#07111F] bg-[#FAF7F2]/50">
                    Total Area
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 font-semibold text-[#07111F]">
                      {p.area ? `${p.area} m²` : "N/A"}
                    </td>
                  ))}
                </tr>

                {/* Furnished */}
                <tr className="hover:bg-white/50 transition-colors">
                  <td className="p-4 font-bold text-[#07111F] bg-[#FAF7F2]/50">
                    Furnished
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4">
                      {p.isFurnished ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold text-[11px]">
                          <Check className="w-3.5 h-3.5" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                          <X className="w-3.5 h-3.5" /> No
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* Parking */}
                <tr className="hover:bg-white/50 transition-colors">
                  <td className="p-4 font-bold text-[#07111F] bg-[#FAF7F2]/50">
                    Parking Spots
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 font-semibold text-[#07111F]">
                      {p.parking ? `${p.parking} Spaces` : "None"}
                    </td>
                  ))}
                </tr>

                {/* Year Built */}
                <tr className="hover:bg-white/50 transition-colors">
                  <td className="p-4 font-bold text-[#07111F] bg-[#FAF7F2]/50">
                    Year Built
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-[#475569]">
                      {p.yearBuilt || "Recent"}
                    </td>
                  ))}
                </tr>

                {/* Amenities */}
                {allAmenities.map((amenity: any) => (
                  <tr key={amenity} className="hover:bg-white/50 transition-colors">
                    <td className="p-4 font-medium text-[#475569] bg-[#FAF7F2]/50">
                      {amenity}
                    </td>
                    {properties.map((p) => {
                      let hasAmenity = false;
                      try {
                        const parsed = p.amenities ? JSON.parse(p.amenities) : [];
                        hasAmenity = parsed.includes(amenity);
                      } catch {
                        hasAmenity = false;
                      }
                      return (
                        <td key={p.id} className="p-4">
                          {hasAmenity ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <X className="w-4 h-4 text-slate-300" />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Actions */}
                <tr className="bg-[#FAF7F2]/80">
                  <td className="p-4 font-bold text-[#07111F]">
                    Inquire / Book
                  </td>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4">
                      <Link
                        href={`/customer/properties/${p.id}`}
                        className="inline-flex items-center justify-center w-full py-2 px-3 rounded-xl bg-[#07111F] hover:bg-[#142642] text-[#D9B45B] font-bold text-xs transition-colors shadow-xs"
                      >
                        View Full Details
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
