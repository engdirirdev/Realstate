// ================================================================
// PAGE NAME  : Public Home Page (Kiro-Maal Real Estate)
// ROUTE      : /
// DESCRIPTION: Kiro-Maal Master Design System — Abudwak, Galmudug, Somalia
// ================================================================
import Link from "next/link";
import Image from "next/image";
import {
  Building2, Users, Award, Star, ArrowRight, Bot,
  Sparkles, Search, TrendingUp, Compass, Home
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import PropertyCard from "@/components/PropertyCard";
import OpenAIChatButton from "@/components/OpenAIChatButton";
import type { Metadata } from "next";
import { cachedDbQuery } from "@/lib/cache";
import { ABUDWAK_VILLAGES, SYSTEM_LOCATION_LABEL } from "@/lib/abudwak-locations";

export const metadata: Metadata = {
  title: "Kiro-Maal Real Estate | Abudwak, Galmudug Properties & AI Valuation",
  description:
    "Discover, buy, rent, or sell verified properties in Abudwak, Galmudug, Somalia. Smart AI search and price valuations across Ubah, Horsed, October, 1da-Lulio, Ammano, and Waberi.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Kiro-Maal Real Estate | Abudwak, Galmudug Premier Properties",
    description:
      "Find verified villas, family homes, and commercial plots across all 6 villages of Abudwak, Galmudug, Somalia.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kiro-Maal Real Estate | Abudwak, Galmudug Properties",
    description: "Verified properties, virtual tours, and AI valuation in Abudwak, Galmudug, Somalia.",
  },
};

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    return await cachedDbQuery(
      ["home", "featured-data-abudwak-v2"],
      async () => {
        const [featuredProperties, totalCount, allApprovedLocations] = await Promise.all([
          prisma.property.findMany({
            where: { status: "APPROVED" },
            include: { images: { orderBy: { order: "asc" }, take: 1 } },
            take: 4,
            orderBy: { createdAt: "desc" },
          }),
          prisma.property.count({ where: { status: "APPROVED" } }),
          prisma.property.findMany({
            where: { status: "APPROVED" },
            select: { location: true, city: true },
          }),
        ]);

        const villageCounts: Record<string, number> = {};
        for (const v of ABUDWAK_VILLAGES) {
          const target = v.name.toLowerCase();
          villageCounts[v.name] = allApprovedLocations.filter(
            (p) =>
              (p.location || "").toLowerCase().includes(target) ||
              (p.city || "").toLowerCase().includes(target)
          ).length;
        }

        return { featuredProperties, totalCount, villageCounts };
      },
      {
        tags: ["home", "properties", "featured"],
        revalidate: 60,
      }
    );
  } catch (error) {
    console.error("Database connection failed in getHomeData:", error);
    return { featuredProperties: [], totalCount: 0, villageCounts: {} as Record<string, number> };
  }
}

