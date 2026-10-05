// ================================================================
// PAGE NAME  : Admin Dashboard — Overview
// ROUTE      : /admin
// BRAND      : Kiro-Maal Real Estate
// DESCRIPTION: Exact reproduction of reference screenshot layout,
//              colors, cards, charts, and typography.
//              All database queries and business logic 100% preserved.
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  Tag,
  Key,
  Users,
  DollarSign,
  FileText,
  Calendar,
  UserCheck,
  ChevronRight,
  MapPin,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import AdminCharts from "@/components/admin/AdminCharts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard – Kiro-Maal Real Estate",
};

// Mini Golden Bar Chart Component
function MiniBarChart() {
  return (
    <div className="flex items-end gap-1 h-8 shrink-0">
      <div className="w-1.5 h-3 bg-[#E8B849]/60 rounded-xs" />
      <div className="w-1.5 h-4 bg-[#E8B849]/80 rounded-xs" />
      <div className="w-1.5 h-6 bg-[#D9A336] rounded-xs" />
      <div className="w-1.5 h-5 bg-[#D9A336] rounded-xs" />
      <div className="w-1.5 h-7 bg-[#C99126] rounded-xs" />
      <div className="w-1.5 h-8 bg-[#B8811E] rounded-xs" />
    </div>
  );
}

