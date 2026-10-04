// ================================================================
// PAGE NAME  : Manager Dashboard — Property Analytics
// ROUTE      : /dashboard/analytics
// DESCRIPTION: Property analytics for manager portfolio
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart3, Building2, TrendingUp, CheckCircle2, Clock, DollarSign, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Property Analytics – Manager Dashboard | Kiro-Maal Real Estate" };

export default async function ManagerAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [properties, totalPayments, byCity] = await Promise.all([
    prisma.property.findMany({
      where: { managerId: userId },
      select: { id: true, title: true, status: true, price: true, city: true, viewCount: true },
    }),
    prisma.payment.aggregate({
      where: { managerId: userId, status: "PAID" },
      _sum: { amount: true },
    }),
    prisma.property.groupBy({
      by: ["city"],
      where: { managerId: userId },
      _count: { city: true },
    }),
  ]);

  const activeListings = properties.filter((p) => p.status === "APPROVED" || p.status === "PUBLISHED").length;
  const pendingApprovals = properties.filter((p) => p.status === "PENDING").length;
  const totalEarnings = totalPayments._sum.amount || 0;

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Performance Telemetry
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <BarChart3 className="h-7 w-7 text-[#C89B3C]" /> Portfolio Performance Analytics
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Live performance breakdown, geographic density, and capital yields of your listings.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#FCFBF7] p-5 rounded-2xl shadow-sm border border-[#E8E1D4]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total Portfolio Listings</p>
          <p className="text-2xl font-serif font-bold text-[#07111F] mt-1.5">{properties.length}</p>
        </div>
        <div className="bg-[#FCFBF7] p-5 rounded-2xl shadow-sm border border-[#E8E1D4]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Active Published</p>
          <p className="text-2xl font-serif font-bold text-[#A97918] mt-1.5">{activeListings}</p>
        </div>
        <div className="bg-[#FCFBF7] p-5 rounded-2xl shadow-sm border border-[#E8E1D4]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Under Review</p>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-1.5">{pendingApprovals}</p>
        </div>
        <div className="bg-[#FCFBF7] p-5 rounded-2xl shadow-sm border border-[#E8E1D4]">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total Revenue Yield</p>
          <p className="text-2xl font-serif font-bold text-[#07111F] mt-1.5">{formatPrice(totalEarnings)}</p>
        </div>
      </div>

      {/* City breakdown */}
      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-4">
        <h2 className="font-serif font-bold text-[#07111F] text-base flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#C89B3C]" /> Geographic Distribution by City
        </h2>
        {byCity.length === 0 ? (
          <p className="text-xs text-[#9CA3AF]">No properties listed yet.</p>
        ) : (
          <div className="space-y-3">
            {byCity.map((c) => (
              <div key={c.city} className="flex items-center justify-between text-xs p-3 rounded-xl bg-white border border-[#E8E1D4]">
                <span className="font-semibold text-[#07111F]">{c.city}</span>
                <span className="bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30 px-3 py-1 rounded-full font-bold">{c._count.city} listings</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
