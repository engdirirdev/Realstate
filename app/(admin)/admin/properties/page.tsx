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
import { Building2, CheckCircle2, XCircle, Clock, Eye, Filter, Sparkles, Pencil } from "lucide-react";
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
    include: {
      images: { take: 1, orderBy: { order: "asc" } },
      manager: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusTabs = [
    { label: "All Listings", value: "", count: await prisma.property.count() },
    { label: "Pending Review", value: "PENDING", count: await prisma.property.count({ where: { status: "PENDING" } }) },
    { label: "Approved Live", value: "APPROVED", count: await prisma.property.count({ where: { status: "APPROVED" } }) },
    { label: "Rented", value: "RENTED", count: await prisma.property.count({ where: { OR: [{ status: "RENTED" }, { availabilityStatus: "RENTED" }] } }) },
    { label: "Sold", value: "SOLD", count: await prisma.property.count({ where: { OR: [{ status: "SOLD" }, { availabilityStatus: "SOLD" }] } }) },
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

        <Link
          href="/admin/properties/add"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105 self-start sm:self-auto cursor-pointer"
        >
          <Building2 className="h-4 w-4" /> Add New Property
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statusTabs.map((tab) => {
          const isActive = (statusFilter ?? "") === tab.value;
          return (
            <Link
              key={tab.label}
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
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Type &amp; Listing</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Manager</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Price</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Approval</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Availability</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Listed Date</th>
                <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D4]">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#9CA3AF]">
                    <Building2 className="h-10 w-10 mx-auto mb-2 text-[#C89B3C]/40" />
                    No property records match the selected filter.
                  </td>
                </tr>
              ) : (
                properties.map((p) => {
                  const img = p.images[0]?.url;
                  const isSold = p.status === "SOLD" || p.availabilityStatus === "SOLD";
                  const isRented = p.status === "RENTED" || p.availabilityStatus === "RENTED";
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
                            <Link href={`/properties/${p.id}`} target="_blank" className="font-semibold text-[#07111F] text-sm hover:text-[#C89B3C] max-w-[200px] truncate block">
                              {p.title}
                            </Link>
                            <p className="text-xs text-[#6B7280]">{p.city} · {p.bedrooms} bed</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-[11px] text-[#A97918] uppercase tracking-wide font-bold">{getPropertyTypeLabel(p.type)}</p>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.listingType === "FOR_RENT" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"
                        }`}>
                          {p.listingType === "FOR_RENT" ? "FOR RENT" : "FOR SALE"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs">
                        <p className="font-medium text-[#07111F]">{p.manager?.name || "System"}</p>
                        <p className="text-[10px] text-[#6B7280]">{p.manager?.email || ""}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#07111F] text-sm whitespace-nowrap">
                        {formatPrice(p.price)}
                        {p.listingType === "FOR_RENT" && <span className="text-[10px] font-normal text-[#6B7280]">/{p.rentPeriod?.toLowerCase() || "mo"}</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          p.status === "APPROVED" || p.status === "PUBLISHED" ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30" :
                          p.status === "PENDING" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          p.status === "REJECTED" ? "bg-red-50 text-red-700 border border-red-200" :
                          "bg-stone-100 text-stone-700 border border-stone-300"
                        }`}>
                          {(p.status === "APPROVED" || p.status === "PUBLISHED") && <CheckCircle2 className="h-3 w-3 text-[#D9B45B]" />}
                          {p.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {p.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                          {p.status === "PENDING" ? "PENDING REVIEW" : p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isSold ? "bg-slate-900 text-slate-100 border border-slate-700" :
                          isRented ? "bg-indigo-900 text-indigo-100 border border-indigo-700" :
                          p.availabilityStatus === "BOOKING_PENDING" ? "bg-amber-100 text-amber-800 border border-amber-300" :
                          p.status === "APPROVED" ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                          "bg-stone-100 text-stone-700 border border-stone-300"
                        }`}>
                          {isSold ? "SOLD" : isRented ? "RENTED" : p.availabilityStatus || "AVAILABLE"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#6B7280] text-xs whitespace-nowrap">
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/properties/${p.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#6B7280] hover:text-[#07111F] bg-[#FCFBF7] border border-[#E8E1D4] hover:bg-[#F7F3EA]"
                            title="View Public Listing"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/admin/properties/${p.id}/edit`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#07111F] bg-[#FCFBF7] border border-[#C89B3C]/40 hover:bg-[#F7F3EA] hover:border-[#C89B3C] shadow-2xs"
                            title="Edit Property"
                          >
                            <Pencil className="h-3.5 w-3.5 text-[#C89B3C]" /> Edit
                          </Link>
                          <AdminPropertyReviewModal
                            propertyId={p.id}
                            propertyTitle={p.title}
                            currentStatus={p.status}
                          />
                        </div>
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