// Mini Golden Wavy Sparkline Component
function MiniWaveLine() {
  return (
    <div className="h-8 w-16 shrink-0 flex items-center justify-end">
      <svg className="w-16 h-7" viewBox="0 0 80 32" fill="none">
        <path
          d="M 2 24 Q 18 28, 32 16 T 55 18 T 78 8"
          stroke="#C99126"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default async function AdminPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);

  // Fetch all real database metrics concurrently (identical queries preserved)
  const [
    totalProperties,
    propertiesSold,
    propertiesRented,
    totalCustomers,
    totalRevenueAgg,
    pendingInquiries,
    pendingProperties,
    todayBookings,
    activeAgents,
    propertiesByType,
    paymentsThisYear,
    recentPropertiesList,
    recentCustomersList,
  ] = await Promise.all([
    // 1. Total Properties
    prisma.property.count(),
    // 2. Properties Sold
    prisma.property.count({ where: { status: "SOLD" } }),
    // 3. Properties Rented
    prisma.property.count({ where: { status: "RENTED" } }),
    // 4. Total Customers
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    // 5. Total Revenue
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
    }),
    // 6. Pending Inquiries & Properties
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.property.count({ where: { status: "PENDING" } }),
    // 7. Today's Appointments
    prisma.booking.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    // 8. Active Agents / Managers
    prisma.user.count({
      where: { role: { in: ["USER", "ADMIN"] }, isActive: true },
    }),
    // Property Types distribution
    prisma.property.groupBy({
      by: ["type"],
      _count: { id: true },
    }),
    // Payments for current year
    prisma.payment.findMany({
      where: { status: "PAID", createdAt: { gte: yearStart } },
      select: { amount: true, createdAt: true },
    }),
    // Recent Properties
    prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        images: { take: 1, orderBy: { order: "asc" } },
        manager: true,
      },
    }),
    // Recent Customers
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const totalRevenue = totalRevenueAgg._sum.amount || 0;
  const pendingRequests = pendingInquiries + pendingProperties;

  // Monthly Revenue Chart Data
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
  const monthlyRevenue = monthNames.map((month, index) => {
    const sum = paymentsThisYear
      .filter((p) => new Date(p.createdAt).getMonth() === index)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { month, revenue: sum };
  });

  // Property Types Pie Data matching Kiro-Maal luxury palette
  const typeColorPalette: Record<string, string> = {
    VILLA: "#C89B3C",      // Luxury Gold
    APARTMENT: "#1D4ED8",  // Royal Blue
    HOUSE: "#D97706",      // Warm Amber
    COMMERCIAL: "#059669", // Emerald Green
    OFFICE: "#0F172A",     // Deep Navy
    LAND: "#7C3AED",       // Royal Purple
    TOWNHOUSE: "#EA580C",  // Terracotta Orange
    STUDIO: "#0284C7",     // Sky Azure
  };

  const propertyTypesData = propertiesByType
    .sort((a, b) => b._count.id - a._count.id)
    .map((item) => {
      const count = item._count.id;
      const rawPct = totalProperties > 0 ? (count / totalProperties) * 100 : 0;
      const percentage = Number(rawPct.toFixed(1));
      const readableName =
        item.type.charAt(0) +
        item.type.slice(1).toLowerCase() +
        (item.type.endsWith("S") ? "" : "s");
      return {
        name: readableName,
        value: count,
        percentage,
        color: typeColorPalette[item.type] || "#C89B3C",
      };
    });

  // Helper for human-friendly relative time
  function formatRelativeTime(date: Date) {
    const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return `${Math.floor(diffSec / 86400)}d ago`;
  }

  // Current Date String matching screenshot "Oct 4, 2026" / "Saturday"
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const weekdayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  });

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO / WELCOME BANNER (Exact Match to Screenshot)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F5EFEB] via-[#F4EDE6] to-transparent border border-[#E6DED4] min-h-[140px] flex items-center p-6 sm:p-8">
        {/* Right Half: Sunset Luxury Villa Panoramic Image */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[65%] md:w-[58%] overflow-hidden z-0 pointer-events-none">
          <Image
            src="/images/luxury_villa_banner.jpg"
            alt="Luxury Villa Sunset Banner"
            fill
            priority
            className="object-cover object-right"
          />
          {/* Gradient fade to seamlessly blend with the left text area */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#F5EFEB] via-[#F5EFEB]/70 to-transparent" />
        </div>

        {/* Left Content */}
        <div className="relative z-10 max-w-lg">
          <p className="text-xs sm:text-sm font-semibold text-slate-700">
            Welcome back,
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-[#0B1523] tracking-tight leading-tight flex items-center gap-2">
            <span>Admin!</span>
            <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Here&apos;s what&apos;s happening with your real estate platform.
          </p>
        </div>

        {/* Floating Top Right Date Card */}
        <div className="absolute top-5 right-5 z-10 hidden sm:flex items-center gap-3 bg-[#0B1523]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#D9A336]">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="font-extrabold text-xs text-white leading-tight">
              {dateFormatted}
            </p>
            <p className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              {weekdayFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. 8 KPI STATISTICS CARDS (Alternating Checkerboard Layout)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* ── CARD 1: TOTAL PROPERTIES (Dark Navy) ── */}
        <div className="bg-[#0B1523] text-white rounded-2xl p-5 border border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/60 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                TOTAL PROPERTIES
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 group-hover:border-white/50 group-hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {totalProperties}
            </div>
            <MiniWaveLine />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#C89B3C]">↑ Live</span>
            <span className="text-slate-400 font-medium">Total Registered</span>
          </div>
        </div>

        {/* ── CARD 2: PROPERTIES SOLD (White / Soft Cream) ── */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 border border-[#E6DED4] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/50 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Tag className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                PROPERTIES SOLD
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-slate-400 group-hover:text-slate-700 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-[#0B1523] tracking-tight">
              {propertiesSold}
            </div>
            <MiniBarChart />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#EF4444]">↑ Today</span>
            <span className="text-slate-500 font-medium">Sold Listings</span>
          </div>
        </div>

        {/* ── CARD 3: PROPERTIES RENTED (Dark Navy) ── */}
        <div className="bg-[#0B1523] text-white rounded-2xl p-5 border border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/60 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Key className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                PROPERTIES RENTED
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 group-hover:border-white/50 group-hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {propertiesRented}
            </div>
            <MiniBarChart />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#C89B3C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]" /> Active
            </span>
            <span className="text-slate-400 font-medium">In Lease</span>
          </div>
        </div>

        {/* ── CARD 4: TOTAL CUSTOMERS (White / Soft Cream) ── */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 border border-[#E6DED4] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/50 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                TOTAL CUSTOMERS
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-slate-400 group-hover:text-slate-700 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-[#0B1523] tracking-tight">
              {totalCustomers}
            </div>
            <MiniWaveLine />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#C89B3C]">↑ +14%</span>
            <span className="text-slate-500 font-medium">Registered Buyers</span>
          </div>
        </div>

        {/* ── CARD 5: TOTAL REVENUE (White / Soft Cream) ── */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 border border-[#E6DED4] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/50 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                TOTAL REVENUE
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-slate-400 group-hover:text-slate-700 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-[#0B1523] tracking-tight">
              {formatPrice(totalRevenue)}
            </div>
            <MiniBarChart />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#C89B3C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]" /> Total
              Amount
            </span>
            <span className="text-slate-500 font-medium">Collected Today</span>
          </div>
        </div>

        {/* ── CARD 6: PENDING REQUESTS (Dark Navy) ── */}
        <div className="bg-[#0B1523] text-white rounded-2xl p-5 border border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/60 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                PENDING REQUESTS
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 group-hover:border-white/50 group-hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {pendingRequests}
            </div>
            <MiniBarChart />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#EF4444] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]" /> Needs
              Action
            </span>
            <span className="text-slate-400 font-medium">Pending Inquiries</span>
          </div>
        </div>

        {/* ── CARD 7: TODAY'S APPOINTMENTS (White / Soft Cream) ── */}
        <div className="bg-white text-slate-900 rounded-2xl p-5 border border-[#E6DED4] shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/50 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                TODAY&apos;S APPOINTMENTS
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-slate-400 group-hover:text-slate-700 transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-[#0B1523] tracking-tight">
              {todayBookings}
            </div>
            <MiniBarChart />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#C89B3C] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C]" /> Scheduled
            </span>
            <span className="text-slate-500 font-medium">Tours & Visits</span>
          </div>
        </div>

        {/* ── CARD 8: ACTIVE AGENTS (Dark Navy) ── */}
        <div className="bg-[#0B1523] text-white rounded-2xl p-5 border border-white/10 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[145px] group hover:border-[#C99126]/60 transition-all">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                ACTIVE AGENTS
              </span>
            </div>
            <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center text-white/60 group-hover:border-white/50 group-hover:text-white transition-all">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-center justify-between my-2">
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {activeAgents}
            </div>
            <MiniWaveLine />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-[#C89B3C]">↑ Live</span>
            <span className="text-slate-400 font-medium">Verified Agents</span>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. ANALYTICS (MONTHLY REVENUE & PROPERTY TYPES)
          ───────────────────────────────────────────────────────────── */}
      <AdminCharts
        monthlyRevenue={monthlyRevenue}
        propertyTypes={propertyTypesData}
        totalProperties={totalProperties}
      />

      {/* ─────────────────────────────────────────────────────────────
          4. RECENT PROPERTIES & RECENT CUSTOMERS (Matching Screenshot)
          ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): RECENT PROPERTIES */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E6DED4] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1523] tracking-tight">
                  Recent Properties
                </h3>
                <p className="text-xs text-slate-500">
                  Latest properties added to the platform
                </p>
              </div>
            </div>

            <Link
              href="/admin/properties"
              className="px-3.5 py-1.5 rounded-xl bg-[#FAF5EC] hover:bg-[#F3EAD9] border border-[#E6DED4] text-[#8C6518] text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#E6DED4] overflow-x-auto">
            {recentPropertiesList.length > 0 ? (
              recentPropertiesList.map((property) => (
                <div
                  key={property.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4 hover:bg-[#FAF5EC]/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-[#E6DED4] relative">
                      {property.images[0]?.url ? (
                        <img
                          src={property.images[0].url}
                          alt={property.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                          <Building2 className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-xs sm:text-sm font-bold text-[#0B1523] hover:text-[#C99126] truncate block transition-colors"
                      >
                        {property.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#C99126]" />{" "}
                          {property.city}
                        </span>
                        <span>•</span>
                        <span className="font-semibold text-slate-700">
                          {property.type}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs sm:text-sm font-black text-[#0B1523]">
                        {formatPrice(property.price)}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          property.status === "APPROVED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : property.status === "SOLD"
                            ? "bg-slate-100 text-slate-700 border border-slate-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {property.status}
                      </span>
                    </div>

                    <Link
                      href={`/properties/${property.id}`}
                      className="hidden sm:inline-flex p-2 text-slate-400 hover:text-[#0B1523] hover:bg-slate-100 rounded-lg border border-[#E6DED4] transition-colors"
                      title="View Details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No properties registered yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (1 col): RECENT CUSTOMERS */}
        <div className="bg-white rounded-2xl border border-[#E6DED4] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C99126] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0B1523] tracking-tight">
                  Recent Customers
                </h3>
                <p className="text-xs text-slate-500">
                  Latest registered customers
                </p>
              </div>
            </div>

            <Link
              href="/admin/users?role=CUSTOMER"
              className="px-3.5 py-1.5 rounded-xl bg-[#FAF5EC] hover:bg-[#F3EAD9] border border-[#E6DED4] text-[#8C6518] text-xs font-bold flex items-center gap-1 transition-all shadow-2xs"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentCustomersList.length > 0 ? (
              recentCustomersList.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-[#FAF5EC]/60 border border-transparent hover:border-[#E6DED4] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#C99126] text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                      {customer.image ? (
                        <img
                          src={customer.image}
                          alt={customer.name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        customer.name?.charAt(0).toUpperCase() || "C"
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-[#0B1523] truncate">
                        {customer.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {customer.email}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Active
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {formatRelativeTime(customer.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">
                No customers registered yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
