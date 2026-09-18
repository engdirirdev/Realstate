// ================================================================
// PAGE NAME  : Home Page
// ROUTE      : /
// DESCRIPTION: Main landing page — hero, featured properties,
//              AI features, how-it-works, cities, CTA sections
// ================================================================
import Link from "next/link";
import { Suspense } from "react";
import {
  Search, MapPin, BedDouble, DollarSign, Building2, ArrowRight,
  Bot, BarChart3, Sparkles, Users, Home, TrendingUp, CheckCircle2,
  Star, Shield, Zap, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Real Estate | Find Your Perfect Property in Somalia",
  description:
    "Somalia's first AI-powered real estate platform. Get intelligent property recommendations, price predictions, and personalized search.",
};

async function getHomeData() {
  const [featuredProperties, stats] = await Promise.all([
    prisma.property.findMany({
      where: { status: "APPROVED", isFeatured: true },
      include: { images: { orderBy: { order: "asc" }, take: 1 } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
    Promise.all([
      prisma.property.count({ where: { status: "APPROVED" } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.recommendation.count(),
      prisma.pricePrediction.count(),
    ]),
  ]);
  return { featuredProperties, stats };
}

const popularLocations = [
  { city: "Mogadishu", emoji: "🏙️", count: "120+ Properties", desc: "Capital & largest city" },
  { city: "Hargeisa", emoji: "🌆", count: "85+ Properties", desc: "Capital of Somaliland" },
  { city: "Bosaso", emoji: "⚓", count: "60+ Properties", desc: "Major port city" },
  { city: "Kismayo", emoji: "🌊", count: "45+ Properties", desc: "Southern commercial hub" },
  { city: "Garowe", emoji: "🏛️", count: "38+ Properties", desc: "Capital of Puntland" },
  { city: "Baydhabo", emoji: "🌿", count: "30+ Properties", desc: "Bay region center" },
];

const howItWorksSteps = [
  { step: "01", title: "Set Your Preferences", desc: "Tell us your budget, preferred location, and property type.", icon: () => <Users className="h-6 w-6 text-[#10B981]" /> },
  { step: "02", title: "AI Finds Best Matches", desc: "Our algorithm scores properties across 5 key factors to find your perfect match.", icon: () => <Brain className="h-6 w-6 text-[#10B981]" /> },
  { step: "03", title: "Predict the Price", desc: "Use our ML model to get estimated market prices before making an offer.", icon: () => <BarChart3 className="h-6 w-6 text-[#10B981]" /> },
  { step: "04", title: "Chat with AI Assistant", desc: "Ask questions in natural language — our AI queries the database for you.", icon: () => <Bot className="h-6 w-6 text-[#10B981]" /> },
];

const aiFeatures = [
  { title: "Smart Recommendations", desc: "Weighted scoring across location, price, bedrooms, type & area — tailored to your profile.", icon: Sparkles, color: "bg-[#ECFEFF] text-[#0891B2]" },
  { title: "Price Prediction ML", desc: "TensorFlow.js model trained on real market data gives you estimated values with confidence scores.", icon: BarChart3, color: "bg-[#ECFEFF] text-[#0891B2]" },
  { title: "Conversational AI", desc: "Ask in plain language: 'Find me a 3-bed house in Mogadishu under $60k' — get real results.", icon: Bot, color: "bg-[#ECFEFF] text-[#0891B2]" },
  { title: "Zero Hallucination", desc: "Our chatbot only answers from real database data. If it doesn't exist, it tells you honestly.", icon: Shield, color: "bg-[#ECFEFF] text-[#0891B2]" },
];

export default async function HomePage() {
  const { featuredProperties, stats } = await getHomeData();
  const [propCount, userCount, recCount, predCount] = stats;

  return (
    <div className="overflow-x-hidden bg-[#F8FAFC]">
      {/* ─── HERO ────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center bg-hero overflow-hidden">
        <div className="section-container relative z-10 pt-20 pb-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] text-sm font-medium mb-6">
              <Zap className="h-4 w-4" />
              AI-Powered Real Estate Platform
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0F172A] leading-tight mb-6">
              Find Your Perfect Property{" "}
              <span className="text-[#10B981]">with AI</span>
            </h1>
            <p className="text-lg sm:text-xl text-[#64748B] leading-relaxed max-w-2xl mx-auto mb-10">
              Discover properties that match your needs and get intelligent
              property recommendations and price insights powered by machine learning.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/properties">
                <Button size="xl" className="bg-[#10B981] text-white hover:bg-[#059669] rounded-xl shadow-lg gap-2 w-full sm:w-auto">
                  <Search className="h-5 w-5" />
                  Explore Properties
                </Button>
              </Link>
              <Link href="/ai-assistant">
                <Button size="xl" variant="outline" className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-gray-50 rounded-xl gap-2 w-full sm:w-auto">
                  <Bot className="h-5 w-5 text-[#0891B2]" />
                  Ask AI Assistant
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div suppressHydrationWarning className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {[
                { value: `${propCount}+`, label: "Properties" },
                { value: `${userCount}+`, label: "Happy Users" },
                { value: `${recCount}+`, label: "AI Recommendations" },
                { value: `${predCount}+`, label: "Price Predictions" },
              ].map(({ value, label }) => (
                <div key={label} className="bg-white border border-[#E2E8F0] shadow-card rounded-2xl py-4 px-3 text-center">
                  <div className="text-2xl font-display font-bold text-[#0F172A]">{value}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK SEARCH ──────────────────────── */}
      <section className="bg-[#F8FAFC] pb-16 -mt-4">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6">
              <h2 className="text-lg font-bold text-[#0F172A] mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-[#10B981]" /> Quick Property Search
              </h2>
              <form action="/properties" method="GET">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="lg:col-span-2 relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input
                      name="location"
                      placeholder="Location (e.g. Mogadishu)"
                      className="w-full pl-9 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <select name="type" className="w-full pl-9 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 appearance-none bg-white text-[#0F172A] text-sm">
                      <option value="">Property Type</option>
                      {["HOUSE","APARTMENT","VILLA","OFFICE","LAND","COMMERCIAL","TOWNHOUSE","STUDIO"].map(t => (
                        <option key={t} value={t}>{getPropertyTypeLabel(t)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <BedDouble className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <select name="bedrooms" className="w-full pl-9 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 appearance-none bg-white text-[#0F172A] text-sm">
                      <option value="">Bedrooms</option>
                      {[1,2,3,4,5,6].map(n => (
                        <option key={n} value={n}>{n}+ Beds</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-[#10B981] text-white hover:bg-[#059669] rounded-xl flex items-center justify-center gap-2 py-2 px-4 transition-colors text-sm font-medium"
                  >
                    <Search className="h-4 w-4" /> Search
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input name="minPrice" type="number" placeholder="Min Price ($)" className="w-full pl-9 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm" />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                    <input name="maxPrice" type="number" placeholder="Max Price ($)" className="w-full pl-9 py-2 rounded-xl border border-[#E2E8F0] focus:border-[#10B981] focus:ring focus:ring-[#10B981]/30 bg-white text-[#0F172A] text-sm" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED PROPERTIES ───────────────── */}
      <section className="py-16 bg-[#FFFFFF]">
        <div className="section-container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[#10B981] font-bold text-sm mb-1">✦ Featured Listings</p>
              <h2 className="font-display text-3xl font-bold text-[#0F172A]">
                Featured Properties
              </h2>
            </div>
            <Link href="/properties" className="hidden sm:flex items-center gap-1 text-[#10B981] font-medium text-sm hover:gap-2 transition-all">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredProperties.length === 0 ? (
            <div className="text-center py-16 text-[#94A3B8]">
              <Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p>No featured properties yet. Run the database seed to add sample data.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProperties.map((property) => {
                const image = property.images[0]?.url;
                return (
                  <Link href={`/properties/${property.id}`} key={property.id} className="group block">
                    <div className="bg-white border border-[#E2E8F0] overflow-hidden rounded-2xl shadow-card">
                      <div className="relative h-52 overflow-hidden bg-gray-100">
                        {image ? (
                          <img
                            src={image}
                            alt={property.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-[#F8FAFC]">
                            <Building2 className="h-16 w-16 text-[#94A3B8]" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3">
                          <span className="bg-[#D1FAE5] text-[#065F46] px-2 py-1 rounded-md text-xs font-semibold">{getPropertyTypeLabel(property.type)}</span>
                        </div>
                        {property.isFeatured && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#FEF9C3] text-[#92400E] text-xs font-semibold">
                              <Star className="h-3 w-3" /> Featured
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <p className="text-xs text-[#94A3B8] flex items-center gap-1 mb-1">
                          <MapPin className="h-3 w-3" /> {property.city}
                        </p>
                        <h3 className="font-bold text-[#0F172A] text-sm mb-2 line-clamp-1 group-hover:text-[#10B981] transition-colors">
                          {property.title}
                        </h3>
                        <div className="flex items-center justify-between">
                          <span className="text-[#059669] font-bold text-lg">
                            {formatPrice(property.price)}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-[#64748B]">
                            {property.bedrooms > 0 && (
                              <span className="flex items-center gap-1">
                                <BedDouble className="h-3 w-3" /> {property.bedrooms}
                              </span>
                            )}
                            <span>{property.area} m²</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── POPULAR LOCATIONS ─────────────────── */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="section-container">
          <div className="text-center mb-10">
            <p className="text-[#10B981] font-bold text-sm mb-1">✦ Explore by City</p>
            <h2 className="font-display text-3xl font-bold text-[#0F172A]">Popular Locations</h2>
            <p className="text-[#64748B] mt-2 max-w-xl mx-auto">
              Browse properties in Somalia's major cities and regions
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {popularLocations.map(({ city, emoji, count, desc }) => (
              <Link
                key={city}
                href={`/properties?location=${city}`}
                className="group flex flex-col items-center text-center p-5 rounded-2xl border border-[#E2E8F0] bg-white hover:shadow-card hover:-translate-y-1 transition-all duration-300"
              >
                <span className="text-4xl mb-3">{emoji}</span>
                <h3 className="font-bold text-[#0F172A] group-hover:text-[#10B981] transition-colors text-sm mb-0.5">
                  {city}
                </h3>
                <p className="text-xs text-[#64748B] font-medium">{count}</p>
                <p className="text-xs text-[#94A3B8] mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ──────────────────────── */}
      <section className="py-16 bg-[#FFFFFF]">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-[#10B981] font-bold text-sm mb-1">✦ Simple Process</p>
            <h2 className="font-display text-3xl font-bold text-[#0F172A]">How It Works</h2>
            <p className="text-[#64748B] mt-2 max-w-xl mx-auto">
              Find your perfect property in 4 simple AI-powered steps
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorksSteps.map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} className="relative">
                {i < howItWorksSteps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-0.5 bg-[#E2E8F0] z-0" />
                )}
                <div className="bg-white rounded-2xl p-6 border border-[#E2E8F0] shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-[#ECFDF5] flex items-center justify-center mb-4">
                    <Icon />
                  </div>
                  <span className="text-xs font-bold text-[#10B981] tracking-widest">{step}</span>
                  <h3 className="font-bold text-[#0F172A] mt-1 mb-2">{title}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AI FEATURES ───────────────────────── */}
      <section className="py-16 bg-[#F8FAFC]">
        <div className="section-container">
          <div className="text-center mb-12">
            <p className="text-[#0891B2] font-bold text-sm mb-1">✦ Intelligent Platform</p>
            <h2 className="font-display text-3xl font-bold text-[#0F172A]">
              AI-Powered Features
            </h2>
            <p className="text-[#64748B] mt-2 max-w-xl mx-auto">
              Cutting-edge artificial intelligence built specifically for real estate
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {aiFeatures.map(({ title, desc, icon: Icon, color }) => (
              <div key={title} className="flex gap-5 p-6 rounded-2xl border border-[#A5F3FC] bg-white shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A] mb-1">{title}</h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/ai-assistant">
              <Button size="lg" className="bg-[#10B981] text-white hover:bg-[#059669] rounded-xl gap-2">
                <Bot className="h-5 w-5" /> Try AI Assistant
              </Button>
            </Link>
            <Link href="/price-prediction">
              <Button variant="outline" size="lg" className="bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-gray-50 rounded-xl gap-2">
                <BarChart3 className="h-5 w-5 text-[#0891B2]" /> Predict Property Price
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ───────────────────────────────── */}
      <section className="py-20 bg-[#0F172A]">
        <div className="section-container text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Find Your Dream Property?
            </h2>
            <p className="text-[#94A3B8] text-lg mb-8 leading-relaxed">
              Join thousands of users who found their perfect property using our AI-powered platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="xl" className="bg-[#10B981] text-white hover:bg-[#059669] rounded-xl gap-2 w-full sm:w-auto">
                  <CheckCircle2 className="h-5 w-5" /> Create Free Account
                </Button>
              </Link>
              <Link href="/properties">
                <Button size="xl" variant="outline" className="border border-white/30 text-white hover:bg-white/10 rounded-xl gap-2 w-full sm:w-auto">
                  Browse Properties <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

