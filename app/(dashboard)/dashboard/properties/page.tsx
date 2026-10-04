// ================================================================
// PAGE NAME  : Manager Dashboard — My Properties
// ROUTE      : /dashboard/properties
// DESCRIPTION: Manager's listed properties — view status, rejection reasons,
//              edit and resubmit rejected properties for admin approval
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, PlusCircle, AlertTriangle, CheckCircle2, Clock, XCircle, Edit3, MapPin, Eye, Sparkles } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My Properties – Manager Dashboard | Kiro-Maal Real Estate" };

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
    { label: "Approved Live", value: "APPROVED", count: approvedCount },
    { label: "Pending Review", value: "PENDING", count: pendingCount },
    { label: "Drafts", value: "DRAFT", count: draftCount },
    { label: "Action Required", value: "REJECTED", count: rejectedCount },
  ];

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Portfolio Management
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Building2 className="h-7 w-7 text-[#C89B3C]" /> My Listed Properties
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">{totalCount} property listings in your portfolio • {totalViews} client impressions</p>
        </div>

        <Link
          href="/dashboard/properties/add"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" /> Add New Property
        </Link>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#FCFBF7] rounded-2xl p-4 border border-[#E8E1D4] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Approved Live</p>
          <p className="text-2xl font-serif font-bold text-[#07111F] mt-0.5">{approvedCount}</p>
        </div>
        <div className="bg-[#FCFBF7] rounded-2xl p-4 border border-[#E8E1D4] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Under Review</p>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-0.5">{pendingCount}</p>
        </div>
        <div className="bg-[#FCFBF7] rounded-2xl p-4 border border-[#E8E1D4] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Draft Portfolios</p>
          <p className="text-2xl font-serif font-bold text-[#6B7280] mt-0.5">{draftCount}</p>
        </div>
        <div className="bg-[#FCFBF7] rounded-2xl p-4 border border-[#E8E1D4] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total Impressions</p>
          <p className="text-2xl font-serif font-bold text-[#A97918] mt-0.5">{totalViews}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E8E1D4]">
        {tabs.map((tab) => {
          const isActive = (currentStatus || "") === tab.value;
          return (
            <Link
              key={tab.label}
              href={tab.value ? `/dashboard/properties?status=${tab.value}` : "/dashboard/properties"}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 shadow-xs ${
                isActive
                  ? "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F]"
                  : "bg-[#FCFBF7] text-[#6B7280] hover:text-[#07111F] border border-[#E8E1D4]"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                isActive ? "bg-[#07111F] text-[#D9B45B]" : "bg-[#F7F3EA] text-[#6B7280]"
              }`}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {properties.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Building2 className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No properties listed yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            List your first real estate listing to begin receiving qualified inquiries and automated visit bookings.
          </p>
          <Link
            href="/dashboard/properties/add"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            <PlusCircle className="h-4 w-4" /> Add Property Now
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {properties.map((prop) => (
            <div key={prop.id} className="bg-[#FCFBF7] rounded-2xl p-6 shadow-sm border border-[#E8E1D4] space-y-4 hover:border-[#C89B3C]/50 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-[#07111F] overflow-hidden flex-shrink-0 border border-[#E8E1D4]">
                    {prop.images[0] ? (
                      <img src={prop.images[0].url} alt={prop.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[#07111F] text-base">{prop.title}</h3>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {prop.city} • <span className="font-semibold text-[#A97918] uppercase tracking-wide">{getPropertyTypeLabel(prop.type)}</span> • <span className="font-serif font-bold text-[#07111F]">{formatPrice(prop.price)}</span>
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    prop.status === "APPROVED" || prop.status === "PUBLISHED"
                      ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                      : prop.status === "REJECTED"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : prop.status === "PENDING"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-[#F7F3EA] text-[#6B7280] border border-[#E8E1D4]"
                  }`}>
                    {prop.status}
                  </span>
                </div>
              </div>

              {/* Rejection Warning Banner */}
              {prop.status === "REJECTED" && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800">
                    <AlertTriangle className="h-4 w-4 text-red-600" /> Administrative Rejection Note:
                  </div>
                  <p className="text-xs text-red-700 leading-relaxed">
                    &ldquo;{prop.rejectionReason || "Listing requires additional details, verified photos, or legal documentation."}&rdquo;
                  </p>
                  <div className="pt-1">
                    <Link
                      href={`/dashboard/properties/add?editId=${prop.id}`}
                      className="inline-flex items-center gap-1.5 bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Edit &amp; Resubmit Listing
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
