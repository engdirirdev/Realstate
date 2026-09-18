// ================================================================
// PAGE NAME  : User Dashboard — Overview
// ROUTE      : /dashboard
// DESCRIPTION: Logged-in user's main dashboard — stats, recent
//              AI recommendations, saved properties, quick actions
// ROLE       : USER only (redirects to /login if not authenticated)
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Heart, Bot, BarChart3, Building2, ArrowRight,
  TrendingUp, Star, Clock, Sparkles, MapPin, BedDouble,
} from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard – AI Real Estate" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const [
    myPropertiesCount,
    monthlyEarningsAgg,
    yearlyEarningsAgg,
    inquiriesCount,
    bookingsCount,
    topListings,
    recentInquiries,
  ] = await Promise.all([
    prisma.property.count({ where: { managerId: userId } }),
    prisma.payment.aggregate({
      where: { managerId: userId, status: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { managerId: userId, status: "PAID", createdAt: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.inquiry.count({ where: { managerId: userId } }),
    prisma.booking.count({ where: { managerId: userId } }),
    prisma.property.findMany({
      where: { managerId: userId },
      include: { images: { take: 1, orderBy: { order: "asc" } } },
      orderBy: { viewCount: "desc" },
      take: 4,
    }),
    prisma.inquiry.findMany({
      where: { managerId: userId },
      include: {
        property: { select: { title: true } },
        customer: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  const monthlyRev = monthlyEarningsAgg._sum.amount || 0;
  const yearlyRev = yearlyEarningsAgg._sum.amount || 0;

  const stats = [
    { label: "My Listings", value: myPropertiesCount, icon: Building2, href: "/dashboard/properties", color: "bg-[#10B981]/15 text-[#10B981]" },
    { label: "Monthly Earnings", value: formatPrice(monthlyRev), icon: TrendingUp, href: "/dashboard/payments", color: "bg-[#8B5CF6]/15 text-[#8B5CF6]" },
    { label: "Yearly Revenue", value: formatPrice(yearlyRev), icon: BarChart3, href: "/dashboard/payments", color: "bg-[#3B82F6]/15 text-[#3B82F6]" },
    { label: "Inquiries & Bookings", value: inquiriesCount + bookingsCount, icon: Bot, href: "/dashboard/inquiries", color: "bg-[#06B6D4]/15 text-[#0891B2]" },
  ];

  return (
    <div className="space-y-8 bg-[#F8FAFC]">
      {/* ─── Welcome Banner ─── */}
      <div className="bg-[#0F172A] rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-card border border-[#1E293B]">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-[#10B981]/15 blur-3xl" />
          <div className="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-[#06B6D4]/15 blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1E293B] border border-[#334155] text-[#34D399] text-xs font-medium mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            Manager Portfolio &amp; Earnings Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
            Welcome back, {session.user?.name?.split(" ")[0]}! 👋
          </h1>
          <p className="text-[#CBD5E1] text-sm sm:text-base max-w-xl mb-6 leading-relaxed">
            Monitor property views, manage customer booking requests, track monthly earnings, and publish verified real estate listings.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/properties/add"
              className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            >
              <Building2 className="h-4 w-4" /> Add New Listing
            </Link>
            <Link
              href="/dashboard/properties"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              View My Properties ({myPropertiesCount})
            </Link>
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white hover:bg-white/20 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              <BarChart3 className="h-4 w-4 text-[#34D399]" /> Analytics &amp; Trends
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Stats Row ─── */}
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

      {/* ─── Two-Column Manager Grid: Top Performing Listings & Recent Inquiries ─── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top Performing Listings */}
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#10B981]" /> Top Performing Listings
            </h2>
            <Link
              href="/dashboard/properties"
              className="text-xs text-[#10B981] hover:text-[#059669] font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {topListings.length === 0 ? (
            <div className="text-center py-8 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <Building2 className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No properties listed yet</p>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-xs mx-auto mb-4">
                Add properties to track views, customer leads, and inquiry conversions.
              </p>
              <Link href="/dashboard/properties/add">
                <span className="inline-flex items-center text-xs font-semibold text-[#10B981] hover:underline">
                  Add Property Now →
                </span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {topListings.map((property) => (
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
                      <MapPin className="h-3 w-3 text-[#94A3B8]" /> {property.city} • <span className="font-semibold">{getPropertyTypeLabel(property.type)}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-[#059669]">{formatPrice(property.price)}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full border border-[#3B82F6]/20 mt-0.5">
                      {property.viewCount || 0} Views
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Inquiries */}
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-[#0F172A] text-base flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#06B6D4]" /> Recent Customer Inquiries
            </h2>
            <Link
              href="/dashboard/inquiries"
              className="text-xs text-[#10B981] hover:text-[#059669] font-semibold flex items-center gap-1"
            >
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentInquiries.length === 0 ? (
            <div className="text-center py-8 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <Bot className="h-8 w-8 text-[#94A3B8] mx-auto mb-2" />
              <p className="text-sm font-semibold text-[#0F172A]">No inquiries received yet</p>
              <p className="text-xs text-[#64748B] mt-0.5 max-w-xs mx-auto mb-4">
                Customer questions regarding price, water supply, and viewing sessions will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {recentInquiries.map((inq) => (
                <Link
                  key={inq.id}
                  href="/dashboard/inquiries"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-all group"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm font-semibold text-[#0F172A] truncate group-hover:text-[#10B981] transition-colors">
                      {inq.subject || inq.property?.title || "Property Inquiry"}
                    </p>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      From <span className="font-semibold text-[#0F172A]">{inq.customer?.name}</span> ({inq.customer?.email})
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    inq.status === "NEW"
                      ? "bg-[#FEF9C3] text-[#92400E] border-[#FDE68A]"
                      : inq.status === "RESPONDED"
                      ? "bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]"
                      : "bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]"
                  }`}>
                    {inq.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
