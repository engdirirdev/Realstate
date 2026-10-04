// ================================================================
// PAGE NAME  : Public Home Page (SkyHome)
// ROUTE      : /
// DESCRIPTION: Redesigned based on Section 1 of reference image
// ================================================================
import Link from "next/link";
import {
  Building2, Users, Award, Star, ArrowRight, Bot,
  Sparkles, CheckCircle2, Search, TrendingUp, ShieldCheck, Compass
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import PropertyCard from "@/components/PropertyCard";
import HeroSearchBar from "@/components/HeroSearchBar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SkyHome Real Estate | Your Future Home Is Here",
  description:
    "Discover, buy, rent or sell properties with the power of AI. Smart search. Better decisions. A brighter future.",
};

export const revalidate = 60; // ISR cache 60s

async function getHomeData() {
  const [featuredProperties, totalCount] = await Promise.all([
    prisma.property.findMany({
      where: { status: "APPROVED" },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      take: 4,
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where: { status: "APPROVED" } }),
  ]);
  return { featuredProperties, totalCount };
}

const popularLocations = [
  { city: "Mogadishu", emoji: "🏙️", count: "402+ Properties", desc: "Capital & economic powerhouse" },
  { city: "Hargeisa", emoji: "🌆", count: "320+ Properties", desc: "Capital of Somaliland" },
  { city: "Bosaso", emoji: "⚓", count: "188+ Properties", desc: "Major port & commercial hub" },
  { city: "Garowe", emoji: "🏛️", count: "156+ Properties", desc: "Capital of Puntland" },
  { city: "Kismayo", emoji: "🌊", count: "98+ Properties", desc: "Southern port & coastal villas" },
  { city: "Berbera", emoji: "🏖️", count: "65+ Properties", desc: "Historic coastal trade center" },
];

