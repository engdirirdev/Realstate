// ================================================================
// PAGE NAME  : Admin Dashboard — Property Management
// ROUTE      : /admin/properties
// DESCRIPTION: Full property management table — filter by status
//              (All / Pending / Approved / Rejected / Sold),
//              approve, reject, delete, toggle featured listings
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, CheckCircle2, XCircle, Clock, Eye, Filter, Sparkles } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import AdminPropertyReviewModal from "@/components/AdminPropertyReviewModal";
import AdminAddPropertyModal from "@/components/admin/AdminAddPropertyModal";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Properties – Admin | Kiro-Maal Real Estate" };

type Status = "APPROVED" | "PENDING" | "REJECTED" | "SOLD" | "UNAVAILABLE" | undefined;

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const statusFilter = params.status as Status;

  const properties = await prisma.property.findMany({
    where: statusFilter ? { status: statusFilter } : {},
    include: { images: { take: 1, orderBy: { order: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  const statusTabs = [
    { label: "All Listings", value: "", count: await prisma.property.count() },
    { label: "Pending Review", value: "PENDING", count: await prisma.property.count({ where: { status: "PENDING" } }) },
    { label: "Approved Live", value: "APPROVED", count: await prisma.property.count({ where: { status: "APPROVED" } }) },
    { label: "Rejected", value: "REJECTED", count: await prisma.property.count({ where: { status: "REJECTED" } }) },
  ];

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Catalog Governance
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-[#C89B3C]" /> Property Portfolio Management
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Review, approve, and oversee all real estate listings across Somalia</p>
        </div>

        <AdminAddPropertyModal />
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const isActive = (statusFilter ?? "") === tab.value;
          return (
            <Link
              key={tab.value}
              href={tab.value ? `/admin/properties?status=${tab.value}` : "/admin/properties"}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all shadow-xs ${
                isActive
                  ? "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F]"
                  : "bg-[#FCFBF7] border border-[#E8E1D4] text-[#6B7280] hover:text-[#07111F] hover:border-[#C89B3C]/50"
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                isActive ? "bg-[#07111F] text-[#D9B45B]" : "bg-[#F7F3EA] text-[#6B7280]"
              }`}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
              <tr>
                <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Property</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">City / Type</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Price</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Status</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Listed Date</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Review Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D4]">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#9CA3AF]">
                    <Building2 className="h-10 w-10 mx-auto mb-2 text-[#C89B3C]/40" />
                    No property records match the selected filter.
                  </td>
                </tr>
              ) : (
                properties.map((p) => {
                  const img = p.images[0]?.url;
                  return (
                    <tr key={p.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F7F3EA] border border-[#E8E1D4] flex-shrink-0">
                            {img ? (
                              <img src={img} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-[#9CA3AF]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-[#07111F] text-sm max-w-[220px] truncate">{p.title}</p>
                            <p className="text-xs text-[#6B7280]">{p.bedrooms} bed · {p.area} m²</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#07111F] text-xs">{p.city}</p>
                        <p className="text-[11px] text-[#A97918] uppercase tracking-wide font-bold">{getPropertyTypeLabel(p.type)}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#07111F] text-sm">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          p.status === "APPROVED" ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30" :
                          p.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          p.status === "SOLD" ? "bg-stone-100 text-stone-700 border border-stone-300" :
                          "bg-red-50 text-red-700 border border-red-200"
                        }`}>
                          {p.status === "APPROVED" && <CheckCircle2 className="h-3 w-3 text-[#D9B45B]" />}
                          {p.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {p.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#6B7280] text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <AdminPropertyReviewModal
                          propertyId={p.id}
                          propertyTitle={p.title}
                          currentStatus={p.status}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
