// ================================================================
// PAGE NAME  : Manager Dashboard — Property Analytics
// ROUTE      : /dashboard/analytics
// DESCRIPTION: Property analytics for manager portfolio
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BarChart3, Building2, TrendingUp, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Property Analytics – Manager Dashboard" };

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
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <BarChart3 className="h-6 w-6 text-[#10B981]" /> Property Analytics
        </h1>
        <p className="text-[#64748B] text-sm mt-1">Performance breakdown of your property portfolio.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-card border border-[#E2E8F0]">
          <p className="text-xs font-semibold text-[#64748B]">Total Listings</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-1">{properties.length}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-[#E2E8F0]">
          <p className="text-xs font-semibold text-[#64748B]">Active Listings</p>
          <p className="text-2xl font-bold text-[#10B981] mt-1">{activeListings}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-[#E2E8F0]">
          <p className="text-xs font-semibold text-[#64748B]">Pending Review</p>
          <p className="text-2xl font-bold text-[#D97706] mt-1">{pendingApprovals}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-card border border-[#E2E8F0]">
          <p className="text-xs font-semibold text-[#64748B]">Total Revenue</p>
          <p className="text-2xl font-bold text-[#059669] mt-1">{formatPrice(totalEarnings)}</p>
        </div>
      </div>

      {/* City breakdown */}
      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6 space-y-4">
        <h2 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
          <Building2 className="h-5 w-5 text-[#10B981]" /> Portfolio by City
        </h2>
        {byCity.length === 0 ? (
          <p className="text-xs text-[#94A3B8]">No properties listed yet.</p>
        ) : (
          <div className="space-y-3">
            {byCity.map((c) => (
              <div key={c.city} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#0F172A]">{c.city}</span>
                <span className="bg-[#F1F5F9] px-2.5 py-1 rounded-full text-[#334155] font-bold">{c._count.city} listings</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
