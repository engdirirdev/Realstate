export const revalidate = 30;
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
import { Building2, Filter, Sparkles } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import CustomerPropertiesFilterForm from "@/components/customer/CustomerPropertiesFilterForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Properties – Customer Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
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
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const city = typeof params.city === "string" ? params.city : "";
  const type = typeof params.type === "string" ? params.type : "";
  const listingType = typeof params.listingType === "string" ? params.listingType : "";
  const sort = typeof params.sort === "string" ? params.sort : "latest";
  const maxPrice = typeof params.maxPrice === "string" && !isNaN(Number(params.maxPrice)) ? Number(params.maxPrice) : null;
  const minPrice = typeof params.minPrice === "string" && !isNaN(Number(params.minPrice)) ? Number(params.minPrice) : null;

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
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
      { location: { contains: q } },
      { city: { contains: q } },
    ];
  }
  if (maxPrice !== null) {
    where.price = { ...(where.price || {}), lte: maxPrice };
  }
  if (minPrice !== null) {
    where.price = { ...(where.price || {}), gte: minPrice };
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

        </div>

        {/* Filter Toolbar */}
        <CustomerPropertiesFilterForm availableCities={availableCities} types={TYPES} initialFilters={{ q, city, type, listingType, sort }} />
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
