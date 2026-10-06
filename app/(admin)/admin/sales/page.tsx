import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import { ShieldCheck, DollarSign, Building2 } from "lucide-react";
import AdminSalesManager from "@/components/admin/AdminSalesManager";

export const metadata: Metadata = {
  title: "Sales Management — Admin Governance | Kiro-Maal Real Estate",
};

export default async function AdminSalesPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") {
    redirect("/login");
  }

  // 1. Fetch all purchase proposals
  const purchaseRequests = await prisma.purchaseRequest.findMany({
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
  });

  // 2. Fetch properties currently available for sale
  const availableProperties = await prisma.property.findMany({
    where: {
      listingType: "FOR_SALE",
      status: { in: ["APPROVED", "PUBLISHED"] },
      availabilityStatus: "AVAILABLE",
      isActive: true,
    },
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
  });

  // 3. Compute stats
  const pendingRequests = purchaseRequests.filter(
    (r) => r.status === "PENDING" || r.status === "UNDER_REVIEW"
  ).length;
  const approvedRequests = purchaseRequests.filter(
    (r) => r.status === "APPROVED" || r.status === "PAYMENT_PENDING"
  ).length;
  const completedSales = purchaseRequests.filter(
    (r) => r.status === "COMPLETED"
  ).length;

  const salesVolume = purchaseRequests
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + (r.salePrice || 0), 0);

  const stats = {
    availableForSale: availableProperties.length,
    totalRequests: purchaseRequests.length,
    pendingRequests,
    approvedRequests,
    completedSales,
    salesVolume,
  };

  return (
    <div className="space-y-6 max-w-7xl p-4 sm:p-8 bg-[#F7F3EA] min-h-screen">
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
