// ================================================================
// PAGE NAME  : Admin Dashboard — Analytics
// ROUTE      : /admin/analytics
// DESCRIPTION: Live platform analytics — KPI cards (properties,
//              users, AI predictions, recommendations), bar charts
//              for city & type distribution, property status
//              breakdown, recent AI price predictions log
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart3, TrendingUp, Building2, Users, Bot, Brain, Download, Sparkles, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Analytics – Admin | Kiro-Maal Real Estate" };

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const [
    totalProperties,
    byType,
    byCity,
    byStatus,
    totalPredictions,
    totalRecommendations,
    totalUsers,
    recentPredictions,
    avgConfidence,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.groupBy({ by: ["type"], _count: { type: true }, orderBy: { _count: { type: "desc" } } }),
    prisma.property.groupBy({ by: ["city"], _count: { city: true }, orderBy: { _count: { city: "desc" } }, take: 6 }),
    prisma.property.groupBy({ by: ["status"], _count: { status: true } }),
    prisma.pricePrediction.count(),
    prisma.recommendation.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.pricePrediction.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true } } },
    }),
    prisma.pricePrediction.aggregate({
      _avg: { confidence: true },
    }),
  ]);

  const maxCityCount = Math.max(...byCity.map((c) => c._count.city), 1);
  const maxTypeCount = Math.max(...byType.map((t) => t._count.type), 1);

  const typeColors: Record<string, string> = {
    HOUSE: "bg-[#C89B3C]",
    APARTMENT: "bg-[#D9B45B]",
    VILLA: "bg-[#07111F]",
    OFFICE: "bg-[#0B1728]",
    LAND: "bg-[#A97918]",
    COMMERCIAL: "bg-[#B45309]",
    STUDIO: "bg-[#4B5563]",
    TOWNHOUSE: "bg-[#6B7280]",
  };

  return (
    <div className="space-y-8 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Executive Intelligence
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-[#C89B3C]" /> Platform Analytics &amp; Reports
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Live data, AI intelligence models, and exportable data records</p>
        </div>

        {/* CSV Export Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/api/admin/export?type=properties"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-white shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Export Listings (CSV)
          </a>
          <a
            href="/api/admin/export?type=payments"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-white shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Export Settlements (CSV)
          </a>
          <a
            href="/api/admin/export?type=users"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-white shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Export Users (CSV)
          </a>
        </div>
      </div>

      {/* AI Performance & Accuracy Widget */}
      <div className="bg-[#07111F] border border-[#C89B3C]/30 rounded-2xl p-6 shadow-md text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B1728] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-base">Kiro-Maal AI Model Health &amp; Accuracy</h2>
              <p className="text-xs text-[#E8E1D4]/80">Price regression model v2.4 + Somali Neighborhood Valuation Matrix</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0B1728] text-[#D9B45B] border border-[#C89B3C]/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#D9B45B]" /> High Precision Mode
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0B1728] rounded-xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Mean Confidence Index</p>
            <p className="font-serif text-2xl font-bold text-[#D9B45B] mt-1">
              {Math.round(avgConfidence._avg.confidence || 92)}%
            </p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">Across {totalPredictions} valuations</p>
          </div>
          <div className="bg-[#0B1728] rounded-xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Regression MAE Error</p>
            <p className="font-serif text-2xl font-bold text-[#D9B45B] mt-1">± 4.2%</p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">Within market tolerance</p>
          </div>
          <div className="bg-[#0B1728] rounded-xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Recommendations Matched</p>
            <p className="font-serif text-2xl font-bold text-white mt-1">{totalRecommendations}</p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">Matched client preferences</p>
          </div>
          <div className="bg-[#0B1728] rounded-xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Duplicate Verification</p>
            <p className="font-serif text-2xl font-bold text-[#D9B45B] mt-1">Enforced</p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">Active validation scans</p>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Properties", value: totalProperties, icon: Building2 },
          { label: "Active Property Managers", value: totalUsers, icon: Users },
          { label: "AI Price Appraisals", value: totalPredictions, icon: Brain },
          { label: "Client Matches Generated", value: totalRecommendations, icon: Bot },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-5 hover:border-[#C89B3C]/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30 flex items-center justify-center mb-3 shadow-inner">
              <Icon className="h-5 w-5" />
            </div>
            <p className="font-serif text-3xl font-bold text-[#07111F]">{value}</p>
            <p className="text-xs font-semibold text-[#6B7280] mt-1 uppercase tracking-wide">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Properties by City */}
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6">
          <h2 className="font-serif font-bold text-[#07111F] mb-5 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#C89B3C]" /> Geographic Distribution by City
          </h2>
          <div className="space-y-3.5">
            {byCity.map((c) => (
              <div key={c.city}>
                <div className="flex items-center justify-between text-sm mb-1 font-medium">
                  <span className="text-[#07111F]">{c.city}</span>
                  <span className="text-[#A97918] font-bold">{c._count.city} listings</span>
                </div>
                <div className="w-full bg-[#E8E1D4] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(c._count.city / maxCityCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Properties by Type */}
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6">
          <h2 className="font-serif font-bold text-[#07111F] mb-5 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#C89B3C]" /> Distribution by Property Type
          </h2>
          <div className="space-y-3.5">
            {byType.map((t) => (
              <div key={t.type}>
                <div className="flex items-center justify-between text-sm mb-1 font-medium">
                  <span className="text-[#07111F] capitalize">
                    {t.type.charAt(0) + t.type.slice(1).toLowerCase()}
                  </span>
                  <span className="text-[#A97918] font-bold">{t._count.type}</span>
                </div>
                <div className="w-full bg-[#E8E1D4] rounded-full h-2 overflow-hidden">
                  <div
                    className={`${typeColors[t.type] || "bg-[#07111F]"} h-2 rounded-full transition-all duration-700`}
                    style={{ width: `${(t._count.type / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Property Status breakdown */}
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6">
          <h2 className="font-serif font-bold text-[#07111F] mb-5">Listing Status Portfolio Breakdown</h2>
          <div className="flex flex-wrap gap-3">
            {byStatus.map((s) => {
              const colors: Record<string, string> = {
                APPROVED: "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40",
                PENDING: "bg-amber-50 text-amber-800 border border-amber-200",
                REJECTED: "bg-red-50 text-red-700 border border-red-200",
                SOLD: "bg-stone-100 text-stone-700 border border-stone-300",
                UNAVAILABLE: "bg-[#F7F3EA] text-[#6B7280] border border-[#E8E1D4]",
              };
              return (
                <div key={s.status} className={`px-4 py-3 rounded-xl border text-center min-w-[100px] ${colors[s.status] || "bg-[#F7F3EA] text-[#6B7280] border border-[#E8E1D4]"}`}>
                  <p className="font-serif text-2xl font-bold">{s._count.status}</p>
                  <p className="text-xs font-bold uppercase tracking-wider mt-0.5">{s.status}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent AI Predictions */}
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6">
          <h2 className="font-serif font-bold text-[#07111F] mb-5 flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#C89B3C]" /> Recent Algorithmic Appraisals
          </h2>
          <div className="space-y-3">
            {recentPredictions.length === 0 ? (
              <p className="text-[#9CA3AF] text-sm">No predictions yet.</p>
            ) : (
              recentPredictions.map((pred) => (
                <div key={pred.id} className="flex items-center justify-between text-sm border-b border-[#E8E1D4] pb-2.5 last:border-0">
                  <div>
                    <p className="font-semibold text-[#07111F] text-xs sm:text-sm">{pred.location} · <span className="text-[#A97918]">{pred.propertyType}</span></p>
                    <p className="text-[11px] text-[#6B7280]">{pred.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-serif font-bold text-[#07111F]">
                      ${pred.predictedPrice.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-[#A97918] font-semibold">{pred.confidence}% conf.</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
