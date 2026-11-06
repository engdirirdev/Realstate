// ================================================================
// PAGE NAME  : Properties Listing Page
// ROUTE      : /properties
// DESCRIPTION: Browse all approved property listings with filters
//              for city, type, bedrooms, price range
// ================================================================
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { cachedDbQuery } from "@/lib/cache";
import { Search, Sparkles } from "lucide-react";
import SaveSearchButton from "@/components/SaveSearchButton";
import PropertyCard from "@/components/PropertyCard";
import PropertiesSearchFilterForm from "@/components/properties/PropertiesSearchFilterForm";
import {
  resolveLocation,
  getCityDbVariants,
  getDistrictAliases,
} from "@/lib/ai/nlu/location-resolver";
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

  const isLand = String(type || "").toUpperCase() === "LAND";
  const searchLocation = (location || city || "").toString().trim();
  const keywordQuery = (q || search || "").toString().trim();
  const explicitDistrict = (district || "").toString().trim();

  const where: any = {
    status: { in: ["APPROVED", "PUBLISHED"] },
    availabilityStatus: "AVAILABLE",
    isActive: true,
  };

  if (isLand) {
    where.listingType = "FOR_SALE";
  } else if (listingType && ["FOR_RENT", "FOR_SALE"].includes(String(listingType))) {
    where.listingType = String(listingType);
  }

  const andClauses: any[] = [];

  // 1. Keyword search (q / search) with multi-token precision matching
  if (keywordQuery) {
    const rawTerms = keywordQuery.split(/\s+/).map((t) => t.trim()).filter((t) => t.length > 1);
    const stopWords = new Set(["oo", "ku", "ah", "ee", "ka", "in", "at", "for", "the", "and", "with", "la", "waa"]);
    const filteredTerms = rawTerms.filter((t) => !stopWords.has(t.toLowerCase()));
    const termsToMatch = filteredTerms.length > 0 ? filteredTerms : rawTerms;

    if (termsToMatch.length <= 1) {
      andClauses.push({
        OR: [
          { title: { contains: keywordQuery } },
          { description: { contains: keywordQuery } },
          { location: { contains: keywordQuery } },
          { address: { contains: keywordQuery } },
          { city: { contains: keywordQuery } },
        ],
      });
    } else {
      andClauses.push({
        OR: [
          { title: { contains: keywordQuery } },
          { description: { contains: keywordQuery } },
          {
            AND: termsToMatch.map((term) => ({
              OR: [
                { title: { contains: term } },
                { description: { contains: term } },
                { location: { contains: term } },
                { address: { contains: term } },
                { city: { contains: term } },
              ],
            })),
          },
        ],
      });
    }
  }

  // 2. City & District resolution with canonical DB alias expansion
  if (searchLocation) {
    const resolved = resolveLocation(searchLocation);
    const cityVariants = getCityDbVariants(resolved ? resolved.canonicalCity : searchLocation);

    if (cityVariants.length > 1) {
      where.city = { in: cityVariants };
    } else if (cityVariants.length === 1) {
      where.city = cityVariants[0];
    } else {
      where.city = { contains: searchLocation };
    }

    const targetDistrict = resolved?.district || explicitDistrict;
    if (targetDistrict) {
      const districtTerms = getDistrictAliases(targetDistrict);
      andClauses.push({
        OR: districtTerms.flatMap((term) => [
          { location: { contains: term } },
          { address: { contains: term } },
          { title: { contains: term } },
          { description: { contains: term } },
        ]),
      });
    }
  } else if (explicitDistrict) {
    const districtTerms = getDistrictAliases(explicitDistrict);
    andClauses.push({
      OR: districtTerms.flatMap((term) => [
        { location: { contains: term } },
        { address: { contains: term } },
        { title: { contains: term } },
        { description: { contains: term } },
      ]),
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

  // 4. Bedrooms with exactBedrooms & Studio (0 bed) support (omitted for LAND)
  const exactBedrooms = params.exactBedrooms === "true";
  if (String(type || "").toUpperCase() !== "LAND" && bedrooms !== undefined && bedrooms !== "") {
    const bedNum = Number(bedrooms);
    if (!isNaN(bedNum)) {
      if (bedNum === 0) {
        where.bedrooms = 0;
      } else {
        where.bedrooms = exactBedrooms ? bedNum : { gte: bedNum };
      }
    }
  }

  if (bathrooms) where.bathrooms = { gte: Number(bathrooms) };
  if (furnished === "true") where.isFurnished = true;
  if (parking) where.parking = { gte: Number(parking) };

  // 5. Price filtering with boundary inversion auto-protection
  if (minPrice || maxPrice) {
    const minVal = minPrice && !isNaN(Number(minPrice)) ? Number(minPrice) : undefined;
    const maxVal = maxPrice && !isNaN(Number(maxPrice)) ? Number(maxPrice) : undefined;

    if (minVal !== undefined && maxVal !== undefined) {
      const [effMin, effMax] = minVal > maxVal ? [maxVal, minVal] : [minVal, maxVal];
      where.price = { gte: effMin, lte: effMax };
    } else if (minVal !== undefined) {
      where.price = { gte: minVal };
    } else if (maxVal !== undefined) {
      where.price = { lte: maxVal };
    }
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
    cachedDbQuery(
      ["public", "locations-registry"],
      () =>
        prisma.location.findMany({
          select: { id: true, city: true, region: true, country: true },
          orderBy: { city: "asc" },
        }),
      { tags: ["locations"], revalidate: 300 }
    ),
    cachedDbQuery(
      ["public", "categories-registry"],
      () =>
        prisma.category.findMany({
          select: { id: true, name: true, slug: true },
          orderBy: { name: "asc" },
        }),
      { tags: ["categories"], revalidate: 300 }
    ),
    cachedDbQuery(
      [
        "public",
        "properties-catalog",
        JSON.stringify(where),
        JSON.stringify(orderBy),
      ],
      () =>
        prisma.property.findMany({
          where,
          select: {
            id: true,
            title: true,
            price: true,
            basePrice: true,
            companyServiceFee: true,
            legalTransferFee: true,
            brokerCommission: true,
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
      { tags: ["properties"], revalidate: 60 }
    ),
    cachedDbQuery(
      ["public", "properties-count", JSON.stringify(where)],
      () => prisma.property.count({ where }),
      { tags: ["properties"], revalidate: 60 }
    ),
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
          <PropertiesSearchFilterForm
            keywordQuery={keywordQuery}
            searchLocation={searchLocation ? String(searchLocation) : ""}
            listingType={isLand ? "FOR_SALE" : (listingType ? String(listingType) : "")}
            selectedType={type ? String(type) : ""}
            bedrooms={bedrooms !== undefined ? String(bedrooms) : ""}
            maxPrice={maxPrice ? String(maxPrice) : ""}
            sort={sort ? String(sort) : ""}
            availableCities={availableCities}
            categories={registeredCategories.map((cat) => ({
              id: cat.id,
              name: cat.name,
              code: mapCategoryToPropertyType(cat.name, cat.slug),
            }))}
            totalCount={totalCount}
            hasActiveFilters={hasActiveFilters}
          />
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
              <div key={p.id} className="content-visibility-auto">
                <PropertyCard property={p as any} priority={index < 4} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
