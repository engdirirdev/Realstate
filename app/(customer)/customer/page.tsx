// ================================================================
// PAGE NAME  : Customer Portal — Overview
// ROUTE      : /customer
// DESCRIPTION: Dedicated Customer Portal — saved properties, AI
//              recommendations, price predictions, AI assistant
// ROLE       : CUSTOMER & USER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Heart, Bot, BarChart3, Building2, ArrowRight,
  Sparkles, MapPin, BedDouble, ShieldCheck,
} from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customer Portal – AI Real Estate" };

export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [
    favoritesCount,
    predictionsCount,
    bookingsCount,
    inquiriesCount,
    savedSearchesCount,
    recommendations,
    recentFavorites,
  ] = await Promise.all([
    prisma.favorite.count({ where: { userId } }),
    prisma.pricePrediction.count({ where: { userId } }),
    prisma.booking.count({ where: { customerId: userId } }),
    prisma.inquiry.count({ where: { customerId: userId } }),
    prisma.searchHistory.count({ where: { userId, isSaved: true } }),
    prisma.recommendation.findMany({
      where: { userId },
      include: {
        property: { include: { images: { take: 1, orderBy: { order: "asc" } } } },
      },
      orderBy: { score: "desc" },
      take: 4,
    }),
    prisma.favorite.findMany({
      where: { userId },
      include: {
        property: { include: { images: { take: 1, orderBy: { order: "asc" } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const stats = [
    { label: "Saved Properties", value: favoritesCount, icon: Heart, href: "/customer/favorites", color: "bg-[#10B981]/15 text-[#10B981]" },
    { label: "My Bookings", value: bookingsCount, icon: BedDouble, href: "/customer/bookings", color: "bg-[#3B82F6]/15 text-[#3B82F6]" },
    { label: "Sent Inquiries", value: inquiriesCount, icon: Bot, href: "/customer/inquiries", color: "bg-[#06B6D4]/15 text-[#0891B2]" },
    { label: "AI Matches", value: recommendations.length, icon: Sparkles, href: "/customer/recommendations", color: "bg-[#8B5CF6]/15 text-[#8B5CF6]" },
  ];

  return (
    <div className="space-y-8 bg-[#F8FAFC]">
      {/* ─── Customer Welcome Banner ─── */}
      <div className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-card border border-[#1E293B]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#06B6D4]/15 blur-3xl" />
          <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-[#10B981]/15 blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E293B] border border-[#334155] text-[#22D3EE] text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Customer Portal &amp; AI Property Finder
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome, {session.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-[#CBD5E1] text-sm sm:text-base max-w-xl mb-6 leading-relaxed">
            Find verified Somali properties, review AI price forecasts, and schedule property viewings with certified local managers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/properties"
              className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Building2 className="h-4 w-4" /> Explore Properties
            </Link>
            <Link
              href="/properties/compare"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <Sparkles className="h-4 w-4 text-[#22D3EE]" /> Compare Properties
            </Link>
            <Link
              href="/customer/saved-searches"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Saved Searches ({savedSearchesCount})
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Customer Stats Row ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0] hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group block"
          >
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-[#0F172A] tracking-tight">{value}</div>
            <div className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium flex items-center justify-between">
              <span>{label}</span>
              <ArrowRight className="h-3.5 w-3.5 text-[#10B981] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </div>
          </Link>
        ))}
      </div>

      {/* ─── AI Matches & Favorites ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#8B5CF6]" /> AI Property Matches
            </h2>
            <Link
              href="/customer/recommendations"
              className="text-xs text-[#10B981] hover:text-[#059669] font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recommendations.length === 0 ? (
            <div className="text-center py-8 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <Bot className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No property matches yet</p>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-xs mx-auto mb-4">
                Set your budget and preferred city to generate AI matches.
              </p>
              <Link href="/customer/profile">
                <span className="inline-flex items-center text-xs font-semibold text-[#10B981] hover:underline">
                  Set AI Preferences →
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {recommendations.map(({ property, score }) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all group"
                >
                  <div className="w-14 h-14 rounded-lg bg-[#E2E8F0] overflow-hidden flex-shrink-0 relative">
                    {property.images[0] ? (
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#F1F5F9] text-[#94A3B8]">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate group-hover:text-[#10B981] transition-colors">
                      {property.title}
                    </p>
                    <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#94A3B8]" /> {property.city}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#059669]">{formatPrice(property.price)}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#8B5CF6] bg-[#8B5CF6]/10 px-2 py-0.5 rounded-full border border-[#8B5CF6]/20 mt-0.5">
                      {Math.round(score > 1 ? score : score * 100)}% Match
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Saved Favorites */}
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#DC2626]" /> Saved Favorites
            </h2>
            <Link
              href="/customer/favorites"
              className="text-xs text-[#10B981] hover:text-[#059669] font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentFavorites.length === 0 ? (
            <div className="text-center py-8 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <Heart className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No saved properties</p>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-xs mx-auto mb-4">
                Click the heart icon on any property listing to save it here.
              </p>
              <Link href="/properties">
                <span className="inline-flex items-center text-xs font-semibold text-[#10B981] hover:underline">
                  Browse Properties →
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {recentFavorites.map(({ property }) => (
                <Link
                  key={property.id}
                  href={`/properties/${property.id}`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all group"
                >
                  <div className="w-14 h-14 rounded-lg bg-[#E2E8F0] overflow-hidden flex-shrink-0 relative">
                    {property.images[0] ? (
                      <img
                        src={property.images[0].url}
                        alt={property.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#F1F5F9] text-[#94A3B8]">
                        <Building2 className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate group-hover:text-[#10B981] transition-colors">
                      {property.title}
                    </p>
                    <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#94A3B8]" /> {property.city}
                      {property.bedrooms > 0 && (
                        <span className="flex items-center gap-1 ml-2">
                          <BedDouble className="h-3 w-3 text-[#94A3B8]" /> {property.bedrooms} beds
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#059669]">{formatPrice(property.price)}</p>
                    <span className="text-[10px] text-[#64748B] font-medium block mt-0.5">
                      {getPropertyTypeLabel(property.type)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
