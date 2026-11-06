import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import AdminSalesManager from "@/components/admin/AdminSalesManager";

export const metadata: Metadata = {
  title: "Sales Management — Admin Governance | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export default async function AdminSalesPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch purchase proposals, available properties, and system-wide stats in parallel
  const [
    purchaseRequests,
    availableProperties,
    totalAvailableForSale,
    totalRequestsCount,
    requestsByStatus,
    salesVolumeAgg,
  ] = await Promise.all([
    // 1. Fetch recent purchase proposals (bounded to 100 for fast TTFB & low memory)
    prisma.purchaseRequest.findMany({
      take: 100,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            location: true,
            price: true,
            isNegotiable: true,
            status: true,
            availabilityStatus: true,
            listingType: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transaction: {
          select: {
            id: true,
            txnNo: true,
            status: true,
            amount: true,
            currency: true,
            receipt: {
              select: {
                id: true,
                receiptNo: true,
              },
            },
            payments: {
              select: {
                id: true,
                status: true,
                paymentMethod: true,
                paidAt: true,
              },
              take: 1,
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 2. Fetch properties currently available for sale (bounded to 50)
    prisma.property.findMany({
      where: {
        listingType: "FOR_SALE",
        status: { in: ["APPROVED", "PUBLISHED"] },
        availabilityStatus: "AVAILABLE",
        isActive: true,
      },
      take: 50,
      include: {
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
        images: {
          take: 1,
          orderBy: { order: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),

    // 3. System-wide Total Available for Sale Count
    prisma.property.count({
      where: {
        listingType: "FOR_SALE",
        status: { in: ["APPROVED", "PUBLISHED"] },
        availabilityStatus: "AVAILABLE",
        isActive: true,
      },
    }),

    // 4. System-wide Total Purchase Requests Count
    prisma.purchaseRequest.count(),

    // 5. System-wide Status Breakdown for accurate counts across all records
    prisma.purchaseRequest.groupBy({
      by: ["status"],
      _count: { id: true },
    }),

    // 6. System-wide Sales Volume aggregated directly in DB
    prisma.purchaseRequest.aggregate({
      where: { status: "COMPLETED" },
      _sum: { salePrice: true },
    }),
  ]);

  // Compute accurate stats across all records
  const pendingRequests = requestsByStatus
    .filter((r) => r.status === "PENDING" || r.status === "UNDER_REVIEW")
    .reduce((acc, curr) => acc + curr._count.id, 0);
  const approvedRequests = requestsByStatus
    .filter((r) => r.status === "APPROVED" || r.status === "PAYMENT_PENDING")
    .reduce((acc, curr) => acc + curr._count.id, 0);
  const completedSales = requestsByStatus.find((r) => r.status === "COMPLETED")?._count.id || 0;
  const salesVolume = salesVolumeAgg._sum.salePrice || 0;

  const stats = {
    availableForSale: totalAvailableForSale,
    totalRequests: totalRequestsCount,
    pendingRequests,
    approvedRequests,
    completedSales,
    salesVolume,
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" /> Sales Governance &amp; Acquisitions
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          Sales Management
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Review, approve, and track real estate acquisitions. Admin approval authorizes buyer checkout and marks settled listings as permanently Sold.
        </p>
      </div>

      <AdminSalesManager
        initialRequests={purchaseRequests}
        availableProperties={availableProperties}
        stats={stats}
      />
    </div>
  );
}
