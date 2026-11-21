// ================================================================
// PAGE NAME  : Manager Dashboard — Portfolio Performance Analytics
// ROUTE      : /dashboard/analytics
// DESCRIPTION: Executive analytics with interactive Recharts graphs,
//              KPI cards, city density, asset mix, and top listings
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  BarChart3,
  Building2,
  Sparkles,
  Eye,
  DollarSign,
  CheckCircle2,
  MapPin,
  ArrowUpRight,
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
  title: "Portfolio Performance Analytics – Manager Dashboard | Kiro-Maal Real Estate",
};

export default async function ManagerAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [properties, paidPayments, totalInquiries] = await Promise.all([
    prisma.property.findMany({
      where: { managerId: userId },
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
      where: { managerId: userId, status: "PAID" },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.inquiry.count({
      where: {
        OR: [{ managerId: userId }, { property: { managerId: userId } }],
      },
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
  const totalEarnings = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
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

  // 2. City Distribution (sorted descending by listing count)
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
      title: "TOTAL PORTFOLIO LISTINGS",
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
      subText: `${pendingListings} Under Review`,
      icon: CheckCircle2,
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#A97918]",
      numberColor: "text-[#07111F]",
    },
    {
      title: "TOTAL ENGAGEMENT",
      value: totalViews.toLocaleString(),
      tagText: `${totalInquiries} Leads`,
      tagColor: "text-[#D9B45B]",
      subText: "Property Page Views",
      icon: Eye,
      cardBg: "bg-[#0B1728] text-white border border-[#C89B3C]/25",
      iconContainer: "bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B]",
      numberColor: "text-[#FCFBF7]",
    },
    {
      title: "TOTAL REVENUE YIELD",
      value: formatPrice(totalEarnings),
      tagText: `${paidPayments.length} Settled`,
      tagColor: "text-[#16A34A]",
      subText: "Verified Payments",
      icon: DollarSign,
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#16A34A]",
      numberColor: "text-[#07111F]",
    },
  ];

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-5 sm:p-7 pb-12">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Performance Telemetry
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <BarChart3 className="h-7 w-7 text-[#C89B3C]" /> Portfolio Performance Analytics
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Executive revenue trends, geographic density, asset mix, and listing engagement telemetry.
          </p>
        </div>

        <Link
          href="/dashboard/properties"
          className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 hover:brightness-110 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
        >
          Manage Portfolio <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ─── 4 Executive KPI Cards ─── */}
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

      {/* ─── Top Performing Properties Table ─── */}
      <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif font-bold text-[#07111F] text-base sm:text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#C89B3C]" /> Top Performing Listings
            </h2>
            <p className="text-xs text-[#6B7280]">
              Ranked by live customer views and buyer engagement
            </p>
          </div>
          <Link
            href="/dashboard/properties"
            className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918]"
          >
            View All →
          </Link>
        </div>

        {topProperties.length === 0 ? (
          <p className="text-xs text-[#6B7280] py-6 text-center">No properties listed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E8E1D4] text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                  <th className="py-3 px-3">Property</th>
                  <th className="py-3 px-3">City</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Valuation</th>
                  <th className="py-3 px-3">Engagement</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE1]">
                {topProperties.map((p) => {
                  const pct = Math.max(8, Math.round(((p.viewCount || 0) / maxViews) * 100));
                  return (
                    <tr key={p.id} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3.5 px-3 font-bold font-serif text-[#07111F] max-w-[240px] truncate">
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
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-[#F7F3EA] border border-[#E8E1D4] font-semibold text-[#07111F]">
                          {getPropertyTypeLabel(p.type)}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-[#07111F] whitespace-nowrap">
                        {formatPrice(p.price)}
                      </td>
                      <td className="py-3.5 px-3 w-[180px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#EDE7DC] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[#07111F] text-[11px] w-10 text-right">
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
        )}
      </div>
    </div>
  );
}
