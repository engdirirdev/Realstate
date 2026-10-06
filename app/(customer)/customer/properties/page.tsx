// ================================================================
// PAGE NAME  : Customer Portal — Browse Properties
// ROUTE      : /customer/properties
// DESCRIPTION: In-portal property browsing with smart filters,
//              saved favorites, and detailed cards
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Search, Filter, Sparkles, SlidersHorizontal } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Properties – Customer Portal | Kiro-Maal Real Estate",
};



const TYPES = [
  { value: "", label: "All Types" },
  { value: "VILLA", label: "Villas" },
  { value: "APARTMENT", label: "Apartments" },
  { value: "HOUSE", label: "Houses" },
  { value: "COMMERCIAL", label: "Commercial" },
  { value: "OFFICE", label: "Offices" },
  { value: "LAND", label: "Lands" },
  { value: "TOWNHOUSE", label: "Townhouses" },
  { value: "STUDIO", label: "Studios" },
];

export default async function CustomerPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const city = typeof params.city === "string" ? params.city : "";
  const type = typeof params.type === "string" ? params.type : "";
  const listingType = typeof params.listingType === "string" ? params.listingType : "";
  const sort = typeof params.sort === "string" ? params.sort : "latest";

  const where: any = {
    status: { in: ["APPROVED", "PUBLISHED"] },
    availabilityStatus: "AVAILABLE",
    isActive: true,
  };
  if (city && city !== "All Cities") where.city = city;
  if (type) where.type = type;
  if (listingType && ["FOR_RENT", "FOR_SALE"].includes(listingType)) {
    where.listingType = listingType;
  }

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "area_desc") orderBy = { area: "desc" };

  const [properties, userFavorites, registeredLocations, propertyCities] = await Promise.all([
    prisma.property.findMany({
      where,
      include: {
        images: { orderBy: { order: "asc" }, take: 1 },
      },
      orderBy,
      take: 40,
    }),
    prisma.favorite.findMany({
      where: { userId: session.user.id },
      select: { propertyId: true },
    }),
    prisma.location.findMany({
      select: { city: true, region: true },
      orderBy: { city: "asc" },
    }),
    prisma.property.findMany({
      where: { isActive: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  const cityMap = new Map<string, { city: string; region?: string }>();
  for (const loc of registeredLocations) {
    if (loc.city) {
      cityMap.set(loc.city.trim().toLowerCase(), {
        city: loc.city.trim(),
        region: loc.region?.trim(),
      });
    }
  }
  for (const p of propertyCities) {
    if (p.city && !cityMap.has(p.city.trim().toLowerCase())) {
      cityMap.set(p.city.trim().toLowerCase(), { city: p.city.trim() });
    }
  }
  const availableCities = Array.from(cityMap.values()).sort((a, b) => a.city.localeCompare(b.city));

  const favoriteIds = new Set(userFavorites.map((f) => f.propertyId));

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      {/* ─── Header & Filters ─── */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF7F2] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Verified Listings Catalog
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
              <Building2 className="h-7 w-7 text-[#C89B3C]" /> Browse Verified Properties
            </h1>
            <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
              Explore luxury villas, modern apartments, and prime commercial plots across Somalia
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/customer/compare"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#FAF7F2] text-[#07111F] hover:bg-white border border-[#E8E1D4] hover:border-[#C89B3C] transition-all shadow-xs"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#C89B3C]" />
              <span>Compare Properties</span>
            </Link>
          </div>
        </div>

        {/* Filter Toolbar */}
        <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-4 border-t border-[#E8E1D4]">
          {/* Listing Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
              Listing Type
            </label>
            <select
              name="listingType"
              defaultValue={listingType}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-semibold focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-hidden transition-all"
            >
              <option value="">All (Rent &amp; Sale)</option>
              <option value="FOR_RENT">For Rent</option>
              <option value="FOR_SALE">For Sale</option>
            </select>
          </div>

          {/* City Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
              Location / City
            </label>
            <select
              name="city"
              defaultValue={city}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-semibold focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-hidden transition-all"
            >
              <option value="">All Registered Cities</option>
              {availableCities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} {c.region ? `(${c.region})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
              Property Type
            </label>
            <select
              name="type"
              defaultValue={type}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-hidden transition-all"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
              Sort By
            </label>
            <select
              name="sort"
              defaultValue={sort}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-hidden transition-all"
            >
              <option value="latest">Newest Listings</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Largest Area</option>
            </select>
          </div>

          {/* Submit */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-4 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold hover:brightness-105 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" /> Filter Listings
            </button>
            {(city || type || sort !== "latest") && (
              <Link
                href="/customer/properties"
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                title="Reset Filters"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* ─── Listings Grid ─── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-bold text-[#07111F]">
          Showing <span className="text-[#C89B3C]">{properties.length}</span> Verified Properties
        </p>
      </div>

      {properties.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-12 text-center max-w-md mx-auto shadow-xs">
          <Building2 className="w-12 h-12 text-[#C89B3C] mx-auto mb-3 opacity-60" />
          <h3 className="font-bold text-sm text-[#07111F]">No properties found</h3>
          <p className="text-xs text-[#6B7280] mt-1 mb-4">
            Try adjusting your search filters or resetting your parameters.
          </p>
          <Link
            href="/customer/properties"
            className="inline-block text-xs font-bold text-[#A97918] bg-[#F7F3EA] px-4 py-2 rounded-xl border border-[#E8E1D4]"
          >
            Clear Filters
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={{
                ...property,
                price: Number(property.price),
                area: property.area ?? undefined,
                bedrooms: property.bedrooms ?? undefined,
                bathrooms: property.bathrooms ?? undefined,
                parking: property.parking ?? undefined,
                images: property.images.map((img) => ({
                  url: img.url,
                  altText: img.altText ?? undefined,
                })),
              }}
              isFavorited={favoriteIds.has(property.id)}
              href={`/customer/properties/${property.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
