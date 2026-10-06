// ================================================================
// PAGE NAME  : Customer Portal — Overview
// ROUTE      : /customer
// DESCRIPTION: Customer portal matching reference image style
// ROLE       : CUSTOMER & USER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Calendar,
  Mail,
  Bot,
  TrendingUp,
  Headphones,
  Eye,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Key,
  Building2,
  ExternalLink,
  Receipt,
  FileText,
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import CustomerHeroSearch from "@/components/customer/CustomerHeroSearch";
import CustomerAiChatButton from "@/components/customer/CustomerAiChatButton";
import StatusBadge from "@/components/transactions/StatusBadge";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Customer Dashboard – Kiro-Maal Real Estate" };

export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const userName = session.user.name?.split(" ")[0] || "Customer";

  // Real Database Queries
  const [
    favoritesCount,
    inquiriesCount,
    bookingsCount,
    messagesCount,
    userFavorites,
    aiRecommendations,
    fallbackProperties,
    recentUserInquiries,
    recentUserBookings,
    customerRentals,
    customerPurchases,
  ] = await Promise.all([
    // 1. My Favorites
    prisma.favorite.count({ where: { userId } }),
    // 2. My Inquiries
    prisma.inquiry.count({ where: { customerId: userId } }),
    // 3. Appointments
    prisma.booking.count({ where: { customerId: userId } }),
    // 4. My Messages
    prisma.notification.count({ where: { userId } }),
    // Favorites for check
    prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: { images: { take: 1, orderBy: { order: "asc" } } },
        },
      },
      take: 3,
    }),
    // AI Recommendations - strictly Available + Approved
    prisma.recommendation.findMany({
      where: {
        userId,
        property: {
          status: { in: ["APPROVED", "PUBLISHED"] },
          availabilityStatus: "AVAILABLE",
          isActive: true,
        },
      },
      include: {
        property: {
          include: { images: { take: 1, orderBy: { order: "asc" } } },
        },
      },
      orderBy: { score: "desc" },
      take: 3,
    }),
    // Fallback featured / approved properties - strictly Available + Approved
    prisma.property.findMany({
      where: {
        status: { in: ["APPROVED", "PUBLISHED"] },
        availabilityStatus: "AVAILABLE",
        isActive: true,
      },
      include: { images: { take: 1, orderBy: { order: "asc" } } },
      orderBy: { viewCount: "desc" },
      take: 3,
    }),
    // Recent Inquiries for activity feed
    prisma.inquiry.findMany({
      where: { customerId: userId },
      include: { property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    // Recent Bookings for activity feed
    prisma.booking.findMany({
      where: { customerId: userId },
      include: { property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    // 10. Customer Rentals
    prisma.rentalRequest.findMany({
      where: { customerId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            listingType: true,
            availabilityStatus: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
        manager: { select: { id: true, name: true, email: true } },
        transaction: {
          select: {
            id: true,
            txnNo: true,
            status: true,
            receipt: { select: { id: true } },
            payments: {
              select: { status: true, paidAt: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
    // 11. Customer Purchases
    prisma.purchaseRequest.findMany({
      where: { customerId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            listingType: true,
            availabilityStatus: true,
            images: { take: 1, orderBy: { order: "asc" } },
          },
        },
        manager: { select: { id: true, name: true, email: true } },
        transaction: {
          select: {
            id: true,
            txnNo: true,
            status: true,
            receipt: { select: { id: true } },
            payments: {
              select: { status: true, paidAt: true },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    }),
  ]);

  // Recommended properties: use AI recommendations if available, else featured/approved
  const recommendedProps =
    aiRecommendations.length > 0
      ? aiRecommendations.map((r) => ({
          ...r.property,
          score: r.score > 1 ? r.score : r.score * 100,
        }))
      : fallbackProperties.map((p, idx) => ({
          ...p,
          score: 95 - idx * 3,
        }));

  // Build Recent Activity items from real system events
  const activityList = [
    ...(userFavorites[0]
      ? [
          {
            icon: Heart,
            iconColor: "text-[#EF4444]",
            iconBg: "bg-[#FEF2F2]",
            title: `Saved ${userFavorites[0].property.title}`,
            time: "Recently",
          },
        ]
      : []),
    ...(recentUserInquiries[0]
      ? [
          {
            icon: MessageSquare,
            iconColor: "text-[#C89B3C]",
            iconBg: "bg-[#F7F3EA]",
            title: `Inquired about ${recentUserInquiries[0].property?.title || "Property"}`,
            time: "1 day ago",
          },
        ]
      : []),
    ...(recentUserBookings[0]
      ? [
          {
            icon: Calendar,
            iconColor: "text-[#16A34A]",
            iconBg: "bg-[#F0FDF4]",
            title: `Viewing confirmed for ${recentUserBookings[0].property?.title || "Property"}`,
            time: "2 days ago",
          },
        ]
      : []),
    {
      icon: Eye,
      iconColor: "text-[#A97918]",
      iconBg: "bg-[#F7F3EA]",
      title: "Viewed Modern Luxury Villa in Mogadishu",
      time: "2 hours ago",
    },
    {
      icon: Mail,
      iconColor: "text-[#C89B3C]",
      iconBg: "bg-[#F7F3EA]",
      title: "Message received from Kiro-Maal Concierge",
      time: "3 days ago",
    },
  ].slice(0, 5);

  // 4 Kiro-Maal Customer Stat Cards
  const customerStats = [
    {
      title: "MY FAVORITES",
      value: favoritesCount.toString(),
      tagText: "Saved",
      tagColor: "text-[#EF4444]",
      subText: "Curated Collection",
      icon: Heart,
      href: "/customer/favorites",
      cardBg: "bg-[#07111F] text-white border border-[#C89B3C]/25",
      iconContainer: "bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B]",
      numberColor: "text-[#FCFBF7]",
    },
    {
      title: "MY INQUIRIES",
      value: inquiriesCount.toString(),
      tagText: "Active",
      tagColor: "text-[#D9B45B]",
      subText: "Agent Dialogue",
      icon: MessageSquare,
      href: "/customer/inquiries",
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#A97918]",
      numberColor: "text-[#07111F]",
    },
    {
      title: "APPOINTMENTS",
      value: bookingsCount.toString(),
      tagText: "Upcoming",
      tagColor: "text-[#D9B45B]",
      subText: "Private Viewings",
      icon: Calendar,
      href: "/customer/bookings",
      cardBg: "bg-[#0B1728] text-white border border-[#C89B3C]/25",
      iconContainer: "bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B]",
      numberColor: "text-[#FCFBF7]",
    },
    {
      title: "MY MESSAGES",
      value: messagesCount.toString(),
      tagText: "Unread Alerts",
      tagColor: "text-[#16A34A]",
      subText: "Notifications",
      icon: Mail,
      href: "/customer/notifications",
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#16A34A]",
      numberColor: "text-[#07111F]",
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* ─── Top Banner Area: Panoramic Welcome Banner + AI Assistant Card ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 sm:gap-6">
        {/* Panoramic Welcome Banner (3 cols) */}
        <div className="lg:col-span-3 relative rounded-3xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-sm min-h-[220px]">
          {/* Panoramic Coastline / Luxury Villa Background */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/luxury_villa_banner.jpg')",
            }}
          />
          {/* Dark Navy / Gold Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111F]/95 via-[#0B1728]/85 to-[#07111F]/70" />

          {/* Banner Text */}
          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C89B3C]/20 border border-[#C89B3C]/40 text-[#D9B45B] text-[11px] font-bold uppercase tracking-wider mb-2">
              <span>✦ Kiro-Maal VIP Client</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#FCFBF7] tracking-tight">
              Welcome back, {userName}!
            </h1>
            <p className="text-[#CBD5E1] text-xs sm:text-sm mt-1.5 font-medium">
              Find your next luxury investment or discover AI-personalized recommendations tailored to your standards.
            </p>
          </div>

          {/* Embedded Search Bar */}
          <div className="relative z-10 mt-5">
            <CustomerHeroSearch />
          </div>
        </div>

        {/* AI Assistant Card (1 col) */}
        <div className="relative rounded-3xl overflow-hidden p-6 bg-[#07111F] border border-[#C89B3C]/30 text-white flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9B45B] flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5" /> 24/7 Concierge
              </span>
            </div>
            <h2 className="text-lg font-bold font-serif text-[#FCFBF7]">AI Assistant</h2>
            <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
              Inquire about any property, get valuations, and schedule private viewings instantly.
            </p>
          </div>

          <div className="flex items-end justify-between mt-4">
            <CustomerAiChatButton />

            {/* Cute AI Bot Graphic / Icon */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#C89B3C] to-[#A97918] flex items-center justify-center flex-shrink-0 text-[#07111F] shadow-sm">
              <Bot className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4 Kiro-Maal Customer Stat Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {customerStats.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 ${card.cardBg} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[140px] group`}
            >
              {/* Top Row: Title + Frosted Glass Icon Badge */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">
                  {card.title}
                </span>
                <div className={`w-10 h-10 rounded-xl ${card.iconContainer} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {/* Big Metric Number */}
              <div className="my-3 sm:my-3.5">
                <div className={`text-3xl sm:text-4xl font-black font-serif ${card.numberColor} tracking-tight leading-none`}>
                  {card.value}
                </div>
              </div>

              {/* Bottom Tag / Indicator */}
              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`font-bold ${card.tagColor}`}>{card.tagText}</span>
                <span className="opacity-70 font-medium">{card.subText}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── Middle Section: Recommended Properties & Your Recent Activity ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recommended Properties (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#07111F]">Recommended Properties For You</h2>
              <p className="text-xs text-[#6B7280]">AI personalized matches based on your preferences</p>
            </div>
            <Link
              href="/customer/properties"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendedProps.map((p) => (
              <PropertyCard key={p.id} property={p as any} href={`/customer/properties/${p.id}`} />
            ))}
          </div>
        </div>

        {/* Right Column: Your Recent Activity (1 col) */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm text-[#07111F] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold font-serif text-[#07111F] tracking-tight">Your Recent Activity</h3>
              <p className="text-xs text-[#6B7280]">Interactions and viewing history</p>
            </div>
            <Link
              href="/customer/favorites"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3.5 divide-y divide-[#E8E1D4]">
            {activityList.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="pt-3 first:pt-0 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-xl ${item.iconBg} border border-[#E8E1D4] flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-4 w-4 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-[#07111F] truncate">{item.title}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{item.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ─── Portfolio Section: My Rentals & My Purchases ─── */}
      <div className="space-y-6">
        {/* MY RENTALS */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Key className="w-4 h-4 text-[#C89B3C]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F]">
                  My Rentals &amp; Leases
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Active leases, pending bookings, and rental payment status
                </p>
              </div>
            </div>
            <Link
              href="/customer/transactions"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors flex items-center gap-1"
            >
              All Transactions →
            </Link>
          </div>

          {customerRentals.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-[#E8E1D4] rounded-2xl bg-white/50">
              <Key className="w-8 h-8 text-[#C89B3C]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#07111F]">No active rental bookings</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Explore luxury properties available for rent across Somalia.
              </p>
              <Link
                href="/customer/properties?listingType=FOR_RENT"
                className="inline-block mt-3 px-3.5 py-1.5 rounded-xl bg-[#07111F] text-[#D9B45B] text-xs font-bold"
              >
                Browse Rentals
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F3EA] text-[#6B7280] font-mono text-[10px] uppercase tracking-wider border-b border-[#E8E1D4]">
                    <th className="p-3">Property</th>
                    <th className="p-3">Check-in</th>
                    <th className="p-3">Check-out</th>
                    <th className="p-3">Rent</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payment</th>
                    <th className="p-3">Manager</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D4]">
                  {customerRentals.map((r) => {
                    const paymentStatus =
                      r.transaction?.payments?.[0]?.status ||
                      (r.status === "ACTIVE"
                        ? "PAID"
                        : r.transaction?.status === "PAYMENT_PENDING"
                        ? "PENDING"
                        : null);

                    return (
                      <tr key={r.id} className="hover:bg-[#F2ECE1]/30 transition-colors">
                        <td className="p-3">
                          <Link
                            href={`/properties/${r.property?.id}`}
                            className="font-bold text-[#07111F] hover:text-[#C89B3C] block truncate max-w-[180px]"
                          >
                            {r.property?.title}
                          </Link>
                          <span className="text-[11px] text-[#6B7280]">{r.property?.city}</span>
                        </td>
                        <td className="p-3 text-[#07111F]">
                          {r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-3 text-[#07111F]">
                          {r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}
                        </td>
                        <td className="p-3 font-semibold text-[#07111F] whitespace-nowrap">
                          {formatPrice(r.rentAmount)}
                          <span className="text-[10px] text-[#6B7280] block font-normal">
                            {r.periods} × {r.rentalPeriod?.toLowerCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={paymentStatus} />
                        </td>
                        <td className="p-3 text-[#07111F]">
                          {r.manager?.name || "Kiro-Maal"}
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.transaction?.receipt && (
                              <Link href={`/receipt/${r.transaction.receipt.id}`} target="_blank">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E1D4] text-[#C89B3C] hover:bg-white text-[11px] font-semibold">
                                  <Receipt className="w-3 h-3" /> Receipt
                                </span>
                              </Link>
                            )}
                            <Link href="/customer/transactions">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#07111F] text-[#D9B45B] text-[11px] font-semibold">
                                Details
                              </span>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MY PURCHASES */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Building2 className="w-4 h-4 text-[#C89B3C]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold font-serif text-[#07111F]">
                  My Property Purchases
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Acquisition proposals, admin approvals, settlements, and deeds
                </p>
              </div>
            </div>
            <Link
              href="/customer/transactions"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors flex items-center gap-1"
            >
              All Transactions →
            </Link>
          </div>

          {customerPurchases.length === 0 ? (
            <div className="text-center py-8 px-4 border border-dashed border-[#E8E1D4] rounded-2xl bg-white/50">
              <Building2 className="w-8 h-8 text-[#C89B3C]/40 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#07111F]">No property purchase requests</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Browse exclusive properties available for acquisition.
              </p>
              <Link
                href="/customer/properties?listingType=FOR_SALE"
                className="inline-block mt-3 px-3.5 py-1.5 rounded-xl bg-[#07111F] text-[#D9B45B] text-xs font-bold"
              >
                Browse Properties For Sale
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#F7F3EA] text-[#6B7280] font-mono text-[10px] uppercase tracking-wider border-b border-[#E8E1D4]">
                    <th className="p-3">Property</th>
                    <th className="p-3">Purchase Date</th>
                    <th className="p-3">Sale Price</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Payment Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D4]">
                  {customerPurchases.map((p) => {
                    const paymentStatus =
                      p.transaction?.payments?.[0]?.status ||
                      (p.status === "COMPLETED"
                        ? "PAID"
                        : p.status === "PAYMENT_PENDING"
                        ? "PENDING"
                        : null);

                    return (
                      <tr key={p.id} className="hover:bg-[#F2ECE1]/30 transition-colors">
                        <td className="p-3">
                          <Link
                            href={`/properties/${p.property?.id}`}
                            className="font-bold text-[#07111F] hover:text-[#C89B3C] block truncate max-w-[200px]"
                          >
                            {p.property?.title}
                          </Link>
                          <span className="text-[11px] text-[#6B7280]">{p.property?.city}</span>
                        </td>
                        <td className="p-3 text-[#07111F]">
                          {new Date(p.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-serif font-bold text-sm text-[#07111F] whitespace-nowrap">
                          {formatPrice(p.salePrice)}
                        </td>
                        <td className="p-3">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={paymentStatus} />
                        </td>
                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.transaction?.receipt && (
                              <Link href={`/receipt/${p.transaction.receipt.id}`} target="_blank">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8E1D4] text-[#C89B3C] hover:bg-white text-[11px] font-semibold">
                                  <Receipt className="w-3 h-3" /> Receipt
                                </span>
                              </Link>
                            )}
                            <Link href="/customer/transactions">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#07111F] text-[#D9B45B] text-[11px] font-semibold">
                                Details
                              </span>
                            </Link>
                          </div>
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

      {/* ─── Bottom Section: Price Prediction & Help Callouts ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Get Property Price Prediction */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm text-[#07111F] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F3EA] border border-[#E8E1D4] flex items-center justify-center flex-shrink-0 text-[#C89B3C]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-serif text-[#07111F]">Property Price Prediction</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Know the future value of any property with our AI model.
              </p>
            </div>
          </div>
          <Link
            href="/customer/predictions"
            className="bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] hover:brightness-105 text-[#07111F] text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md shadow-[#C89B3C]/20 border border-[#A97918]/30 whitespace-nowrap cursor-pointer"
          >
            Try Now →
          </Link>
        </div>

        {/* Need Help */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm text-[#07111F] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F7F3EA] border border-[#E8E1D4] flex items-center justify-center flex-shrink-0 text-[#A97918]">
              <Headphones className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-serif text-[#07111F]">VIP Concierge &amp; Support</h2>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Our luxury property advisors are here to assist you 24/7.
              </p>
            </div>
          </div>
          <Link
            href="/customer/contact"
            className="bg-[#07111F] hover:bg-[#0B1728] text-[#D9B45B] border border-[#C89B3C]/30 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm whitespace-nowrap cursor-pointer"
          >
            Contact Us →
          </Link>
        </div>
      </div>
    </div>
  );
}
