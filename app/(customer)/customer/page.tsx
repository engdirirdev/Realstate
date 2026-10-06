// ================================================================
// PAGE NAME  : Customer Portal — Overview & Dashboard
// ROUTE      : /customer
// DESCRIPTION: Clean, functional, real-database driven Customer Dashboard
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER & USER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  Heart,
  FileText,
  Key,
  CreditCard,
  Building2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Receipt,
  ShoppingBag,
  Clock,
  CheckCircle2,
  Inbox,
  MessageSquare,
} from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
import CustomerHeroSearch from "@/components/customer/CustomerHeroSearch";
import StatusBadge from "@/components/transactions/StatusBadge";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Dashboard – Kiro-Maal Real Estate",
};

export default async function CustomerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const userName = session.user.name?.split(" ")[0] || "Customer";

  // ─── Real Database Queries for Metrics & Feeds ───
  const [
    favoritesCount,
    pendingRentalsCount,
    pendingPurchasesCount,
    activeRentalsCount,
    pendingTransactions,
    paidPaymentsCount,
    userFavorites,
    aiRecommendations,
    fallbackProperties,
    customerRentals,
    customerPurchases,
    recentRentalRequests,
    recentPurchaseRequests,
    recentPayments,
  ] = await Promise.all([
    // 1. My Favorites Count
    prisma.favorite.count({ where: { userId } }),

    // 2. Pending Requests (Rentals + Purchases)
    prisma.rentalRequest.count({
      where: {
        customerId: userId,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    }),
    prisma.purchaseRequest.count({
      where: {
        customerId: userId,
        status: { in: ["PENDING", "UNDER_REVIEW"] },
      },
    }),

    // 3. Active Rentals Count
    prisma.rentalRequest.count({
      where: { customerId: userId, status: "ACTIVE" },
    }),

    // 4. Payments Pending (Sum and records of outstanding pending transactions)
    prisma.transaction.findMany({
      where: {
        customerId: userId,
        status: { in: ["PENDING", "PAYMENT_PENDING"] },
      },
      select: { amount: true },
    }),

    // 5. Total Paid Payments Count (Payment History)
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

    // AI Recommendations - strictly Available + Approved + Active
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

    // Fallback verified properties - strictly Available + Approved + Active
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

    // Recent events for activity feed
    prisma.rentalRequest.findMany({
      where: { customerId: userId },
      select: { id: true, requestNo: true, createdAt: true, property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.purchaseRequest.findMany({
      where: { customerId: userId },
      select: { id: true, requestNo: true, createdAt: true, property: { select: { title: true } } },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
    prisma.payment.findMany({
      where: { customerId: userId, status: "PAID" },
      select: { id: true, amount: true, createdAt: true, transactionRef: true },
      orderBy: { createdAt: "desc" },
      take: 2,
    }),
  ]);

  // Derived metrics
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

  for (const rent of recentRentalRequests) {
    realActivities.push({
      id: `rent-${rent.id}`,
      icon: Key,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      title: `Submitted rental request for "${rent.property.title}" (#${rent.requestNo})`,
      time: new Date(rent.createdAt).toLocaleDateString(),
      date: rent.createdAt,
    });
  }

  for (const pur of recentPurchaseRequests) {
    realActivities.push({
      id: `pur-${pur.id}`,
      icon: ShoppingBag,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      title: `Submitted purchase request for "${pur.property.title}" (#${pur.requestNo})`,
      time: new Date(pur.createdAt).toLocaleDateString(),
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
      time: new Date(pay.createdAt).toLocaleDateString(),
      date: pay.createdAt,
    });
  }

  // Sort real events chronologically
  const activityList = realActivities
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 5);

  // 4 Primary Real Summary Cards matching Section 16
  const customerStats = [
    {
      title: "PENDING REQUESTS",
      value: pendingRequestsCount.toString(),
      tagText: "Under Review",
      tagColor: "text-amber-500",
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
      tagColor: "text-blue-500",
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
      tagColor: paymentsDueAmount > 0 ? "text-amber-500" : "text-green-500",
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
      tagText: "Verified",
      tagColor: "text-green-500",
      subText: "Completed Receipts",
      icon: Receipt,
      href: "/customer/payments",
      cardBg: "bg-[#FCFBF7] text-[#07111F] border border-[#E8E1D4]",
      iconContainer: "bg-[#F7F3EA] border border-[#E8E1D4] text-[#16A34A]",
      numberColor: "text-[#07111F]",
    },
  ];

  return (
    <div className="space-y-7 pb-10">
      {/* ─── 1. Compact Welcome Section & Property Search ─── */}
      <div className="bg-[#07111F] rounded-3xl p-6 sm:p-7 border border-[#C89B3C]/30 shadow-md relative overflow-hidden text-white">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C89B3C]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mb-4">
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#FCFBF7] tracking-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-[#CBD5E1] text-xs sm:text-sm mt-1 font-medium">
            Find a property that matches your needs across Somalia&apos;s most sought-after locations.
          </p>
        </div>

        {/* Embedded Property Search Bar */}
        <div className="relative z-10 pt-1">
          <CustomerHeroSearch />
        </div>
      </div>

      {/* ─── 2. Main Summary Cards (Database Live) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {customerStats.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              href={card.href}
              className={`relative overflow-hidden rounded-2xl p-5 ${card.cardBg} shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between min-h-[130px] group`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-extrabold uppercase tracking-wider opacity-80">
                  {card.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl ${card.iconContainer} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="my-2.5">
                <div
                  className={`text-2xl sm:text-3xl font-black font-serif ${card.numberColor} tracking-tight leading-none`}
                >
                  {card.value}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold">
                <span className={`font-bold ${card.tagColor}`}>{card.tagText}</span>
                <span className="opacity-70 font-medium text-[11px]">• {card.subText}</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ─── 3. Middle Section: Recommended Properties & Recent Activity ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended Properties (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold font-serif text-[#07111F] flex items-center gap-2">
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
              Browse All <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recommendedProps.length === 0 ? (
            <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-10 text-center">
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
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 shadow-xs text-[#07111F] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E8E1D4]">
              <div>
                <h3 className="text-base font-bold font-serif text-[#07111F] tracking-tight flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-[#C89B3C]" /> Recent Activity
                </h3>
                <p className="text-[11px] text-[#6B7280]">Real events from your account</p>
              </div>
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
              <div className="space-y-3 divide-y divide-[#E8E1D4]">
                {activityList.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.id} className="pt-2.5 first:pt-0 flex items-start gap-2.5">
                      <div
                        className={`w-7 h-7 rounded-lg ${item.iconBg} border border-[#E8E1D4] flex items-center justify-center flex-shrink-0 mt-0.5`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${item.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#07111F] line-clamp-2">
                          {item.title}
                        </p>
                        <p className="text-[10px] text-[#6B7280] mt-0.5">{item.time}</p>
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

      {/* ─── 4. Quick Access Portfolios: My Rentals & My Purchases ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MY RENTALS PREVIEW */}
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <Key className="w-4 h-4 text-[#C89B3C]" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-[#07111F]">
                  My Rentals
                </h3>
                <p className="text-[11px] text-[#6B7280]">
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
            <div className="text-center py-6 border border-dashed border-[#E8E1D4] rounded-xl bg-white/40">
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
                    className="p-3.5 bg-[#F7F3EA] rounded-xl border border-[#E8E1D4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/customer/properties/${r.property?.id}`}
                        className="font-bold text-[#07111F] hover:text-[#C89B3C] truncate block"
                      >
                        {r.property?.title}
                      </Link>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"} to{" "}
                        {r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"} • {formatPrice(r.rentAmount)}
                      </p>

                      {/* Explicit Separated Statuses (Section 12 & 16) */}
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
                            <span className="text-[10px] font-bold text-[#6B7280] ml-1">Rental:</span>
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
                        className="px-3 py-1.5 rounded-lg bg-[#07111F] text-[#D9B45B] text-[10px] font-bold hover:brightness-110"
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
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E1D4]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-[#C89B3C]" />
              </div>
              <div>
                <h3 className="text-base font-bold font-serif text-[#07111F]">
                  My Purchases
                </h3>
                <p className="text-[11px] text-[#6B7280]">
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
            <div className="text-center py-6 border border-dashed border-[#E8E1D4] rounded-xl bg-white/40">
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
                  className="p-3 bg-[#F7F3EA] rounded-xl border border-[#E8E1D4] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/customer/properties/${p.property?.id}`}
                      className="font-bold text-[#07111F] hover:text-[#C89B3C] truncate block"
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
                      className="px-2.5 py-1 rounded-lg bg-[#07111F] text-[#D9B45B] text-[10px] font-bold"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── 5. AI Valuation & Advisor Support Callouts ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 shadow-xs text-[#07111F] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#F7F3EA] border border-[#E8E1D4] flex items-center justify-center flex-shrink-0 text-[#C89B3C]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-serif text-[#07111F]">
                AI Price Prediction
              </h4>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Calculate property valuation using our machine learning model.
              </p>
            </div>
          </div>
          <Link
            href="/customer/predictions"
            className="bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] hover:brightness-105 text-[#07111F] text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex-shrink-0"
          >
            Predict Price
          </Link>
        </div>

        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 shadow-xs text-[#07111F] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold font-serif text-[#07111F]">
                Advisor Messages
              </h4>
              <p className="text-xs text-[#6B7280] mt-0.5">
                Direct consultations with your dedicated property managers.
              </p>
            </div>
          </div>
          <Link
            href="/customer/messages"
            className="bg-[#07111F] hover:bg-[#112238] text-[#D9B45B] border border-[#C89B3C]/30 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex-shrink-0"
          >
            Open Messages
          </Link>
        </div>
      </div>
    </div>
  );
}
