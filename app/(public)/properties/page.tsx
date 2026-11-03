// ================================================================
// PAGE NAME  : Properties Listing Page
// ROUTE      : /properties
// DESCRIPTION: Browse all approved property listings with filters
//              for city, type, bedrooms, price range
// ================================================================
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  MapPin,
  KeyRound,
  Building2,
  BedDouble,
  DollarSign,
  ArrowUpDown,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import SaveSearchButton from "@/components/SaveSearchButton";
import ResetFilterButton from "@/components/ResetFilterButton";
import PropertyCard from "@/components/PropertyCard";
import { resolveLocation } from "@/lib/ai/nlu/location-resolver";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties Directory – Kiro-Maal Luxury Real Estate Somalia",
  description:
    "Browse verified luxury villas, modern apartments, prime commercial land, and residential houses across Mogadishu, Hargeisa, and Somalia.",
  alternates: {
    canonical: "/properties",
  },
  openGraph: {
    title: "Properties Directory – Kiro-Maal Luxury Real Estate Somalia",
    description:
      "Browse verified luxury villas, modern apartments, prime commercial land, and residential houses across Mogadishu, Hargeisa, and Somalia.",
    type: "website",
    url: "/properties",
  },
  twitter: {
    card: "summary_large_image",
    title: "Properties Directory – Kiro-Maal Luxury Real Estate Somalia",
    description: "Browse verified luxury properties across Somalia with AI-powered valuations.",
  },
};

export const revalidate = 60; // ISR: refresh every minute

