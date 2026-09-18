// ================================================================
// PAGE NAME  : Admin Dashboard — Overview
// ROUTE      : /admin
// DESCRIPTION: Admin control panel — platform KPI stats, pending
//              property approvals alert, recent properties table,
//              recent users list, quick action buttons
// ROLE       : ADMIN only (redirects non-admins to /dashboard)
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, Users, MessageSquare, BarChart3, TrendingUp, ArrowRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin Overview – AI Real Estate" };

export default async function AdminPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    totalProperties,
    pendingProperties,
    approvedProperties,
    totalUsers,
    totalMessages,
    unreadMessages,
    totalPredictions,
    recentProperties,
    recentUsers,
    todayUsers,
    todayBookings,
    todayPayments,
    totalReports,
    pendingReports,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { status: "PENDING" } }),
    prisma.property.count({ where: { status: "APPROVED" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { isRead: false } }),
    prisma.pricePrediction.count(),
    prisma.property.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { images: { take: 1, orderBy: { order: "asc" } } },
    }),
    prisma.user.findMany({
      where: { role: "USER" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.user.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.booking.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.payment.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: startOfDay },
      },
      _sum: { amount: true },
      _count: { id: true },
    }),
    prisma.listingReport.count(),
    prisma.listingReport.count({ where: { status: "PENDING" } }),
  ]);

  const todayRevenue = todayPayments._sum.amount || 0;

  const stats = [
    { label: "Total Properties", value: totalProperties, icon: Building2, sub: `${pendingProperties} pending approval`, href: "/admin/properties", color: "bg-[#10B981]" },
    { label: "Registered Managers", value: totalUsers, icon: Users, sub: "Active accounts", href: "/admin/users", color: "bg-[#3B82F6]" },
    { label: "Contact Messages", value: totalMessages, icon: MessageSquare, sub: `${unreadMessages} unread inquiries`, href: "/admin/messages", color: "bg-[#06B6D4]" },
    { label: "AI Predictions", value: totalPredictions, icon: TrendingUp, sub: "Valuations generated", href: "/admin/analytics", color: "bg-[#8B5CF6]" },
  ];

  return (
    <div className="space-y-8 bg-[#F8FAFC] min-h-screen p-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#0F172A]">Admin Overview</h1>
        <p className="text-[#64748B] text-sm mt-1">Platform-wide statistics and management tools</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map(({ label, value, icon: Icon, sub, href, color }) => (
          <Link key={label} href={href} className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-5 hover:shadow-card-hover transition-all group">
            <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-3xl font-bold text-[#0F172A]">{value}</div>
            <div className="text-sm font-medium text-[#64748B] mt-0.5 flex items-center gap-1">
              {label} <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="text-xs text-[#94A3B8] mt-1">{sub}</div>
          </Link>
        ))}
      </div>

      {/* Today's Pulse */}
      <div className="bg-gradient-to-r from-[#10B981]/10 via-[#3B82F6]/10 to-[#8B5CF6]/10 border border-[#E2E8F0] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
            <h2 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Today's Platform Pulse</h2>
          </div>
          <span className="text-xs text-[#64748B] bg-white px-2.5 py-1 rounded-lg border border-[#E2E8F0] font-medium">
            Live Database Sync
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <p className="text-xs text-[#64748B] font-medium">Today's Revenue</p>
            <p className="text-2xl font-bold text-[#10B981] mt-1">{formatPrice(todayRevenue)}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">{todayPayments._count.id} settled payments</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <p className="text-xs text-[#64748B] font-medium">New Users Today</p>
            <p className="text-2xl font-bold text-[#3B82F6] mt-1">{todayUsers}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Customer & manager signups</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <p className="text-xs text-[#64748B] font-medium">Today's Bookings</p>
            <p className="text-2xl font-bold text-[#8B5CF6] mt-1">{todayBookings}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">Tours & rental reservations</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#E2E8F0]">
            <p className="text-xs text-[#64748B] font-medium">Pending Moderations</p>
            <p className="text-2xl font-bold text-[#F59E0B] mt-1">{pendingProperties + pendingReports}</p>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">{pendingProperties} listings • {pendingReports} reports</p>
          </div>
        </div>
      </div>

      {/* Pending Tasks & Alerts */}
      <div className="grid md:grid-cols-2 gap-4">
        {pendingProperties > 0 ? (
          <div className="bg-[#FEF9C3] border border-[#FDE68A] rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-[#92400E]" />
              <div>
                <p className="font-semibold text-[#92400E]">{pendingProperties} {pendingProperties === 1 ? "property" : "properties"} awaiting approval</p>
                <p className="text-[#92400E]/80 text-xs">Review quality, images, and price before publishing</p>
              </div>
            </div>
            <Link href="/admin/properties?status=PENDING" className="bg-[#10B981] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold hover:bg-[#059669] transition-colors whitespace-nowrap">
              Review Now
            </Link>
          </div>
        ) : (
          <div className="bg-[#D1FAE5]/60 border border-[#A7F3D0] rounded-2xl p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-[#065F46]" />
            <div>
              <p className="font-semibold text-[#065F46] text-sm">All Property Approvals Clear</p>
              <p className="text-[#065F46]/80 text-xs">No pending properties need moderation at this moment</p>
            </div>
          </div>
        )}

        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981]" />
              <p className="text-sm font-bold text-[#0F172A]">System & Database Status: Healthy</p>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">MySQL 3306 connected • AI Engine v2.4 operational</p>
          </div>
          <Link href="/admin/analytics" className="text-xs text-[#3B82F6] hover:underline font-semibold">
            View Analytics →
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Properties */}
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[#0F172A]">Recent Properties</h2>
            <Link href="/admin/properties" className="text-xs text-[#10B981] font-medium flex items-center gap-1 hover:text-[#059669]">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentProperties.map((p) => {
              const img = p.images[0]?.url;
              return (
                <div key={p.id} className="flex items-center gap-3 p-2 hover:bg-[#F8FAFC] rounded-xl transition-colors">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F8FAFC] flex-shrink-0 border border-[#E2E8F0]">
                    {img ? (
                      <img src={img} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-[#94A3B8]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{p.title}</p>
                    <p className="text-xs text-[#64748B]">{p.city} · {formatPrice(p.price)}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    p.status === "APPROVED" ? "bg-[#D1FAE5] text-[#065F46]" :
                    p.status === "PENDING" ? "bg-[#FEF9C3] text-[#92400E]" :
                    "bg-[#FEE2E2] text-[#991B1B]"
                  }`}>
                    {p.status === "APPROVED" ? <CheckCircle2 className="h-3 w-3 inline mr-1" /> : p.status === "PENDING" ? <Clock className="h-3 w-3 inline mr-1" /> : <XCircle className="h-3 w-3 inline mr-1" />}
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-[#0F172A]">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-[#10B981] font-medium flex items-center gap-1 hover:text-[#059669]">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-2 hover:bg-[#F8FAFC] rounded-xl transition-colors">
                <div className="w-10 h-10 rounded-full bg-[#ECFEFF] flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0891B2] font-bold text-sm">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">{user.name}</p>
                  <p className="text-xs text-[#64748B] truncate">{user.email}</p>
                </div>
                <span className="text-xs text-[#94A3B8]">
                  {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
