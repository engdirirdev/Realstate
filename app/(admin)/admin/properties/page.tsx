// ================================================================
// PAGE NAME  : Admin Dashboard — Property Management
// ROUTE      : /admin/properties
// DESCRIPTION: Full property management table — filter by status
//              (All / Pending / Approved / Rejected / Sold),
//              approve, reject, delete, toggle featured listings
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, CheckCircle2, XCircle, Clock, Eye, Filter } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import AdminPropertyReviewModal from "@/components/AdminPropertyReviewModal";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Manage Properties – Admin" };

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
    { label: "All", value: "", count: await prisma.property.count() },
    { label: "Pending", value: "PENDING", count: await prisma.property.count({ where: { status: "PENDING" } }) },
    { label: "Approved", value: "APPROVED", count: await prisma.property.count({ where: { status: "APPROVED" } }) },
    { label: "Rejected", value: "REJECTED", count: await prisma.property.count({ where: { status: "REJECTED" } }) },
  ];

  return (
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0F172A] flex items-center gap-2">
            <Building2 className="h-6 w-6 text-[#10B981]" /> Property Management
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Review, approve, and manage all property listings</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {statusTabs.map((tab) => (
          <Link
            key={tab.value}
            href={tab.value ? `/admin/properties?status=${tab.value}` : "/admin/properties"}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              (statusFilter ?? "") === tab.value
                ? "bg-[#10B981] text-white"
                : "bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              (statusFilter ?? "") === tab.value ? "bg-white/20 text-white" : "bg-[#F8FAFC] text-[#64748B]"
            }`}>
              {tab.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-[#64748B]">Property</th>
                <th className="text-left px-4 py-3 font-semibold text-[#64748B]">City / Type</th>
                <th className="text-left px-4 py-3 font-semibold text-[#64748B]">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-[#64748B]">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-[#64748B]">Date</th>
                <th className="text-left px-4 py-3 font-semibold text-[#64748B]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {properties.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#94A3B8]">
                    <Building2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    No properties found.
                  </td>
                </tr>
              ) : (
                properties.map((p) => {
                  const img = p.images[0]?.url;
                  return (
                    <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-[#F8FAFC] border border-[#E2E8F0] flex-shrink-0">
                            {img ? (
                              <img src={img} alt={p.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-[#94A3B8]" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#0F172A] max-w-[200px] truncate">{p.title}</p>
                            <p className="text-xs text-[#64748B]">{p.bedrooms}bed · {p.area}m²</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[#0F172A]">{p.city}</p>
                        <p className="text-xs text-[#64748B]">{getPropertyTypeLabel(p.type)}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#10B981]">{formatPrice(p.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          p.status === "APPROVED" ? "bg-[#D1FAE5] text-[#065F46]" :
                          p.status === "PENDING" ? "bg-[#FEF9C3] text-[#92400E]" :
                          p.status === "SOLD" ? "bg-[#DBEAFE] text-[#1E40AF]" :
                          "bg-[#FEE2E2] text-[#991B1B]"
                        }`}>
                          {p.status === "APPROVED" && <CheckCircle2 className="h-3 w-3" />}
                          {p.status === "PENDING" && <Clock className="h-3 w-3" />}
                          {p.status === "REJECTED" && <XCircle className="h-3 w-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B] text-xs">
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
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
