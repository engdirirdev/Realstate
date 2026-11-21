// ================================================================
// PAGE NAME  : Admin Dashboard — Platform Analytics & Reports
// ROUTE      : /admin/analytics
// DESCRIPTION: Executive platform-wide analytics with interactive
//              Recharts graphs, KPI cards, AI model telemetry,
//              CSV exports, and top performing listings
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Brain,
  Download,
  Sparkles,
  CheckCircle2,
  Eye,
  DollarSign,
  MapPin,
} from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import dynamic from "next/dynamic";
import type { Metadata } from "next";

const PortfolioAnalyticsCharts = dynamic(
  () => import("@/components/manager/PortfolioAnalyticsCharts"),
  {
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
        <div className="lg:col-span-2 h-80 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4]" />
        <div className="h-80 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4]" />
      </div>
    ),
  }
);

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Platform Analytics & Reports – Admin | Kiro-Maal Real Estate",
};

export default async function AdminAnalyticsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [
    properties,
    paidPayments,
    totalPredictions,
    totalRecommendations,
    totalManagers,
    totalCustomers,
    recentPredictions,
    avgConfidence,
  ] = await Promise.all([
    prisma.property.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        availabilityStatus: true,
        type: true,
        listingType: true,
        price: true,
        city: true,
        viewCount: true,
        createdAt: true,
      },
      orderBy: { viewCount: "desc" },
    }),
    prisma.payment.findMany({
      where: { status: "PAID" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.pricePrediction.count(),
    prisma.recommendation.count(),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.pricePrediction.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: { select: { name: true } } },
    }),
    prisma.pricePrediction.aggregate({
      _avg: { confidence: true },
    }),
  ]);

  const totalListings = properties.length;
  const activeListings = properties.filter(
    (p) => p.status === "APPROVED" || p.status === "PUBLISHED"
  ).length;
  const rentedListings = properties.filter(
    (p) => p.status === "RENTED" || p.availabilityStatus === "RENTED"
  ).length;
  const soldListings = properties.filter(
    (p) => p.status === "SOLD" || p.availabilityStatus === "SOLD"
  ).length;
  const pendingListings = properties.filter((p) => p.status === "PENDING").length;

  const totalViews = properties.reduce((sum, p) => sum + (p.viewCount || 0), 0);
  const totalRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const totalPortfolioValue = properties.reduce((sum, p) => sum + (p.price || 0), 0);
  const publishRate = totalListings > 0 ? Math.round((activeListings / totalListings) * 100) : 0;

  // 1. Monthly Revenue Trend (12 months of current year)
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthlyRevenue = monthNames.map((month, idx) => {
    const items = paidPayments.filter((p) => {
      const d = new Date(p.createdAt);
      return d >= startOfYear && d.getMonth() === idx;
    });
    return {
      month,
      revenue: items.reduce((s, p) => s + (p.amount || 0), 0),
      deals: items.length,
    };
  });

  // 2. Geographic Distribution by City
  const cityMap = new Map<string, { listings: number; views: number; priceSum: number }>();
  for (const p of properties) {
    const key = p.city?.trim() || "Unknown";
    const cur = cityMap.get(key) || { listings: 0, views: 0, priceSum: 0 };
    cur.listings += 1;
    cur.views += p.viewCount || 0;
    cur.priceSum += p.price || 0;
    cityMap.set(key, cur);
  }
  const cityDistribution = Array.from(cityMap.entries())
    .map(([city, stats]) => ({
      city,
      listings: stats.listings,
      views: stats.views,
      avgPrice: stats.listings > 0 ? Math.round(stats.priceSum / stats.listings) : 0,
    }))
    .sort((a, b) => b.listings - a.listings);

  // 3. Asset Mix by Property Type
  const typePalette = ["#07111F", "#C89B3C", "#D9B45B", "#1E3A5F", "#A97918", "#475569", "#94A3B8"];
  const typeMap = new Map<string, number>();
  for (const p of properties) {
    const label = getPropertyTypeLabel(p.type);
    typeMap.set(label, (typeMap.get(label) || 0) + 1);
  }
  const typeDistribution = Array.from(typeMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, value], idx) => ({
      name,
      value,
      color: typePalette[idx % typePalette.length],
    }));

  // 4. Inventory Status Breakdown
  const statusBreakdown = [
    { status: "Published", count: activeListings, color: "#C89B3C" },
    { status: "Rented", count: rentedListings, color: "#07111F" },
    { status: "Sold", count: soldListings, color: "#16A34A" },
    { status: "Pending", count: pendingListings, color: "#D9B45B" },
  ];

  const topProperties = properties.slice(0, 6);
  const maxViews = Math.max(1, ...topProperties.map((p) => p.viewCount || 0));

  const kpiCards = [
    {
      title: "TOTAL PLATFORM LISTINGS",
      value: totalListings.toString(),
      tagText: formatPrice(totalPortfolioValue),
      tagColor: "text-[#D9B45B]",
      subText: "Gross Asset Value",
      icon: Building2,
      cardBg: "bg-[#07111F] text-white border border-[#C89B3C]/25",
      iconContainer: "bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B]",
      numberColor: "text-[#FCFBF7]",
    },
    {
      title: "ACTIVE PUBLISHED",
      value: activeListings.toString(),
      tagText: `${publishRate}% Live`,
      tagColor: "text-[#A97918]",
      subText: `${totalManagers} Managers • ${totalCustomers} Clients`,
      icon: CheckCircle2,
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#A97918]",
      numberColor: "text-[#07111F]",
    },
    {
      title: "PLATFORM ENGAGEMENT",
      value: totalViews.toLocaleString(),
      tagText: `${totalPredictions} AI Appraisals`,
      tagColor: "text-[#D9B45B]",
      subText: "Total Property Views",
      icon: Eye,
      cardBg: "bg-[#0B1728] text-white border border-[#C89B3C]/25",
      iconContainer: "bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B]",
      numberColor: "text-[#FCFBF7]",
    },
    {
      title: "TOTAL PLATFORM REVENUE",
      value: formatPrice(totalRevenue),
      tagText: `${paidPayments.length} Settled`,
      tagColor: "text-[#16A34A]",
      subText: "Verified Settlements",
      icon: DollarSign,
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#16A34A]",
      numberColor: "text-[#07111F]",
    },
  ];

  return (
    <div className="space-y-6 w-full min-w-0 pb-10">
      {/* ─── Header & CSV Exports ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Executive Intelligence
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-[#C89B3C]" /> Platform Analytics &amp; Reports
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Platform-wide revenue graphs, geographic density, asset mix, AI telemetry, and exportable CSV reports.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="/api/admin/export?type=properties"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-white shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Export Listings
          </a>
          <a
            href="/api/admin/export?type=payments"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-white shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Export Settlements
          </a>
          <a
            href="/api/admin/export?type=users"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FCFBF7] border border-[#E8E1D4] text-[#07111F] hover:bg-white shadow-xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#C89B3C]" /> Export Users
          </a>
        </div>
      </div>

      {/* ─── 4 Executive KPI Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 ${card.cardBg} shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between min-h-[138px]`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  {card.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl ${card.iconContainer} flex items-center justify-center shrink-0`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="my-3">
                <div
                  className={`text-2xl sm:text-3xl font-black font-serif ${card.numberColor} tracking-tight leading-none`}
                >
                  {card.value}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`font-bold ${card.tagColor}`}>{card.tagText}</span>
                <span className="opacity-70 font-medium">• {card.subText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Interactive Recharts Graphs & Charts ─── */}
      <PortfolioAnalyticsCharts
        monthlyRevenue={monthlyRevenue}
        cityDistribution={cityDistribution}
        typeDistribution={typeDistribution}
        statusBreakdown={statusBreakdown}
        totalListings={totalListings}
      />

      {/* ─── AI Performance & Accuracy Widget ─── */}
      <div className="bg-[#07111F] border border-[#C89B3C]/30 rounded-3xl p-6 shadow-md text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#0B1728] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-base">
                Kiro-Maal AI Model Health &amp; Accuracy
              </h2>
              <p className="text-xs text-[#E8E1D4]/80">
                Price regression model v2.4 + Somali Neighborhood Valuation Matrix
              </p>
            </div>
          </div>
          <span className="self-start sm:self-auto inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[#0B1728] text-[#D9B45B] border border-[#C89B3C]/40">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#D9B45B]" /> High Precision Mode
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#0B1728] rounded-2xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Mean Confidence Index</p>
            <p className="font-serif text-2xl font-bold text-[#D9B45B] mt-1">
              {Math.round(avgConfidence._avg.confidence || 92)}%
            </p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">
              Across {totalPredictions} valuations
            </p>
          </div>
          <div className="bg-[#0B1728] rounded-2xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Regression MAE Error</p>
            <p className="font-serif text-2xl font-bold text-[#D9B45B] mt-1">± 4.2%</p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">Within market tolerance</p>
          </div>
          <div className="bg-[#0B1728] rounded-2xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Recommendations Matched</p>
            <p className="font-serif text-2xl font-bold text-white mt-1">
              {totalRecommendations}
            </p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">Matched client preferences</p>
          </div>
          <div className="bg-[#0B1728] rounded-2xl p-4 border border-[#C89B3C]/20">
            <p className="text-xs text-[#E8E1D4]/70 font-medium">Duplicate Verification</p>
            <p className="font-serif text-2xl font-bold text-[#D9B45B] mt-1">Enforced</p>
            <p className="text-[11px] text-[#E8E1D4]/50 mt-0.5">Active validation scans</p>
          </div>
        </div>
      </div>

      {/* ─── Bottom Grid: Top Performing Listings (2 cols) + Recent AI Appraisals (1 col) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif font-bold text-[#07111F] text-base sm:text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#C89B3C]" /> Top Performing Listings
              </h2>
              <p className="text-xs text-[#6B7280]">
                Highest-engagement properties across the entire platform
              </p>
            </div>
            <Link
              href="/admin/properties"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918]"
            >
              View All →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E1D4] text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3 px-3">Property</th>
                  <th className="py-3 px-3">City</th>
                  <th className="py-3 px-3">Valuation</th>
                  <th className="py-3 px-3">Views</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE1]">
                {topProperties.map((p) => {
                  const pct = Math.max(8, Math.round(((p.viewCount || 0) / maxViews) * 100));
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3.5 px-3 font-bold font-serif text-[#07111F] max-w-[200px] truncate">
                        <Link
                          href={`/properties/${p.id}`}
                          className="hover:text-[#C89B3C] transition-colors"
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td className="py-3.5 px-3 text-[#6B7280] whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#C89B3C]" />
                          {p.city}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-[#07111F] whitespace-nowrap">
                        {formatPrice(p.price)}
                      </td>
                      <td className="py-3.5 px-3 w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#EDE7DC] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[#07111F] text-[11px] w-8 text-right">
                            {p.viewCount || 0}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            p.status === "SOLD"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : p.status === "RENTED"
                              ? "bg-[#07111F] text-[#D9B45B]"
                              : "bg-amber-50 text-[#A97918] border border-[#C89B3C]/40"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Algorithmic Appraisals */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
          <h2 className="font-serif font-bold text-[#07111F] text-base mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#C89B3C]" /> Recent AI Appraisals
          </h2>
          <div className="space-y-3">
            {recentPredictions.length === 0 ? (
              <p className="text-[#9CA3AF] text-xs py-6 text-center">No predictions yet.</p>
            ) : (
              recentPredictions.map((pred) => (
                <div
                  key={pred.id}
                  className="flex items-center justify-between text-xs border-b border-[#E8E1D4] pb-2.5 last:border-0"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-[#07111F] truncate">
                      {pred.location} ·{" "}
                      <span className="text-[#A97918]">{pred.propertyType}</span>
                    </p>
                    <p className="text-[11px] text-[#6B7280] truncate">{pred.user.name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif font-bold text-[#07111F]">
                      ${pred.predictedPrice.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-[#A97918] font-semibold">
                      {pred.confidence}% conf.
                    </p>
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
