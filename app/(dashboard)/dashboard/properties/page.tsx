// ================================================================
// PAGE NAME  : Manager Dashboard — My Properties
// ROUTE      : /dashboard/properties
// DESCRIPTION: Manager's listed properties — view status, rejection reasons,
//              edit and resubmit rejected properties for admin approval
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, PlusCircle, AlertTriangle, CheckCircle2, Clock, XCircle, Edit3, MapPin, Eye } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Properties – Manager Dashboard" };

export default async function ManagerPropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { status: currentStatus } = await searchParams;

  const allManagerProperties = await prisma.property.findMany({
    where: { managerId: session.user.id },
    select: { id: true, status: true, viewCount: true },
  });

  const totalCount = allManagerProperties.length;
  const approvedCount = allManagerProperties.filter((p) => p.status === "APPROVED" || p.status === "PUBLISHED").length;
  const pendingCount = allManagerProperties.filter((p) => p.status === "PENDING").length;
  const draftCount = allManagerProperties.filter((p) => p.status === "DRAFT").length;
  const rejectedCount = allManagerProperties.filter((p) => p.status === "REJECTED").length;
  const totalViews = allManagerProperties.reduce((acc, p) => acc + (p.viewCount || 0), 0);

  const filterWhere: any = { managerId: session.user.id };
  if (currentStatus === "APPROVED") {
    filterWhere.status = { in: ["APPROVED", "PUBLISHED"] };
  } else if (currentStatus) {
    filterWhere.status = currentStatus;
  }

  const properties = await prisma.property.findMany({
    where: filterWhere,
    include: {
      images: { orderBy: { order: "asc" }, take: 1 },
      inquiries: { select: { id: true } },
      bookings: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const tabs = [
    { label: "All Listings", value: "", count: totalCount },
    { label: "Approved", value: "APPROVED", count: approvedCount },
    { label: "Pending Review", value: "PENDING", count: pendingCount },
    { label: "Drafts", value: "DRAFT", count: draftCount },
    { label: "Rejected", value: "REJECTED", count: rejectedCount },
  ];

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
            <Building2 className="h-6 w-6 text-[#10B981]" /> My Listed Properties
          </h1>
          <p className="text-[#64748B] text-sm mt-1">{totalCount} property listings in your portfolio • {totalViews} total views</p>
        </div>

        <Link
          href="/dashboard/properties/add"
          className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" /> Add New Property
        </Link>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-card">
          <p className="text-xs font-semibold text-[#64748B]">Approved Listings</p>
          <p className="text-2xl font-bold text-[#059669] mt-0.5">{approvedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-card">
          <p className="text-xs font-semibold text-[#64748B]">Pending Approval</p>
          <p className="text-2xl font-bold text-[#F59E0B] mt-0.5">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-card">
          <p className="text-xs font-semibold text-[#64748B]">Draft Listings</p>
          <p className="text-2xl font-bold text-[#64748B] mt-0.5">{draftCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-card">
          <p className="text-xs font-semibold text-[#64748B]">Total Views</p>
          <p className="text-2xl font-bold text-[#3B82F6] mt-0.5">{totalViews}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E2E8F0]">
        {tabs.map((tab) => {
          const isActive = (currentStatus || "") === tab.value;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/dashboard/properties?status=${tab.value}` : "/dashboard/properties"}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "bg-[#10B981] text-white shadow-sm"
                  : "bg-white text-[#64748B] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? "bg-white/20 text-white" : "bg-[#F1F5F9] text-[#0F172A]"
              }`}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {properties.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <Building2 className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No properties listed yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto mb-6">
            List your first real estate property to start receiving customer inquiries and bookings.
          </p>
          <Link
            href="/dashboard/properties/add"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <PlusCircle className="h-4 w-4" /> Add Property Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-white rounded-2xl p-6 shadow-card border border-[#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#E2E8F0] overflow-hidden flex-shrink-0">
                    {prop.images[0] ? (
                      <img src={prop.images[0].url} alt={prop.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F172A] text-base">{prop.title}</h3>
                    <p className="text-xs text-[#64748B] flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" /> {prop.city} • <span className="font-semibold text-[#0F172A]">{getPropertyTypeLabel(prop.type)}</span> • <span className="font-bold text-[#059669]">{formatPrice(prop.price)}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    prop.status === "APPROVED" || prop.status === "PUBLISHED"
                      ? "bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]"
                      : prop.status === "REJECTED"
                      ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]"
                      : prop.status === "PENDING"
                      ? "bg-[#FEF9C3] text-[#92400E] border border-[#FDE68A]"
                      : "bg-[#F1F5F9] text-[#334155]"
                  }`}>
                    {prop.status}
                  </span>
                </div>
              </div>

              {/* Rejection Warning Banner */}
              {prop.status === "REJECTED" && (
                <div className="bg-[#FEE2E2] border border-[#FCA5A5] p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#991B1B]">
                    <AlertTriangle className="h-4 w-4 text-[#DC2626]" /> Admin Rejection Reason:
                  </div>
                  <p className="text-xs text-[#7F1D1D] leading-relaxed">
                    &ldquo;{prop.rejectionReason || "Listing requires additional details or photos."}&rdquo;
                  </p>
                  <div className="pt-1">
                    <Link
                      href={`/dashboard/properties/add?editId=${prop.id}`}
                      className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit & Resubmit Listing
                    </Link>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
