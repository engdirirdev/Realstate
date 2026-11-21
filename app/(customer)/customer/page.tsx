// ================================================================
// PAGE NAME  : Customer Portal — Overview & Dashboard
// ROUTE      : /customer
// DESCRIPTION: Customer Dashboard matching Manager Dashboard luxury design
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER & USER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
  Heart,
  FileText,
  Key,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  TrendingUp,
  Receipt,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Inbox,
  MessageSquare,
  Calendar,
  Search,
  Eye,
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import StatusBadge from "@/components/transactions/StatusBadge";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const revalidate = 30;

export const metadata: Metadata = {
  title: "Customer Dashboard – Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const userName = session.user.name?.split(" ")[0] || "Customer";

  // ─── Real Database Queries for Metrics & Feeds (Consolidated) ───
  const [
    rentalsByStatus,
    purchasesByStatus,
    pendingTransactions,
    paidPaymentsCount,
    userFavorites,
    aiRecommendations,
    fallbackProperties,
    customerRentals,
    customerPurchases,
    recentPayments,
  ] = await Promise.all([
    // 1. Consolidated Rental Requests by Status
    prisma.rentalRequest.groupBy({
      by: ["status"],
      where: { customerId: userId },
      _count: { id: true },
    }),
    // 2. Consolidated Purchase Requests by Status
    prisma.purchaseRequest.groupBy({
      by: ["status"],
      where: { customerId: userId },
      _count: { id: true },
    }),

    // 3. Payments Pending (Sum and records of outstanding pending transactions)
    prisma.transaction.findMany({
      where: {
        customerId: userId,
        status: { in: ["PENDING", "PAYMENT_PENDING"] },
      },
      select: { amount: true },
    }),

    // 4. Total Paid Payments Count (Payment History)
    prisma.payment.count({
      where: { customerId: userId, status: "PAID" },
    }),

    // Favorites for check
    prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),

    // AI Recommendations - strictly Available + Approved + Active (Selective projection)
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
          select: {
            id: true,
            title: true,
            price: true,
            basePrice: true,
            companyServiceFee: true,
            legalTransferFee: true,
            brokerCommission: true,
            currency: true,
            city: true,
            location: true,
            type: true,
            listingType: true,
            bedrooms: true,
            bathrooms: true,
            area: true,
            isFurnished: true,
            parking: true,
            status: true,
            availabilityStatus: true,
            isFeatured: true,
            viewCount: true,
            createdAt: true,
            images: {
              take: 1,
              orderBy: { order: "asc" },
              select: { id: true, url: true, isPrimary: true },
            },
          },
        },
      },
      orderBy: { score: "desc" },
      take: 3,
    }),

    // Fallback verified properties - strictly Available + Approved + Active (Selective projection)
    prisma.property.findMany({
      where: {
        status: { in: ["APPROVED", "PUBLISHED"] },
        availabilityStatus: "AVAILABLE",
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        price: true,
        basePrice: true,
        companyServiceFee: true,
        legalTransferFee: true,
        brokerCommission: true,
        currency: true,
        city: true,
        location: true,
        type: true,
        listingType: true,
        bedrooms: true,
        bathrooms: true,
        area: true,
        isFurnished: true,
        parking: true,
        status: true,
        availabilityStatus: true,
        isFeatured: true,
        viewCount: true,
        createdAt: true,
        images: {
          take: 1,
          orderBy: { order: "asc" },
          select: { id: true, url: true, isPrimary: true },
        },
      },
      orderBy: { viewCount: "desc" },
      take: 3,
    }),

    // Active & recent rentals
    prisma.rentalRequest.findMany({
      where: { customerId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            location: true,
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
      take: 3,
    }),

    // Active & recent purchases
    prisma.purchaseRequest.findMany({
      where: { customerId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            location: true,
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
      take: 3,
    }),

    // Recent paid payments for activity feed
    prisma.payment.findMany({
      where: { customerId: userId, status: "PAID" },
      select: { id: true, amount: true, createdAt: true, transactionRef: true },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  // Derived metrics from consolidated groupBy queries
  const pendingRentalsCount = rentalsByStatus
    .filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW")
    .reduce((acc, curr) => acc + curr._count.id, 0);
  const approvedRentalsCount =
    rentalsByStatus.find((r) => r.status === "APPROVED")?._count.id || 0;
  const activeRentalsCount =
    rentalsByStatus.find((r) => r.status === "ACTIVE")?._count.id || 0;

  const pendingPurchasesCount = purchasesByStatus
    .filter((p) => p.status === "PENDING" || p.status === "UNDER_REVIEW")
    .reduce((acc, curr) => acc + curr._count.id, 0);
  const completedPurchasesCount = purchasesByStatus
    .filter((p) => p.status === "COMPLETED" || p.status === "APPROVED")
    .reduce((acc, curr) => acc + curr._count.id, 0);

  const pendingRequestsCount = pendingRentalsCount + pendingPurchasesCount;
  const paymentsDueAmount = pendingTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);

  // Recommended properties
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

  // Build Real Recent Activity from database actions
  const realActivities: {
    id: string;
    icon: any;
    iconColor: string;
    iconBg: string;
    title: string;
    time: string;
    date: Date;
  }[] = [];

  for (const fav of userFavorites) {
    realActivities.push({
      id: `fav-${fav.id}`,
      icon: Heart,
      iconColor: "text-red-500",
      iconBg: "bg-red-50",
      title: `Saved "${fav.property.title}" to favorites`,
      time: "Recently",
      date: fav.createdAt,
    });
  }

  for (const rent of customerRentals.slice(0, 2)) {
    realActivities.push({
      id: `rent-${rent.id}`,
      icon: Key,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      title: `Submitted rental request for "${rent.property.title}" (#${rent.requestNo})`,
      time: new Date(rent.createdAt).toLocaleDateString("en-US"),
      date: rent.createdAt,
    });
  }

  for (const pur of customerPurchases.slice(0, 2)) {
    realActivities.push({
      id: `pur-${pur.id}`,
      icon: ShoppingBag,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      title: `Submitted purchase request for "${pur.property.title}" (#${pur.requestNo})`,
      time: new Date(pur.createdAt).toLocaleDateString("en-US"),
      date: pur.createdAt,
    });
  }

  for (const pay of recentPayments) {
    realActivities.push({
      id: `pay-${pay.id}`,
      icon: CheckCircle2,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      title: `Completed payment of ${formatPrice(pay.amount)}`,
      time: new Date(pay.createdAt).toLocaleDateString("en-US"),
      date: pay.createdAt,
    });
  }

  const activityList = realActivities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  // 4 Kiro-Maal Stat Cards (matching Manager Dashboard design)
  const customerStats = [
    {
      title: "PENDING REQUESTS",
      value: pendingRequestsCount.toString(),
      tagText: "↑ Under Review",
      tagColor: "text-[#D9B45B]",
      subText: "Awaiting Action",
      icon: FileText,
      href: "/customer/requests",
      cardBg: "bg-[#07111F] text-white border border-[#C89B3C]/25",
      iconContainer: "bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B]",
      numberColor: "text-[#FCFBF7]",
    },
    {
      title: "ACTIVE RENTALS",
      value: activeRentalsCount.toString(),
      tagText: "Current",
      tagColor: "text-[#A97918]",
      subText: "Active Leases",
      icon: Key,
      href: "/customer/rentals",
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#A97918]",
      numberColor: "text-[#07111F]",
    },
    {
      title: "PAYMENT PENDING",
      value: formatPrice(paymentsDueAmount),
      tagText: paymentsDueAmount > 0 ? "Action Needed" : "All Clear",
      tagColor: paymentsDueAmount > 0 ? "text-[#D9B45B]" : "text-emerald-400",
      subText: "Pending Verification / Due",
      icon: Clock,
      href: "/customer/requests",
      cardBg: "bg-[#0B1728] text-white border border-[#C89B3C]/25",
      iconContainer: "bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#D9B45B]",
      numberColor: "text-[#FCFBF7]",
    },
    {
      title: "PAYMENT HISTORY",
      value: `${paidPaymentsCount} Paid`,
      tagText: "Settled",
      tagColor: "text-[#16A34A]",
      subText: "Completed Receipts",
      icon: Receipt,
      href: "/customer/payments",
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#16A34A]",
      numberColor: "text-[#07111F]",
    },
  ];

  // Current Date String matching Manager Dashboard format
  const dateFormatted = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const weekdayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
  });

  return (
    <div suppressHydrationWarning className="space-y-6 pb-10 font-sans">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO / WELCOME BANNER (Matching Manager Dashboard Style)
          ───────────────────────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#F5EFEB] via-[#F4EDE6] to-transparent border border-[#E6DED4] min-h-[145px] flex items-center p-6 sm:p-8">
        {/* Right Half: Twilight Luxury Villa Panoramic Image */}
        <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[65%] md:w-[58%] overflow-hidden z-0 pointer-events-none">
          <Image
            src="/images/luxury_villa_twilight.jpg"
            alt="Luxury Villa Customer Command Banner"
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
            <span>{userName}!</span>
            <span>👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
            Here&apos;s what&apos;s happening with your property bookings, rentals &amp; acquisitions.
          </p>
        </div>

        {/* Floating Top Right Date Card */}
        <div className="absolute top-5 right-5 z-10 hidden sm:flex items-center gap-3 bg-[#0B1523]/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-[#D9A336]">
            <Calendar className="w-4 h-4" />
          </div>
          <div suppressHydrationWarning className="text-left">
            <p suppressHydrationWarning className="font-extrabold text-xs text-white leading-tight">
              {dateFormatted}
            </p>
            <p suppressHydrationWarning className="text-[10px] text-slate-400 font-medium leading-none mt-0.5">
              {weekdayFormatted}
            </p>
          </div>
        </div>
      </div>

      {/* ─── Quick Action Navigation Bar (Matching Manager Dashboard) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
        <div className="inline-flex items-center gap-2 text-xs font-bold text-[#A97918]">
          <span className="w-2 h-2 rounded-full bg-[#C89B3C] animate-pulse" />
          <span>CLIENT COMMAND CENTER · REAL-TIME PORTFOLIO</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/customer/messages"
            prefetch={true}
            className="px-4 py-2.5 rounded-2xl bg-white border border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
          >
            <MessageSquare className="h-4 w-4 text-[#C89B3C]" />
            Message Manager
          </Link>
          <Link
            href="/customer/properties"
            prefetch={true}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 text-xs font-black flex items-center gap-2 shadow-md shadow-[#C89B3C]/20 transition-all cursor-pointer"
          >
            <Search className="h-4 w-4" />
            Browse Properties
          </Link>
        </div>
      </div>

      {/* ─── 4 Kiro-Maal Stat Cards (Matching Manager Dashboard) ─── */}
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
                <div
                  className={`w-10 h-10 rounded-xl ${card.iconContainer} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {/* Big Metric Number */}
              <div className="my-3 sm:my-3.5">
                <div
                  className={`text-3xl sm:text-4xl font-black font-serif ${card.numberColor} tracking-tight leading-none`}
                >
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

      {/* ─── CLIENT RENTAL & ACQUISITION OVERVIEW HUB (Matching Manager Section 15 Hub) ─── */}
      <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#07111F] text-[#D9B45B]">
                Client Portfolio Summary
              </span>
              {pendingRequestsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                  {pendingRequestsCount} Under Review
                </span>
              )}
            </div>
            <h3 className="text-lg font-serif font-bold text-[#07111F] mt-1">
              Rental Bookings &amp; Property Acquisitions Hub
            </h3>
            <p className="text-xs text-[#6B7280]">
              Track your submitted rental reservations, approved tenancy agreements, and property purchase settlements in real time.
            </p>
          </div>

          <Link
            href="/customer/bookings"
            prefetch={true}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs hover:brightness-105 self-start sm:self-auto cursor-pointer"
          >
            View My Bookings &amp; Requests <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-amber-300 bg-amber-50/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block">
              Pending Review
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-black text-amber-950 mt-1 block">
              {pendingRequestsCount}
            </span>
            <span className="text-[10px] text-amber-700 font-medium">Awaiting approval</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E8E1D4]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
              Approved Rentals
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] mt-1 block">
              {approvedRentalsCount}
            </span>
            <span className="text-[10px] text-[#A97918] font-medium">Agreements approved</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-emerald-300 bg-emerald-50/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
              Active Leases
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-black text-emerald-950 mt-1 block">
              {activeRentalsCount}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">Paid &amp; Tenancy live</span>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-[#E8E1D4]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280] block">
              Purchases
            </span>
            <span className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] mt-1 block">
              {completedPurchasesCount}
            </span>
            <span className="text-[10px] text-[#16A34A] font-medium">Approved acquisitions</span>
          </div>
        </div>
      </div>

      {/* ─── Middle Section: Recommended Properties & Recent Activity ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Properties (2 cols) */}
        <div className="lg:col-span-2 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-bold font-serif text-[#07111F] flex items-center gap-2 tracking-tight">
                <Sparkles className="h-4 w-4 text-[#C89B3C]" /> Recommended Properties For You
              </h2>
              <p className="text-xs text-[#6B7280]">
                Verified listings algorithmically matched to your budget and preferences
              </p>
            </div>
            <Link
              href="/customer/properties"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors flex items-center gap-1"
            >
              Browse All →
            </Link>
          </div>

          {recommendedProps.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E1D4] p-10 text-center">
              <Building2 className="h-8 w-8 text-[#C89B3C] mx-auto mb-2 opacity-50" />
              <p className="text-xs font-bold text-[#07111F]">No recommendations yet</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                We&apos;re still learning your preferences. Browse properties to improve recommendations.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedProps.map((p) => (
                <PropertyCard
                  key={p.id}
                  property={p as any}
                  href={`/customer/properties/${p.id}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Real Recent Activity (1 col) */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm text-[#07111F] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold font-serif text-[#07111F] tracking-tight">
                  Recent Activity
                </h3>
                <p className="text-xs text-[#6B7280]">Real events from your account</p>
              </div>
              <Link
                href="/customer/notifications"
                className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors"
              >
                View All →
              </Link>
            </div>

            {activityList.length === 0 ? (
              <div className="text-center py-8">
                <Inbox className="h-8 w-8 text-[#C89B3C]/50 mx-auto mb-2" />
                <p className="text-xs font-bold text-[#07111F]">No recent activity</p>
                <p className="text-[11px] text-[#6B7280] mt-0.5">
                  Save properties or submit requests to see updates here.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 divide-y divide-[#E8E1D4]">
                {activityList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl ${item.iconBg} border border-[#E8E1D4] flex items-center justify-center flex-shrink-0`}
                        >
                          <Icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold font-serif text-[#07111F] line-clamp-2">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-[#6B7280] mt-0.5">{item.time}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#E8E1D4]">
            <Link
              href="/customer/requests"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors flex items-center justify-between"
            >
              <span>View all requests</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Bottom Section: My Rentals & My Purchases (Matching Manager Rounded-3xl Cards) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MY RENTALS PREVIEW */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Key className="w-4 h-4 text-[#C89B3C]" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-[#07111F]">
                  My Rentals
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Active agreements and move-in schedules
                </p>
              </div>
            </div>
            <Link
              href="/customer/rentals"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors flex items-center gap-1"
            >
              View All →
            </Link>
          </div>

          {customerRentals.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E8E1D4] rounded-2xl bg-white/40">
              <Key className="w-6 h-6 text-[#C89B3C]/40 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#07111F]">No active rental agreements</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Browse our verified properties to lease your next home.
              </p>
              <Link
                href="/customer/properties?listingType=FOR_RENT"
                className="inline-block mt-2.5 px-3 py-1 rounded-lg bg-[#07111F] text-[#D9B45B] text-[11px] font-bold"
              >
                Browse Rentals
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {customerRentals.map((r) => {
                const isApproved = r.status === "ACTIVE" || r.status === "APPROVED";
                const isPaid =
                  r.transaction?.status === "PAID" ||
                  r.transaction?.payments?.[0]?.status === "PAID" ||
                  r.status === "ACTIVE";

                return (
                  <div
                    key={r.id}
                    className="p-3.5 bg-[#F7F3EA] rounded-2xl border border-[#E8E1D4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/customer/properties/${r.property?.id}`}
                        className="font-bold font-serif text-[#07111F] hover:text-[#C89B3C] truncate block"
                      >
                        {r.property?.title}
                      </Link>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"} to{" "}
                        {r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"} •{" "}
                        {formatPrice(r.rentAmount)}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-[10px] font-bold text-[#6B7280]">Booking:</span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {isApproved ? "APPROVED" : "PENDING"}
                        </span>

                        {r.status === "ACTIVE" && (
                          <>
                            <span className="text-[10px] font-bold text-[#6B7280] ml-1">
                              Rental:
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-300">
                              ACTIVE
                            </span>
                          </>
                        )}

                        <span className="text-[10px] font-bold text-[#6B7280] ml-1">Payment:</span>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isPaid
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {isPaid ? "PAID" : "PENDING VERIFICATION"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href="/customer/rentals"
                        className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] text-[10px] font-bold hover:brightness-105"
                      >
                        View Agreement
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MY PURCHASES PREVIEW */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#C89B3C]" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-[#07111F]">
                  My Purchases
                </h3>
                <p className="text-xs text-[#6B7280]">
                  Acquisition approvals and settlement records
                </p>
              </div>
            </div>
            <Link
              href="/customer/purchases"
              className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors flex items-center gap-1"
            >
              View All →
            </Link>
          </div>

          {customerPurchases.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-[#E8E1D4] rounded-2xl bg-white/40">
              <ShoppingBag className="w-6 h-6 text-[#C89B3C]/40 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#07111F]">No purchase records</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Explore luxury properties available for sale.
              </p>
              <Link
                href="/customer/properties?listingType=FOR_SALE"
                className="inline-block mt-2.5 px-3 py-1 rounded-lg bg-[#07111F] text-[#D9B45B] text-[11px] font-bold"
              >
                Browse Properties
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {customerPurchases.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 bg-[#F7F3EA] rounded-2xl border border-[#E8E1D4] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/customer/properties/${p.property?.id}`}
                      className="font-bold font-serif text-[#07111F] hover:text-[#C89B3C] truncate block"
                    >
                      {p.property?.title}
                    </Link>
                    <p className="text-[11px] text-[#6B7280]">
                      Sale Price: {formatPrice(p.salePrice)} •{" "}
                      {new Date(p.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={p.status} />
                    <Link
                      href="/customer/purchases"
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] text-[10px] font-bold"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