export default async function HomePage() {
  const { featuredProperties, totalCount, villageCounts } = await getHomeData();

  return (
    <div className="overflow-x-hidden bg-[#F7F3EA]">
      {/* ─── 1. HERO SECTION ────────────────────────────────── */}
      <section className="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center pt-24 pb-16 px-4">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/images/luxury_villa_twilight.jpg"
            alt="Kiro-Maal Luxury Villa in Abudwak"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111F]/95 via-[#0B1728]/85 to-[#07111F]/70" />
        </div>

        <div className="section-container relative z-10 w-full">
          <div className="max-w-3xl mx-auto text-white text-center py-6 sm:py-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C89B3C]/20 border border-[#C89B3C]/40 text-[#D9B45B] text-xs font-bold uppercase tracking-wider mb-5">
              <span>✦ Official Kiro-Maal Real Estate • {SYSTEM_LOCATION_LABEL}</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight leading-tight text-[#FCFBF7] mb-5">
              Smart Property Search <br />
              <span className="bg-gradient-to-r from-[#C89B3C] via-[#F3D78A] to-[#D9B45B] bg-clip-text text-transparent">Powered by AI</span>
            </h1>
            <p className="text-base sm:text-lg text-[#E2E8F0] leading-relaxed max-w-2xl mx-auto mb-9">
              Discover verified homes, modern apartments, and prime land plots across Abudwak, Galmudug, Somalia with precision AI valuations and trusted local agents.
            </p>

            {/* Action Button: Search Properties */}
            <div className="flex items-center justify-center">
              <Link
                href="/properties"
                id="hero-search-properties-btn"
                className="inline-flex items-center gap-3 px-9 py-4 rounded-2xl bg-gradient-to-r from-[#C89B3C] via-[#E8B849] to-[#D9A336] text-[#07111F] font-black text-base sm:text-lg shadow-xl shadow-[#C89B3C]/35 hover:shadow-2xl hover:shadow-[#C89B3C]/50 hover:scale-[1.03] active:scale-95 transition-all duration-300 group border border-[#F3D78A]/60 cursor-pointer"
              >
                <Search className="w-5 h-5 text-[#07111F] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
                <span>Search Properties</span>
                <ArrowRight className="w-5 h-5 text-[#07111F] transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. HERO STATISTICS STRIP ───────────────────────── */}
      <section className="bg-[#07111F] border-y border-[#C89B3C]/20 py-6">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0B1728] border border-[#C89B3C]/20 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#FCFBF7]">
                  {totalCount}
                </p>
                <p className="text-xs text-[#94A3B8] font-medium">Verified Listings</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0B1728] border border-[#C89B3C]/20 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#FCFBF7]">6 Villages</p>
                <p className="text-xs text-[#94A3B8] font-medium">Full Abudwak Coverage</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0B1728] border border-[#C89B3C]/20 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#FCFBF7]">100%</p>
                <p className="text-xs text-[#94A3B8] font-medium">Verified Local Agents</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#0B1728] border border-[#C89B3C]/20 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[#FCFBF7]">Galmudug</p>
                <p className="text-xs text-[#94A3B8] font-medium">Abudwak Market Leader</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. FEATURED PROPERTIES SECTION ─────────────────── */}
      <section className="py-14 sm:py-16">
        <div className="section-container">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider mb-1">
                ✦ Handpicked Selection
              </p>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] tracking-tight">
                Featured Abudwak Properties
              </h2>
              <p className="text-sm text-[#6B7280] mt-1">
                Explore verified, premium properties across Abudwak&apos;s villages curated for elegance, security, and growth.
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors"
            >
              View All Properties
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProperties.length === 0 ? (
            <div className="bg-[#FCFBF7] border border-[#E8E1D4] rounded-3xl p-12 text-center shadow-xs">
              <Building2 className="w-10 h-10 text-[#C89B3C]/50 mx-auto mb-3" />
              <h3 className="font-serif font-bold text-lg text-[#07111F]">
                New Abudwak Listings Coming Soon
              </h3>
              <p className="text-sm text-[#6B7280] mt-1 max-w-md mx-auto">
                Verified homes, villas, and plots across Ubah, Horsed, October, 1da-Lulio, Ammano, and Waberi will appear here once published.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProperties.map((p, index) => (
                <div key={p.id} className="content-visibility-auto">
                  <PropertyCard
                    priority={index < 4}
                    property={{
                      id: p.id,
                      title: p.title,
                      price: p.price,
                      location: p.location,
                      city: p.city,
                      type: p.type,
                      bedrooms: p.bedrooms,
                      bathrooms: p.bathrooms,
                      area: p.area,
                      images: p.images,
                      isFeatured: p.isFeatured,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 4. AI SERVICES STRIP ───────────────────────────── */}
      <section className="bg-[#07111F] py-10 text-white border-y border-[#C89B3C]/20">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OpenAIChatButton
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0B1728] hover:bg-[#0E1D33] border border-[#C89B3C]/20 hover:border-[#C89B3C]/50 transition-all group text-left cursor-pointer"
            >
              <div className="w-11 h-11 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FCFBF7]">AI Smart Search</h3>
                <p className="text-xs text-[#94A3B8]">Match properties in seconds</p>
              </div>
            </OpenAIChatButton>

            <Link
              href="/price-prediction"
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0B1728] hover:bg-[#0E1D33] border border-[#C89B3C]/20 hover:border-[#C89B3C]/50 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FCFBF7]">Price Prediction</h3>
                <p className="text-xs text-[#94A3B8]">ML future value forecasting</p>
              </div>
            </Link>

            <Link
              href="/customer/recommendations"
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0B1728] hover:bg-[#0E1D33] border border-[#C89B3C]/20 hover:border-[#C89B3C]/50 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FCFBF7]">Recommendations</h3>
                <p className="text-xs text-[#94A3B8]">Tailored to your budget</p>
              </div>
            </Link>

            <Link
              href="/properties"
              className="flex items-center gap-3.5 p-4 rounded-2xl bg-[#0B1728] hover:bg-[#0E1D33] border border-[#C89B3C]/20 hover:border-[#C89B3C]/50 transition-all group"
            >
              <div className="w-11 h-11 rounded-xl bg-[#C89B3C]/15 border border-[#C89B3C]/30 flex items-center justify-center text-[#D9B45B] flex-shrink-0 group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#FCFBF7]">Virtual Tours</h3>
                <p className="text-xs text-[#94A3B8]">Inspect before visiting</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. AI ASSISTANT & TESTIMONIAL SECTION ──────────── */}
      <section className="py-14 sm:py-16 bg-[#FCFBF7] border-b border-[#E8E1D4]">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* AI Assistant Card */}
            <div className="bg-gradient-to-br from-[#0B1728] to-[#07111F] border border-[#C89B3C]/30 p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-xl flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#C89B3C] via-[#D9B45B] to-[#A97918] flex items-center justify-center shadow-lg shadow-[#C89B3C]/20">
                  <Bot className="w-14 h-14 text-[#07111F]" />
                </div>
              </div>
              <div className="text-center sm:text-left space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-xs font-semibold text-[#D9B45B]">
                  <Sparkles className="w-3.5 h-3.5" /> 24/7 AI Real Estate Assistant
                </div>
                <h3 className="text-2xl font-black font-serif text-[#FCFBF7]">Meet Kiro-Maal AI</h3>
                <p className="text-xs sm:text-sm text-[#CBD5E1] leading-relaxed">
                  Ask anything about verified properties, villages in Abudwak, market prices, and investment opportunities in Galmudug.
                </p>
                <div>
                  <OpenAIChatButton
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] hover:brightness-105 text-[#07111F] text-xs sm:text-sm font-bold px-6 py-2.5 rounded-xl shadow-md shadow-[#C89B3C]/20 transition-all cursor-pointer"
                  >
                    <span>Chat With Assistant</span>
                    <ArrowRight className="w-4 h-4" />
                  </OpenAIChatButton>
                </div>
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="bg-[#FCFBF7] border border-[#E8E1D4] p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-1 text-[#C89B3C]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C89B3C]" />
                ))}
              </div>
              <p className="text-[#07111F] italic text-sm sm:text-base leading-relaxed font-serif">
                &ldquo;Kiro-Maal Real Estate made our home purchase in Abudwak completely seamless. The AI valuations gave us total clarity, and every village listing is verified and trustworthy.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-11 h-11 rounded-full bg-[#F7F3EA] border border-[#E8E1D4] flex items-center justify-center font-bold text-[#A97918]">
                  AH
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#07111F]">Ahmed Hassan</h3>
                  <p className="text-xs text-[#6B7280]">Verified Buyer • Horsed Village, Abudwak</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. ABUDWAK VILLAGES SECTION ────────────────────── */}
      <section className="py-14 sm:py-16 bg-[#F7F3EA]">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider mb-1">
              ✦ Explore Abudwak, Galmudug
            </p>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] tracking-tight">
              Prime Villages in Abudwak
            </h2>
            <p className="text-sm text-[#6B7280] mt-1.5 max-w-xl mx-auto">
              Browse verified properties across all 6 villages of Abudwak, Galmudug, Somalia.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {ABUDWAK_VILLAGES.map(({ name, emoji, desc }) => {
              const count = villageCounts?.[name] ?? 0;
              return (
                <Link
                  key={name}
                  href={`/properties?location=${encodeURIComponent(name)}`}
                  className="group flex flex-col items-center text-center p-4 rounded-2xl border border-[#E8E1D4] bg-[#FCFBF7] hover:border-[#C89B3C] hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="relative w-12 h-12 mb-3 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-sm group-hover:scale-110 transition-transform">
                    <Home className="w-6 h-6 text-[#D9B45B]" />
                    <span
                      aria-hidden="true"
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/50 shadow-xs flex items-center justify-center text-xs leading-none"
                    >
                      {emoji}
                    </span>
                  </div>
                  <h3 className="font-bold text-[#07111F] group-hover:text-[#C89B3C] transition-colors text-sm font-serif">
                    {name}
                  </h3>
                  <p className="text-[11px] text-[#A97918] font-bold mt-0.5">
                    {count === 1 ? "1 Property" : `${count} Properties`}
                  </p>
                  <p className="text-[10px] text-[#6B7280] mt-1 line-clamp-2 leading-snug">{desc}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