export default async function HomePage() {
  const { featuredProperties, totalCount } = await getHomeData();

  return (
    <div className="overflow-x-hidden bg-[#F5F1EA]">
      {/* ─── 1. HERO SECTION ────────────────────────────────── */}
      <section className="relative min-h-[640px] lg:min-h-[720px] flex items-center justify-center pt-24 pb-16 px-4">
        {/* Background Image with Gradient Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=80"
            alt="Luxury Villa"
            className="w-full h-full object-cover object-center scale-105 animate-fade-in"
          />
          {/* Deep Navy Gradient Overlay matching reference */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#08203A]/90 via-[#0F2747]/80 to-[#08203A]/60" />
        </div>

        <div className="section-container relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-8">
            {/* Left Hero Text */}
            <div className="max-w-2xl text-white text-center lg:text-left">
              <p className="text-sm font-bold tracking-wide uppercase mb-2 text-white/90">
                Find Your <span className="text-[#FBBF24]">Dream Property</span>
              </p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-4">
                Your Future Home <br />
                <span className="text-white">Is Here</span>
              </h1>
              <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-xl">
                Discover, buy, rent or sell properties with the power of AI. Smart search. Better decisions. A brighter future.
              </p>
            </div>

            {/* Right Floating AI Badge Card */}
            <div className="hidden lg:flex flex-col bg-[#08203A]/85 backdrop-blur-md border border-white/20 p-5 rounded-2xl shadow-2xl text-white max-w-xs">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[#06B6D4]/20 border border-[#06B6D4]/40 flex items-center justify-center text-[#38BDF8]">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-white">AI-Powered</h2>
                  <p className="text-[10px] text-[#38BDF8] font-medium">Smart Real Estate Engine</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                  <span>Property Recommendations</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                  <span>Price Prediction</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] flex-shrink-0" />
                  <span>Smart Search</span>
                </div>
              </div>
            </div>
          </div>

          {/* Integrated Search Bar with Tabs */}
          <div className="mt-4">
            <HeroSearchBar />
          </div>
        </div>
      </section>

      {/* ─── 2. HERO STATISTICS STRIP ───────────────────────── */}
      <section className="bg-[#08203A] border-y border-white/10 py-5">
        <div className="section-container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/20 flex items-center justify-center text-[#38BDF8] flex-shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">
                  {totalCount > 0 ? `${totalCount}+` : "20,000+"}
                </p>
                <p className="text-xs text-white/70 font-medium">Properties Listed</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 flex items-center justify-center text-[#34D399] flex-shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">5,000+</p>
                <p className="text-xs text-white/70 font-medium">Happy Clients</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/20 flex items-center justify-center text-[#FBBF24] flex-shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">150+</p>
                <p className="text-xs text-white/70 font-medium">Expert Agents</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-white/5 border border-white/10 text-white">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center text-[#C084FC] flex-shrink-0">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-white">10+</p>
                <p className="text-xs text-white/70 font-medium">Years of Experience</p>
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
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                Featured Properties
              </h2>
              <p className="text-sm text-[#64748B] mt-1">
                Explore some of our handpicked verified properties just for you.
              </p>
            </div>
            <Link
              href="/properties"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#1677FF] hover:text-[#0F5ED7] transition-colors"
            >
              View All Properties
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProperties.map((p) => (
              <PropertyCard
                key={p.id}
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
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. AI SERVICES STRIP ───────────────────────────── */}
      <section className="bg-[#08203A] py-8 text-white">
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/ai-assistant"
              className="flex items-center gap-3.5 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#1677FF]/30 flex items-center justify-center text-[#38BDF8] flex-shrink-0 group-hover:scale-110 transition-transform">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Property Search</h3>
                <p className="text-xs text-white/60">Find your perfect match</p>
              </div>
            </Link>

            <Link
              href="/price-prediction"
              className="flex items-center gap-3.5 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#10B981]/30 flex items-center justify-center text-[#34D399] flex-shrink-0 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Price Prediction</h3>
                <p className="text-xs text-white/60">Know the future value</p>
              </div>
            </Link>

            <Link
              href="/customer/recommendations"
              className="flex items-center gap-3.5 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/30 flex items-center justify-center text-[#C084FC] flex-shrink-0 group-hover:scale-110 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Smart Recommendations</h3>
                <p className="text-xs text-white/60">Personalized for you</p>
              </div>
            </Link>

            <Link
              href="/properties"
              className="flex items-center gap-3.5 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/30 flex items-center justify-center text-[#FBBF24] flex-shrink-0 group-hover:scale-110 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Virtual Tour</h3>
                <p className="text-xs text-white/60">Explore 360° view</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5. AI ASSISTANT & TESTIMONIAL SECTION ──────────── */}
      <section className="py-14 sm:py-16 bg-[#FFFFFF] border-b border-[#DCE6F2]">
        <div className="section-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* AI Assistant Card */}
            <div className="bg-gradient-to-br from-[#0F2747] to-[#08203A] p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden shadow-xl flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 flex items-center justify-center">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#1677FF] to-[#38BDF8] flex items-center justify-center shadow-lg">
                  <Bot className="w-14 h-14 text-white animate-bounce" />
                </div>
              </div>
              <div className="text-center sm:text-left space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-[#38BDF8]">
                  <Sparkles className="w-3.5 h-3.5" /> 24/7 Virtual Assistant
                </div>
                <h3 className="text-2xl font-black text-white">Meet Your AI Assistant</h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Ask anything about properties, locations, prices and get instant answers powered by Gemini and our real property database.
                </p>
                <div>
                  <Link
                    href="/ai-assistant"
                    className="inline-flex items-center gap-2 bg-[#1677FF] hover:bg-[#0F5ED7] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl shadow-xs transition-transform active:scale-95"
                  >
                    Chat Now
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Testimonial Card */}
            <div className="bg-[#F8FAFC] border border-[#DCE6F2] p-6 sm:p-8 rounded-3xl shadow-xs flex flex-col justify-between space-y-4">
              <div className="flex items-center gap-1 text-[#F59E0B]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F59E0B]" />
                ))}
              </div>
              <p className="text-[#334155] italic text-sm sm:text-base leading-relaxed">
                &ldquo;This platform made it so easy to find our dream home. The AI recommendations were spot on, and the verified property data gave us complete confidence.&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-2">
                <div className="w-11 h-11 rounded-full bg-[#1677FF]/10 border border-[#1677FF]/30 flex items-center justify-center font-bold text-[#1677FF]">
                  AH
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Ahmed Hassan</h3>
                  <p className="text-xs text-[#64748B]">Happy Customer • Mogadishu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. POPULAR LOCATIONS SECTION ───────────────────── */}
      <section className="py-14 sm:py-16 bg-[#F5F1EA]">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-[#1677FF] uppercase tracking-wider mb-1">
              ✦ Explore by City
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
              Popular Locations
            </h2>
            <p className="text-sm text-[#64748B] mt-1.5 max-w-xl mx-auto">
              Browse properties in Somalia&apos;s major cities and economic hubs.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularLocations.map(({ city, emoji, count, desc }) => (
              <Link
                key={city}
                href={`/properties?location=${city}`}
                className="group flex flex-col items-center text-center p-4 rounded-2xl border border-[#DCE6F2] bg-white hover:border-[#1677FF] hover:shadow-card hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-3xl mb-2.5 group-hover:scale-110 transition-transform">{emoji}</span>
                <h3 className="font-bold text-[#0F172A] group-hover:text-[#1677FF] transition-colors text-sm">
                  {city}
                </h3>
                <p className="text-[11px] text-[#1677FF] font-semibold mt-0.5">{count}</p>
                <p className="text-[10px] text-[#94A3B8] mt-1 line-clamp-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
