// ================================================================
// PAGE NAME  : Admin Dashboard — Overview
// ROUTE      : /admin
// DESCRIPTION: Admin control panel matching reference image style
// ROLE       : ADMIN only (redirects non-admins to /dashboard)
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Building2,
  CheckCircle2,
  Key,
  Users,
  DollarSign,
  Clock,
  Calendar,
  UserCheck,
  TrendingUp,
  Plus,
  BarChart3,
  Bot,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import AdminCharts from "@/components/admin/AdminCharts";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Dashboard – SkyHome Real Estate" };

export default async function AdminPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);

  // Fetch all real database metrics concurrently
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
    topCitiesGroup,
    recentAddedProps,
    recentSoldProps,
    recentCustomers,
    recentPredictions,
    recentBookings,
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
    // Top Cities
    prisma.property.groupBy({
      by: ["city"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
    // Recent Property Added
    prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      take: 1,
      include: { manager: true },
    }),
    // Recent Property Sold or Approved
    prisma.property.findMany({
      where: { status: { in: ["SOLD", "APPROVED"] } },
      orderBy: { updatedAt: "desc" },
      take: 1,
    }),
    // Recent Customer Registered
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      orderBy: { createdAt: "desc" },
      take: 1,
    }),
    // Recent AI Prediction
    prisma.pricePrediction.findMany({
      orderBy: { createdAt: "desc" },
      take: 1,
      include: { property: true },
    }),
    // Recent Booking
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: 1,
      include: { property: true, customer: true },
    }),
  ]);

  const totalRevenue = totalRevenueAgg._sum.amount || 0;
  const pendingRequests = pendingInquiries + pendingProperties;

  // Monthly Revenue Chart Data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyRevenue = monthNames.map((month, index) => {
    const sum = paymentsThisYear
      .filter((p) => new Date(p.createdAt).getMonth() === index)
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { month, revenue: sum };
  });

  // Property Types Pie Data
  const typeColorPalette: Record<string, string> = {
    HOUSE: "#1677FF",
    APARTMENT: "#06B6D4",
    VILLA: "#8B5CF6",
    LAND: "#10B981",
    COMMERCIAL: "#F59E0B",
    OFFICE: "#3B82F6",
    TOWNHOUSE: "#EC4899",
    STUDIO: "#64748B",
  };

  const propertyTypesData = propertiesByType.map((item) => {
    const count = item._count.id;
    const percentage = totalProperties > 0 ? Math.round((count / totalProperties) * 100) : 0;
    const readableName =
      item.type.charAt(0) + item.type.slice(1).toLowerCase() + (item.type.endsWith("S") ? "" : "s");
    return {
      name: readableName,
      value: count,
      percentage,
      color: typeColorPalette[item.type] || "#1677FF",
    };
  });

  // Top Cities bar calculations
  const maxCityCount = Math.max(...topCitiesGroup.map((c) => c._count.id), 1);

  // Helper for human-friendly relative time
  function formatRelativeTime(date: Date) {
    const diffSec = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  }

  // 8 Admin Stat Cards with vibrant luminous gradients matching user reference
  const statCards = [
    {
      title: "PATIENTS TODAY",
      displayTitle: "TOTAL PROPERTIES",
      value: totalProperties.toLocaleString(),
      tagText: "↑ Live",
      tagColor: "text-[#38BDF8]",
      subText: "Total Registered",
      icon: Building2,
      gradient: "from-[#0B254E] via-[#0E3A75] to-[#125BB5]",
    },
    {
      title: "PROPERTIES SOLD",
      displayTitle: "PROPERTIES SOLD",
      value: propertiesSold.toLocaleString(),
      tagText: "↑ Today",
      tagColor: "text-[#F87171]",
      subText: "Sold Listings",
      icon: CheckCircle2,
      gradient: "from-[#4A0E18] via-[#7B1728] to-[#B91C1C]",
    },
    {
      title: "PROPERTIES RENTED",
      displayTitle: "PROPERTIES RENTED",
      value: propertiesRented.toLocaleString(),
      tagText: "Active",
      tagColor: "text-[#38BDF8]",
      subText: "In Lease",
      icon: Key,
      gradient: "from-[#06293E] via-[#0B4F73] to-[#0284C7]",
    },
    {
      title: "TOTAL CUSTOMERS",
      displayTitle: "TOTAL CUSTOMERS",
      value: totalCustomers.toLocaleString(),
      tagText: "↑ +14%",
      tagColor: "text-[#C084FC]",
      subText: "Registered Buyers",
      icon: Users,
      gradient: "from-[#2E1065] via-[#4C1D95] to-[#7C3AED]",
    },
    {
      title: "TOTAL REVENUE",
      displayTitle: "TOTAL REVENUE",
      value: formatPrice(totalRevenue),
      tagText: "Total Amount",
      tagColor: "text-[#34D399]",
      subText: "Collected Today",
      icon: DollarSign,
      gradient: "from-[#063321] via-[#085337] to-[#10B981]",
    },
    {
      title: "PENDING REQUESTS",
      displayTitle: "PENDING REQUESTS",
      value: pendingRequests.toLocaleString(),
      tagText: "Needs Action",
      tagColor: "text-[#FCA5A5]",
      subText: "Pending Inquiries",
      icon: Clock,
      gradient: "from-[#4A0E18] via-[#7B1728] to-[#B91C1C]",
    },
    {
      title: "TODAY'S APPOINTMENTS",
      displayTitle: "TODAY'S APPOINTMENTS",
      value: todayBookings.toLocaleString(),
      tagText: "Scheduled",
      tagColor: "text-[#38BDF8]",
      subText: "Tours & Visits",
      icon: Calendar,
      gradient: "from-[#0B254E] via-[#0E3A75] to-[#125BB5]",
    },
    {
      title: "ACTIVE AGENTS",
      displayTitle: "ACTIVE AGENTS",
      value: activeAgents.toLocaleString(),
      tagText: "↑ Live",
      tagColor: "text-[#38BDF8]",
      subText: "Verified Agents",
      icon: UserCheck,
      gradient: "from-[#06293E] via-[#0B4F73] to-[#0284C7]",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ─── Page Title Header ─── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0A1629] tracking-tight">Dashboard</h1>
        <p className="text-xs sm:text-sm text-[#475569] font-medium mt-1">
          Welcome back, Admin! Here&apos;s what&apos;s happening with your real estate platform.
        </p>
      </div>

      {/* ─── 8 Vibrant Gradient Stat Cards (2 Rows of 4 with Great Spacing) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.displayTitle}
              className={`relative overflow-hidden rounded-2xl p-5 sm:p-6 bg-gradient-to-r ${card.gradient} text-white shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px] group border border-white/10`}
            >
              {/* Top Row: Title + Frosted Glass Icon Badge */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-white/85">
                  {card.displayTitle}
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {/* Big Metric Number */}
              <div className="my-3 sm:my-3.5">
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  {card.value}
                </div>
              </div>

              {/* Bottom Tag / Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`font-bold ${card.tagColor}`}>{card.tagText}</span>
                <span className="text-white/70 font-medium">{card.subText}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ─── Admin Charts (Monthly Revenue + Property Types Donut) ─── */}
      <AdminCharts
        monthlyRevenue={monthlyRevenue}
        propertyTypes={propertyTypesData}
        totalProperties={totalProperties}
      />

      {/* ─── Lower Section: Recent Activity & Top Cities + Quick Actions ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity (2 cols) */}
        <div className="lg:col-span-2 bg-gradient-to-br from-[#071D36] via-[#092546] to-[#0B2C52] rounded-2xl border border-[#133C6D] p-5 sm:p-6 shadow-xl text-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Recent Activity</h3>
              <p className="text-xs text-[#94A3B8]">Real-time operational events from your database</p>
            </div>
            <Link
              href="/admin/properties"
              className="text-xs font-bold text-[#38BDF8] hover:text-white transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-4 divide-y divide-[#133C6D]">
            {/* Event 1: New Property Added */}
            {recentAddedProps[0] ? (
              <div className="flex items-start gap-3.5 pt-3 first:pt-0">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0 text-[#38BDF8]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">New Property Added</p>
                  <p className="text-xs text-white/75 truncate mt-0.5">
                    {recentAddedProps[0].title} in {recentAddedProps[0].city} by{" "}
                    {recentAddedProps[0].manager?.name || "Agent"}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-white/50 whitespace-nowrap">
                  {formatRelativeTime(recentAddedProps[0].createdAt)}
                </span>
              </div>
            ) : null}

            {/* Event 2: Property Sold or Approved */}
            {recentSoldProps[0] ? (
              <div className="flex items-start gap-3.5 pt-3">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center flex-shrink-0 text-[#34D399]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">
                    Property {recentSoldProps[0].status === "SOLD" ? "Sold" : "Approved"}
                  </p>
                  <p className="text-xs text-white/75 truncate mt-0.5">
                    {recentSoldProps[0].title} in {recentSoldProps[0].city}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-white/50 whitespace-nowrap">
                  {formatRelativeTime(recentSoldProps[0].updatedAt)}
                </span>
              </div>
            ) : null}

            {/* Event 3: New Customer Registered */}
            {recentCustomers[0] ? (
              <div className="flex items-start gap-3.5 pt-3">
                <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 border border-[#8B5CF6]/40 flex items-center justify-center flex-shrink-0 text-[#C084FC]">
                  <Users className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">New Customer Registered</p>
                  <p className="text-xs text-white/75 truncate mt-0.5">
                    {recentCustomers[0].name} ({recentCustomers[0].email})
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-white/50 whitespace-nowrap">
                  {formatRelativeTime(recentCustomers[0].createdAt)}
                </span>
              </div>
            ) : null}

            {/* Event 4: AI Prediction Completed */}
            {recentPredictions[0] ? (
              <div className="flex items-start gap-3.5 pt-3">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40 flex items-center justify-center flex-shrink-0 text-[#34D399]">
                  <Bot className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">AI Prediction Completed</p>
                  <p className="text-xs text-white/75 truncate mt-0.5">
                    Price valuation for {recentPredictions[0].property?.title || "Property"} · Estimated{" "}
                    {formatPrice(recentPredictions[0].predictedPrice)}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-white/50 whitespace-nowrap">
                  {formatRelativeTime(recentPredictions[0].createdAt)}
                </span>
              </div>
            ) : null}

            {/* Event 5: Appointment Booked */}
            {recentBookings[0] ? (
              <div className="flex items-start gap-3.5 pt-3">
                <div className="w-10 h-10 rounded-xl bg-[#EC4899]/20 border border-[#EC4899]/40 flex items-center justify-center flex-shrink-0 text-[#F472B6]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">Appointment Booked</p>
                  <p className="text-xs text-white/75 truncate mt-0.5">
                    Viewing at {recentBookings[0].property?.title || "Property"} by{" "}
                    {recentBookings[0].customer?.name || "Customer"}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-white/50 whitespace-nowrap">
                  {formatRelativeTime(recentBookings[0].createdAt)}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Top Cities + Quick Actions (1 col) */}
        <div className="space-y-6">
          {/* Top Cities */}
          <div className="bg-gradient-to-br from-[#071D36] via-[#092546] to-[#0B2C52] rounded-2xl border border-[#133C6D] p-5 sm:p-6 shadow-xl text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Top Cities</h3>
                <p className="text-xs text-[#94A3B8]">Active market concentrations</p>
              </div>
              <Link
                href="/admin/properties"
                className="text-xs font-bold text-[#38BDF8] hover:text-white transition-colors"
              >
                View All →
              </Link>
            </div>

            <div className="space-y-3.5">
              {topCitiesGroup.map((item) => {
                const count = item._count.id;
                const percentage = Math.round((count / maxCityCount) * 100);
                return (
                  <div key={item.city} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-[#38BDF8]" />
                        <span className="font-semibold text-white">{item.city}</span>
                      </div>
                      <span className="font-black text-white">{count}</span>
                    </div>
                    {/* Progress Bar matching reference design */}
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#1677FF] to-[#38BDF8] h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-[#071D36] via-[#092546] to-[#0B2C52] rounded-2xl border border-[#133C6D] p-5 sm:p-6 shadow-xl text-white">
            <h3 className="text-base font-bold text-white mb-3 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Link
                href="/dashboard/properties/add"
                className="flex items-center justify-center gap-1.5 bg-[#1677FF] hover:bg-[#0F5ED7] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md hover:shadow-xl hover:scale-102"
              >
                <Plus className="h-4 w-4" />
                <span>Add Property</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center justify-center gap-1.5 bg-[#10B981] hover:bg-[#059669] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md hover:shadow-xl hover:scale-102"
              >
                <Plus className="h-4 w-4" />
                <span>Add Customer</span>
              </Link>
              <Link
                href="/admin/analytics"
                className="flex items-center justify-center gap-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-xs font-bold py-2.5 px-3 rounded-xl transition-all shadow-md hover:shadow-xl hover:scale-102"
              >
                <BarChart3 className="h-4 w-4" />
                <span>View Reports</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
