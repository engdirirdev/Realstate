// ================================================================
// PAGE NAME  : Properties Listing Page
// ROUTE      : /properties
// DESCRIPTION: Browse all approved property listings with filters
//              for city, type, bedrooms, price range
// ================================================================
import Link from "next/link";
import { BedDouble } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Search, Filter, ArrowRight } from "lucide-react";
import SaveSearchButton from "@/components/SaveSearchButton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Properties – AI Real Estate",
  description: "Browse all properties with AI-powered filters and recommendations.",
};

export const revalidate = 60; // ISR: refresh every minute

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const params = await searchParams;
  const { location, type, minPrice, maxPrice, bedrooms, bathrooms, furnished, parking, sort } = params;

  const where: any = { status: "APPROVED" };
  if (location) where.city = { contains: String(location), mode: "insensitive" };
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
    <div className="section-container py-12 bg-[#F8FAFC] min-h-screen">
      <div className="bg-[#FFFFFF] p-6 sm:p-8 rounded-2xl shadow-card border border-[#E2E8F0] mb-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="text-center sm:text-left">
            <h1 className="font-display text-3xl font-bold text-[#0F172A]">All Properties</h1>
            <p className="text-[#64748B] text-sm mt-1">
              Find your ideal home with advanced AI-ready filters
            </p>
          </div>
          <SaveSearchButton
            filters={{
              location: location ? String(location) : undefined,
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
            <input
              name="location"
              defaultValue={location ?? ""}
              placeholder="City or district (e.g. Mogadishu)"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
            />
          </div>

          <select
            name="type"
            defaultValue={type ?? ""}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
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
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
          >
            <option value="">Any Bedrooms</option>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}+ Bedrooms
              </option>
            ))}
          </select>

          <select
            name="bathrooms"
            defaultValue={bathrooms ?? ""}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
          >
            <option value="">Any Bathrooms</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}+ Bathrooms
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              name="minPrice"
              type="number"
              placeholder="Min Price ($)"
              defaultValue={minPrice ?? ""}
              className="w-1/2 px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
            />
            <input
              name="maxPrice"
              type="number"
              placeholder="Max Price ($)"
              defaultValue={maxPrice ?? ""}
              className="w-1/2 px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
            />
          </div>

          <select
            name="parking"
            defaultValue={parking ?? ""}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
          >
            <option value="">Any Parking</option>
            <option value="1">1+ Parking Space</option>
            <option value="2">2+ Parking Spaces</option>
            <option value="3">3+ Parking Spaces</option>
          </select>

          <select
            name="furnished"
            defaultValue={furnished ?? ""}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
          >
            <option value="">Furnished Status (All)</option>
            <option value="true">Fully Furnished</option>
          </select>

          <select
            name="sort"
            defaultValue={sort ?? ""}
            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-xs h-10"
          >
            <option value="">Sort: Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="area_desc">Size: Largest Area First</option>
          </select>

          <div className="col-span-full flex gap-3 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-semibold h-10 gap-2 shadow-sm"
            >
              <Filter className="h-4 w-4" /> Apply Filters
            </Button>
            <Link
              href="/properties"
              className="inline-flex items-center justify-center px-4 py-2 border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] h-10"
            >
              Reset
            </Link>
          </div>
        </form>
      </div>

      {/* Grid */}
      {properties.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-card">
          <Search className="h-12 w-12 text-[#10B981] mx-auto mb-4 opacity-50" />
          <p className="text-[#64748B] text-lg">No properties match your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const image = p.images[0]?.url;
            return (
              <Link href={`/properties/${p.id}`} key={p.id} className="group block">
                <div className="bg-white border border-[#E2E8F0] overflow-hidden rounded-2xl shadow-card">
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {image ? (
                      <img src={image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-[#F8FAFC]">
                        <span className="text-[#94A3B8]">No image</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="bg-[#D1FAE5] text-[#065F46] px-2 py-1 rounded-md text-xs font-semibold">{getPropertyTypeLabel(p.type)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-[#0F172A] mb-1 line-clamp-1 group-hover:text-[#10B981] transition-colors">{p.title}</h3>
                    <p className="text-sm text-[#64748B] mb-2">{p.city}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[#059669] font-bold text-lg">{formatPrice(p.price)}</span>
                      <span className="text-xs text-[#94A3B8] flex items-center gap-1"><BedDouble className="h-3 w-3" /> {p.bedrooms}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