function mapCategoryToPropertyType(name: string, slug?: string): string {
  const s = `${slug || ""} ${name}`.toLowerCase();
  if (s.includes("apartment") || s.includes("flat") || s.includes("condo") || s.includes("penthouse")) return "APARTMENT";
  if (s.includes("villa") || s.includes("estate") || s.includes("mansion")) return "VILLA";
  if (s.includes("land") || s.includes("plot") || s.includes("farm") || s.includes("acre")) return "LAND";
  if (s.includes("office")) return "OFFICE";
  if (s.includes("warehouse") || s.includes("depot") || s.includes("storage") || s.includes("industrial") || s.includes("logistics")) return "WAREHOUSE";
  if (s.includes("shop") || s.includes("retail") || s.includes("store") || s.includes("mall")) return "SHOP";
  if (s.includes("commercial") || s.includes("business") || s.includes("plaza")) return "COMMERCIAL";
  if (s.includes("townhouse")) return "TOWNHOUSE";
  if (s.includes("studio")) return "STUDIO";
  if (s.includes("house") || s.includes("home") || s.includes("residential")) return "HOUSE";
  return "OTHER";
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const {
    location,
    city,
    type,
    listingType,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    furnished,
    parking,
    sort,
    q,
    search,
    district,
  } = params;

  const searchLocation = (location || city || "").toString().trim();
  const keywordQuery = (q || search || "").toString().trim();
  const explicitDistrict = (district || "").toString().trim();

  const where: any = {
    status: { in: ["APPROVED", "PUBLISHED"] },
    availabilityStatus: "AVAILABLE",
    isActive: true,
  };

  if (listingType && ["FOR_RENT", "FOR_SALE"].includes(String(listingType))) {
    where.listingType = String(listingType);
  }

  const andClauses: any[] = [];

  // 1. Keyword search (q / search) across relevant text fields
  if (keywordQuery) {
    andClauses.push({
      OR: [
        { title: { contains: keywordQuery } },
        { description: { contains: keywordQuery } },
        { location: { contains: keywordQuery } },
        { address: { contains: keywordQuery } },
        { city: { contains: keywordQuery } },
      ],
    });
  }

  // 2. City & District resolution with canonical normalization
  if (searchLocation) {
    const resolved = resolveLocation(searchLocation);
    if (resolved) {
      where.city = { contains: resolved.canonicalCity };
      if (resolved.district) {
        andClauses.push({
          OR: [
            { location: { contains: resolved.district } },
            { address: { contains: resolved.district } },
            { title: { contains: resolved.district } },
            { description: { contains: resolved.district } },
          ],
        });
      }
    } else {
      where.city = { contains: searchLocation };
    }
  }

  if (explicitDistrict) {
    andClauses.push({
      OR: [
        { location: { contains: explicitDistrict } },
        { address: { contains: explicitDistrict } },
        { title: { contains: explicitDistrict } },
        { description: { contains: explicitDistrict } },
      ],
    });
  }

  // 3. Property Type (expand generic HOUSE to residential variants)
  if (type) {
    if (String(type).toUpperCase() === "HOUSE") {
      where.type = { in: ["HOUSE", "VILLA", "TOWNHOUSE"] };
    } else {
      where.type = String(type);
    }
  }

  // 4. Bedrooms with Studio (0 bed) support
  if (bedrooms !== undefined && bedrooms !== "") {
    const bedNum = Number(bedrooms);
    if (!isNaN(bedNum)) {
      if (bedNum === 0) {
        where.bedrooms = 0;
      } else {
        where.bedrooms = { gte: bedNum };
      }
    }
  }

  if (bathrooms) where.bathrooms = { gte: Number(bathrooms) };
  if (furnished === "true") where.isFurnished = true;
  if (parking) where.parking = { gte: Number(parking) };

  // 5. Price filtering
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice && !isNaN(Number(minPrice))) where.price.gte = Number(minPrice);
    if (maxPrice && !isNaN(Number(maxPrice))) where.price.lte = Number(maxPrice);
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  let orderBy: any = [{ isFeatured: "desc" }, { createdAt: "desc" }];
  if (sort === "price_asc") orderBy = [{ price: "asc" }, { createdAt: "desc" }];
  else if (sort === "price_desc") orderBy = [{ price: "desc" }, { createdAt: "desc" }];
  else if (sort === "area_desc") orderBy = [{ area: "desc" }, { createdAt: "desc" }];
  else if (sort === "newest") orderBy = [{ createdAt: "desc" }];

  // Fetch registered cities and categories from Admin registry + active properties
  const [registeredLocations, registeredCategories, properties, totalCount] = await Promise.all([
    prisma.location.findMany({
      select: { id: true, city: true, region: true, country: true },
      orderBy: { city: "asc" },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
    prisma.property.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        city: true,
        location: true,
        address: true,
        type: true,
        listingType: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        isFurnished: true,
        parking: true,
        status: true,
        availabilityStatus: true,
        isFeatured: true,
        viewCount: true,
        createdAt: true,
        images: {
          orderBy: { order: "asc" },
          take: 1,
          select: { id: true, url: true, isPrimary: true },
        },
      },
      orderBy,
      take: 40,
    }),
    prisma.property.count({ where }),
  ]);

  // Use strictly registered locations from admin
  const availableCities = registeredLocations.map((loc) => ({
    city: loc.city.trim(),
    region: loc.region?.trim(),
  }));

  const hasActiveFilters = Boolean(
    searchLocation || keywordQuery || explicitDistrict || listingType || type || minPrice || maxPrice || bedrooms || sort
  );

  return (
    <div className="bg-[#F7F3EA] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================================================================ */}
        {/* Header & Filter Card                                            */}
        {/* ================================================================ */}
        <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E8E1D4] mb-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-[11px] font-bold uppercase tracking-wider mb-2 shadow-xs">
                <Sparkles className="w-3 h-3 text-[#C89B3C]" />
                <span>Verified Listings Registry</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] tracking-tight">
                Kiro-Maal Properties
              </h1>
              <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
                Explore verified listings with AI valuations, price intelligence, and verified regional registry
              </p>
            </div>

            <SaveSearchButton
              filters={{
                location: searchLocation ? String(searchLocation) : undefined,
                type: type ? String(type) : undefined,
                minPrice: minPrice ? Number(minPrice) : undefined,
                maxPrice: maxPrice ? Number(maxPrice) : undefined,
                bedrooms: bedrooms ? Number(bedrooms) : undefined,
                bathrooms: bathrooms ? Number(bathrooms) : undefined,
              }}
            />
          </div>

          {/* ================================================================ */}
          {/* Professional Real Estate Filters Form                            */}
          {/* ================================================================ */}
          <form method="GET" className="space-y-4">
            {/* Top Row: Direct Fast Search Input */}
            <div className="relative">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
                <Search className="w-3 h-3 text-[#C89B3C]" />
                <span>Search Keywords / District / Property</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="q"
                  placeholder="Search by neighborhood (e.g. Hodan, Wadajir, Jigjiga Yar), title, or amenities (pool, garden)..."
                  defaultValue={keywordQuery}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all placeholder:text-[#9CA3AF] shadow-2xs"
                />
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918]" />
              </div>
            </div>

            {/* 6-Column Responsive Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {/* 1. Destination / City Selector (Admin-Registered) */}
              <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
                  <MapPin className="w-3 h-3 text-[#C89B3C]" />
                  <span>City / Location</span>
                </label>
                <div className="relative">
                  <select
                    name="location"
                    defaultValue={searchLocation ? String(searchLocation) : ""}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">All Registered Cities</option>
                    {availableCities.map((c) => (
                      <option key={c.city} value={c.city}>
                        {c.city} {c.region ? `(${c.region})` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
                </div>
              </div>

              {/* 2. Listing Purpose (Rent / Sale) */}
              <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
                  <KeyRound className="w-3 h-3 text-[#C89B3C]" />
                  <span>Listing Type</span>
                </label>
                <div className="relative">
                  <select
                    name="listingType"
                    defaultValue={listingType ? String(listingType) : ""}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">All (Rent &amp; Sale)</option>
                    <option value="FOR_RENT">For Rent</option>
                    <option value="FOR_SALE">For Sale</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
                </div>
              </div>

              {/* 3. Property Type */}
              <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
                  <Building2 className="w-3 h-3 text-[#C89B3C]" />
                  <span>Property Type</span>
                </label>
                <div className="relative">
                  <select
                    name="type"
                    defaultValue={type ? String(type) : ""}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">All Categories</option>
                    {registeredCategories.map((cat) => {
                      const code = mapCategoryToPropertyType(cat.name, cat.slug);
                      return (
                        <option key={cat.id} value={code}>
                          {cat.name}
                        </option>
                      );
                    })}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
                </div>
              </div>

              {/* 4. Bedrooms */}
              <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
                  <BedDouble className="w-3 h-3 text-[#C89B3C]" />
                  <span>Bedrooms</span>
                </label>
                <div className="relative">
                  <select
                    name="bedrooms"
                    defaultValue={bedrooms !== undefined ? String(bedrooms) : ""}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">Any Bedrooms</option>
                    <option value="0">Studio (0 Beds)</option>
                    <option value="1">1+ Bedrooms</option>
                    <option value="2">2+ Bedrooms</option>
                    <option value="3">3+ Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                    <option value="5">5+ Bedrooms</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
                </div>
              </div>

              {/* 5. Max Price / Budget (Dynamic for Rent vs Sale) */}
              <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
                  <DollarSign className="w-3 h-3 text-[#C89B3C]" />
                  <span>Max Budget</span>
                </label>
                <div className="relative">
                  <select
                    name="maxPrice"
                    defaultValue={maxPrice ? String(maxPrice) : ""}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
                  >
                    {listingType === "FOR_RENT" ? (
                      <>
                        <option value="">Any Monthly Rent</option>
                        <option value="250">Under $250 / mo</option>
                        <option value="500">Under $500 / mo</option>
                        <option value="1000">Under $1,000 / mo</option>
                        <option value="2500">Under $2,500 / mo</option>
                        <option value="5000">Under $5,000 / mo</option>
                      </>
                    ) : (
                      <>
                        <option value="">Any Price</option>
                        <option value="50000">Under $50,000</option>
                        <option value="100000">Under $100,000</option>
                        <option value="200000">Under $200,000</option>
                        <option value="500000">Under $500,000</option>
                        <option value="1000000">Under $1,000,000</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
                </div>
              </div>

              {/* 6. Sort Order */}
              <div className="relative group">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
                  <ArrowUpDown className="w-3 h-3 text-[#C89B3C]" />
                  <span>Sort Order</span>
                </label>
                <div className="relative">
                  <select
                    name="sort"
                    defaultValue={sort ? String(sort) : ""}
                    className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
                  >
                    <option value="">Sort: Featured &amp; Newest</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                    <option value="area_desc">Size: Largest Area</option>
                    <option value="newest">Newest First</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E8E1D4]">
              <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>
                  Showing <strong className="text-[#07111F]">{totalCount}</strong> verified properties
                </span>
                {hasActiveFilters && (
                  <span className="text-[10px] font-bold uppercase text-[#A97918] bg-[#C89B3C]/10 border border-[#C89B3C]/30 px-2 py-0.5 rounded-full ml-1">
                    Filters Active
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <ResetFilterButton />

                <Button
                  type="submit"
                  className="flex-1 sm:flex-initial bg-gradient-to-r from-[#D9A336] via-[#E8B849] to-[#C99126] hover:brightness-105 text-[#07111F] rounded-xl text-xs font-black h-11 px-7 gap-2 shadow-md shadow-[#C99126]/25 border border-[#E8E1D4]/60 transition-all cursor-pointer"
                >
                  <Filter className="h-4 w-4 text-[#07111F]" />
                  <span>Apply Filters</span>
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* ================================================================ */}
        {/* Property Grid Results                                            */}
        {/* ================================================================ */}
        {properties.length === 0 ? (
          <div className="text-center py-20 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] shadow-sm">
            <Search className="h-12 w-12 text-[#C89B3C] mx-auto mb-4 opacity-60" />
            <h3 className="text-lg font-bold font-serif text-[#07111F]">No properties found</h3>
            <p className="text-[#6B7280] text-xs sm:text-sm mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any listings matching your search filters. Try adjusting your criteria or clearing filters.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-gradient-to-r from-[#D9A336] via-[#E8B849] to-[#C99126] text-[#07111F] text-xs font-bold rounded-xl shadow-md shadow-[#C99126]/20 hover:brightness-105 transition-all"
            >
              View All Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((p, index) => (
              <PropertyCard key={p.id} property={p as any} priority={index < 4} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
