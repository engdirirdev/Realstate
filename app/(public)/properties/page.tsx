// ================================================================
// PAGE NAME  : Properties Listing Page
// ROUTE      : /properties
// DESCRIPTION: Browse all approved property listings with filters
//              for city, type, bedrooms, price range
// ================================================================
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPropertyTypeLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Filter, RotateCcw } from "lucide-react";
import SaveSearchButton from "@/components/SaveSearchButton";
import PropertyCard from "@/components/PropertyCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties – Kiro-Maal Real Estate",
  description: "Browse verified luxury properties with AI-powered valuations and smart search in Somalia.",
};

export const revalidate = 60; // ISR: refresh every minute

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;
  const { location, city, type, listingType, minPrice, maxPrice, bedrooms, bathrooms, furnished, parking, sort } = params;

  const searchLocation = location || city;

  const where: any = {
    status: { in: ["APPROVED", "PUBLISHED"] },
    availabilityStatus: "AVAILABLE",
    isActive: true,
  };
  if (listingType && ["FOR_RENT", "FOR_SALE"].includes(String(listingType))) {
    where.listingType = String(listingType);
  }
  if (searchLocation) where.city = { contains: String(searchLocation) };
  if (type) where.type = String(type);
  if (bedrooms) where.bedrooms = { gte: Number(bedrooms) };
  if (bathrooms) where.bathrooms = { gte: Number(bathrooms) };
  if (furnished === "true") where.isFurnished = true;
  if (parking) where.parking = { gte: Number(parking) };
  if (minPrice) where.price = { ...(where.price || {}), gte: Number(minPrice) };
  if (maxPrice) where.price = { ...(where.price || {}), lte: Number(maxPrice) };

  let orderBy: any = { createdAt: "desc" };
  if (sort === "price_asc") orderBy = { price: "asc" };
  else if (sort === "price_desc") orderBy = { price: "desc" };
  else if (sort === "area_desc") orderBy = { area: "desc" };

  const properties = await prisma.property.findMany({
    where,
    include: { images: { orderBy: { order: "asc" }, take: 1 } },
    orderBy,
    take: 40,
  });

  return (
    <div className="bg-[#F7F3EA] min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Filter Card */}
        <div className="bg-[#FCFBF7] p-6 sm:p-8 rounded-3xl shadow-sm border border-[#E8E1D4] mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#A97918] text-[11px] font-bold uppercase tracking-wider mb-2">
                <span>✦ Verified Listings</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] tracking-tight">
                Kiro-Maal Properties
              </h1>
              <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
                Explore verified listings with AI valuations and precision neighborhood insights
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

          {/* Search / Filters Form */}
          <form method="GET" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918]" />
              <input
                name="location"
                defaultValue={searchLocation ?? ""}
                placeholder="City or district (e.g. Mogadishu)"
                className="w-full pl-9.5 pr-3 py-2 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs h-10 outline-hidden transition-all"
              />
            </div>

            <select
              name="listingType"
              defaultValue={listingType ?? ""}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs h-10 outline-hidden transition-all cursor-pointer font-semibold"
            >
              <option value="">All Listings (Rent &amp; Sale)</option>
              <option value="FOR_RENT">For Rent</option>
              <option value="FOR_SALE">For Sale</option>
            </select>

            <select
              name="type"
              defaultValue={type ?? ""}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs h-10 outline-hidden transition-all cursor-pointer"
            >
              <option value="">All Property Types</option>
              {[
                "HOUSE",
                "APARTMENT",
                "VILLA",
                "OFFICE",
                "LAND",
                "COMMERCIAL",
                "TOWNHOUSE",
                "STUDIO",
              ].map((t) => (
                <option key={t} value={t}>
                  {getPropertyTypeLabel(t)}
                </option>
              ))}
            </select>

            <select
              name="bedrooms"
              defaultValue={bedrooms ?? ""}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs h-10 outline-hidden transition-all cursor-pointer"
            >
              <option value="">Any Bedrooms</option>
              <option value="1">1+ Bedrooms</option>
              <option value="2">2+ Bedrooms</option>
              <option value="3">3+ Bedrooms</option>
              <option value="4">4+ Bedrooms</option>
              <option value="5">5+ Bedrooms</option>
            </select>

            <select
              name="maxPrice"
              defaultValue={maxPrice ?? ""}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs h-10 outline-hidden transition-all cursor-pointer"
            >
              <option value="">Any Price</option>
              <option value="50000">Under $50,000</option>
              <option value="100000">Under $100,000</option>
              <option value="200000">Under $200,000</option>
              <option value="500000">Under $500,000</option>
              <option value="1000000">Under $1,000,000</option>
            </select>

            <select
              name="sort"
              defaultValue={sort ?? ""}
              className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs h-10 outline-hidden transition-all cursor-pointer"
            >
              <option value="">Sort: Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Size: Largest Area First</option>
            </select>

            <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex gap-3">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] rounded-xl text-xs font-bold h-10 gap-2 shadow-md shadow-[#C89B3C]/20 border border-[#A97918]/30 transition-all cursor-pointer"
              >
                <Filter className="h-4 w-4" /> Apply Filters
              </Button>
              <Link
                href="/properties"
                className="inline-flex items-center justify-center px-4 py-2 border border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-xs font-semibold text-[#07111F] hover:bg-[#F7F3EA] h-10 transition-colors gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-[#A97918]" />
                <span>Reset</span>
              </Link>
            </div>
          </form>
        </div>

        {/* Property Grid */}
        {properties.length === 0 ? (
          <div className="text-center py-20 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] shadow-sm">
            <Search className="h-12 w-12 text-[#C89B3C] mx-auto mb-4 opacity-60" />
            <h3 className="text-lg font-bold font-serif text-[#07111F]">No properties found</h3>
            <p className="text-[#6B7280] text-xs sm:text-sm mt-1 max-w-sm mx-auto">
              We couldn&apos;t find any listings matching your search filters. Try adjusting your criteria or clearing filters.
            </p>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 mt-5 px-5 py-2.5 bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] text-xs font-bold rounded-xl shadow-md shadow-[#C89B3C]/20 hover:brightness-105 transition-all"
            >
              View All Properties
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {properties.map((p) => (
              <PropertyCard key={p.id} property={p as any} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
