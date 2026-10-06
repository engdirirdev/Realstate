"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  Clock,
  User,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Receipt,
  FileText,
  BadgeDollarSign,
  Loader2,
  Calendar,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import StatusBadge from "@/components/transactions/StatusBadge";

interface AdminSalesManagerProps {
  initialRequests: any[];
  availableProperties: any[];
  stats: {
    availableForSale: number;
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    completedSales: number;
    salesVolume: number;
  };
}

export default function AdminSalesManager({
  initialRequests,
  availableProperties,
  stats,
}: AdminSalesManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"requests" | "available">("requests");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [requests, setRequests] = useState(initialRequests);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<any | null>(null);
  const [customerModal, setCustomerModal] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const STATUS_FILTERS = [
    { key: "ALL", label: "All Requests" },
    { key: "PENDING", label: "Pending Approval" },
    { key: "APPROVED", label: "Approved" },
    { key: "PAYMENT_PENDING", label: "Payment Pending" },
    { key: "COMPLETED", label: "Completed (Sold)" },
    { key: "REJECTED", label: "Rejected" },
    { key: "CANCELLED", label: "Cancelled" },
  ];

  // Filtering requests
  const filteredRequests = requests.filter((req) => {
    const matchesStatus =
      statusFilter === "ALL" ? true : req.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      req.requestNo?.toLowerCase().includes(q) ||
      req.property?.title?.toLowerCase().includes(q) ||
      req.customer?.name?.toLowerCase().includes(q) ||
      req.customer?.email?.toLowerCase().includes(q) ||
      req.manager?.name?.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  // Action handler
  const handleReviewAction = async (
    requestId: string,
    action: "approve" | "reject",
    notes?: string
  ) => {
    setBusyId(requestId);
    try {
      const res = await fetch(`/api/requests/purchase/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const data = await res.json();

      if (data.success) {
        toast({
          title:
            action === "approve"
              ? "Purchase Request Approved"
              : "Purchase Request Rejected",
          description:
            action === "approve"
              ? "The customer has been notified and can now proceed with payment. Competing buyer requests are now on hold."
              : "The request has been rejected and the property remains available for sale.",
        });

        // Update local state
        setRequests((prev) =>
          prev.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: action === "approve" ? "APPROVED" : "REJECTED",
                  reviewNotes: notes || r.reviewNotes,
                }
              : r
          )
        );

        setRejectingRequest(null);
        setRejectReason("");
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null);
        }

        startTransition(() => {
          router.refresh();
        });
      } else {
        toast({
          title: "Action Failed",
          description: data.error || "Unable to complete action.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Network Error",
        description: "Failed to communicate with server.",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metric KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-[#FCFBF7] p-4 rounded-2xl border border-[#E8E1D4] shadow-xs">
          <div className="flex items-center justify-between text-[#C89B3C] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Available Sale
            </span>
            <Building2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-serif font-black text-[#07111F]">
            {stats.availableForSale}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Live on market</p>
        </div>

        <div className="bg-[#FCFBF7] p-4 rounded-2xl border border-[#E8E1D4] shadow-xs">
          <div className="flex items-center justify-between text-amber-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Pending Review
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-serif font-black text-amber-600">
            {stats.pendingRequests}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Awaiting Admin</p>
        </div>

        <div className="bg-[#FCFBF7] p-4 rounded-2xl border border-[#E8E1D4] shadow-xs">
          <div className="flex items-center justify-between text-blue-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Approved
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-serif font-black text-blue-600">
            {stats.approvedRequests}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Awaiting payment</p>
        </div>

        <div className="bg-[#FCFBF7] p-4 rounded-2xl border border-[#E8E1D4] shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Completed Sold
            </span>
            <ShieldCheck className="w-4 h-4" />
          </div>
          <p className="text-2xl font-serif font-black text-emerald-700">
            {stats.completedSales}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Properties sold</p>
        </div>

        <div className="bg-[#FCFBF7] p-4 rounded-2xl border border-[#E8E1D4] shadow-xs">
          <div className="flex items-center justify-between text-[#07111F] mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">
              Total Inquiries
            </span>
            <FileText className="w-4 h-4 text-[#C89B3C]" />
          </div>
          <p className="text-2xl font-serif font-black text-[#07111F]">
            {stats.totalRequests}
          </p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">All buyer requests</p>
        </div>

        <div className="bg-[#07111F] p-4 rounded-2xl border border-[#C89B3C]/30 shadow-xs">
          <div className="flex items-center justify-between text-[#D9B45B] mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300">
              Sales Volume
            </span>
            <BadgeDollarSign className="w-4 h-4 text-[#C89B3C]" />
          </div>
          <p className="text-xl font-serif font-black text-[#D9B45B] truncate">
            {formatPrice(stats.salesVolume)}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Settled revenue</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E1D4] pb-4">
        <div className="inline-flex rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1 shadow-2xs">
          <button
            onClick={() => setActiveTab("requests")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "requests"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Purchase Requests ({requests.length})
          </button>
          <button
            onClick={() => setActiveTab("available")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "available"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Available for Sale ({availableProperties.length})
          </button>
        </div>

        {activeTab === "requests" && (
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#6B7280]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search request, property, customer..."
              className="pl-9 h-9 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-xs"
            />
          </div>
        )}
      </div>

      {/* TAB 1: PURCHASE REQUESTS */}
      {activeTab === "requests" && (
        <div className="space-y-4">
          {/* Status Sub-filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer border ${
                  statusFilter === f.key
                    ? "bg-[#07111F] text-[#D9B45B] border-[#07111F] shadow-xs"
                    : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:border-[#C89B3C]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-16 px-4">
                <FileText className="w-10 h-10 text-[#C89B3C]/50 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  No purchase requests found
                </h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1">
                  {searchQuery || statusFilter !== "ALL"
                    ? "No purchase proposals match your selected filter or search term."
                    : "Buyer requests submitted by customers will appear here for Admin review and approval."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F3EA] text-[#6B7280] font-mono text-[10px] uppercase tracking-wider border-b border-[#E8E1D4]">
                      <th className="p-3.5">Request No &amp; Date</th>
                      <th className="p-3.5">Customer</th>
                      <th className="p-3.5">Property</th>
                      <th className="p-3.5">Sale Price</th>
                      <th className="p-3.5">Manager</th>
                      <th className="p-3.5">Purchase Status</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5 text-right">Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D4]">
                    {filteredRequests.map((r) => {
                      const isPendingReview =
                        r.status === "PENDING" || r.status === "UNDER_REVIEW";
                      const isCompleted = r.status === "COMPLETED";
                      const paymentStatus =
                        r.transaction?.payments?.[0]?.status ||
                        (r.status === "COMPLETED"
                          ? "PAID"
                          : r.status === "PAYMENT_PENDING"
                          ? "PENDING"
                          : null);

                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-[#F2ECE1]/40 transition-colors"
                        >
                          <td className="p-3.5">
                            <span className="font-mono font-bold text-[#07111F] block">
                              {r.requestNo}
                            </span>
                            <span className="text-[11px] text-[#6B7280]">
                              {new Date(r.createdAt).toLocaleDateString()}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <button
                              onClick={() => setCustomerModal(r.customer)}
                              className="text-left group cursor-pointer"
                            >
                              <span className="font-semibold text-[#07111F] group-hover:text-[#C89B3C] block transition-colors">
                                {r.customer?.name}
                              </span>
                              <span className="text-[11px] text-[#6B7280]">
                                {r.customer?.email}
                              </span>
                            </button>
                          </td>

                          <td className="p-3.5 max-w-[200px]">
                            <Link
                              href={`/properties/${r.property?.id}`}
                              target="_blank"
                              className="font-semibold text-[#07111F] hover:text-[#C89B3C] block truncate"
                            >
                              {r.property?.title}
                            </Link>
                            <span className="text-[11px] text-[#6B7280]">
                              {r.property?.city} · {r.property?.availabilityStatus}
                            </span>
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-serif font-black text-sm text-[#07111F] block">
                              {formatPrice(r.salePrice)}
                            </span>
                            {r.property?.price && r.property.price !== r.salePrice && (
                              <span className="text-[10px] text-[#6B7280]">
                                List: {formatPrice(r.property.price)}
                              </span>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span className="text-[#07111F] font-medium">
                              {r.manager?.name || "Kiro-Maal Corp"}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <StatusBadge status={r.status} />
                            {r.reviewNotes && (
                              <p className="text-[10px] text-[#6B7280] mt-1 max-w-[140px] truncate">
                                Notes: {r.reviewNotes}
                              </p>
                            )}
                          </td>

                          <td className="p-3.5">
                            <div className="space-y-1">
                              <StatusBadge status={paymentStatus} />
                              {r.transaction?.txnNo && (
                                <p className="font-mono text-[10px] text-[#6B7280]">
                                  {r.transaction.txnNo}
                                </p>
                              )}
                            </div>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View Details */}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedRequest(r)}
                                className="h-7 px-2 text-[11px] border-[#E8E1D4] hover:bg-white text-[#07111F]"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </Button>

                              {/* Receipt if available */}
                              {r.transaction?.receipt && (
                                <Link
                                  href={`/receipt/${r.transaction.receipt.id}`}
                                  target="_blank"
                                >
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-[11px] border-[#E8E1D4] text-[#C89B3C] hover:bg-[#F2ECE1]"
                                    title="View official receipt"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                  </Button>
                                </Link>
                              )}

                              {/* Direct Admin Review Actions */}
                              {isPendingReview && (
                                <>
                                  <Button
                                    size="sm"
                                    disabled={busyId === r.id}
                                    onClick={() => handleReviewAction(r.id, "approve")}
                                    className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                  >
                                    {busyId === r.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="w-3 h-3" />
                                    )}
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busyId === r.id}
                                    onClick={() => {
                                      setRejectingRequest(r);
                                      setRejectReason("");
                                    }}
                                    className="h-7 px-2.5 text-[11px] border-red-200 text-red-600 hover:bg-red-50 gap-1"
                                  >
                                    <XCircle className="w-3 h-3" /> Reject
                                  </Button>
                                </>
                              )}
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
      )}

      {/* TAB 2: AVAILABLE FOR SALE PROPERTIES */}
      {activeTab === "available" && (
        <div className="space-y-4">
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs">
            {availableProperties.length === 0 ? (
              <div className="text-center py-16 px-4">
                <Building2 className="w-10 h-10 text-[#C89B3C]/50 mx-auto mb-3" />
                <h3 className="font-serif font-bold text-base text-[#07111F]">
                  No properties available for sale
                </h3>
                <p className="text-xs text-[#6B7280] max-w-sm mx-auto mt-1">
                  Properties listed for sale that have been approved by Admin will appear here.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F3EA] text-[#6B7280] font-mono text-[10px] uppercase tracking-wider border-b border-[#E8E1D4]">
                      <th className="p-3.5">Property</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Location</th>
                      <th className="p-3.5">Sale Price</th>
                      <th className="p-3.5">Price Model</th>
                      <th className="p-3.5">Manager</th>
                      <th className="p-3.5">Availability</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D4]">
                    {availableProperties.map((p) => (
                      <tr
                        key={p.id}
                        className="hover:bg-[#F2ECE1]/40 transition-colors"
                      >
                        <td className="p-3.5">
                          <Link
                            href={`/properties/${p.id}`}
                            target="_blank"
                            className="font-bold text-[#07111F] hover:text-[#C89B3C] block truncate max-w-[220px]"
                          >
                            {p.title}
                          </Link>
                          <span className="text-[11px] text-[#6B7280]">
                            Listed on {new Date(p.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-[#07111F]/5 text-[#07111F] font-medium text-[11px]">
                            {p.propertyType || "Residential"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="text-[#07111F] block font-medium">
                            {p.city}
                          </span>
                          <span className="text-[11px] text-[#6B7280] block truncate max-w-[180px]">
                            {p.location}
                          </span>
                        </td>

                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-serif font-black text-sm text-[#07111F]">
                            {formatPrice(p.price)}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="capitalize text-[#6B7280]">
                            {p.isNegotiable ? "Negotiable" : "Fixed"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="text-[#07111F]">
                            {p.manager?.name || "Kiro-Maal Corp"}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            AVAILABLE FOR SALE
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/properties/${p.id}`} target="_blank">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] border-[#E8E1D4] text-[#07111F] hover:bg-white gap-1"
                              >
                                <ExternalLink className="w-3 h-3" /> View Listing
                              </Button>
                            </Link>
                            <Link href={`/admin/properties`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2.5 text-[11px] border-[#E8E1D4] text-[#6B7280] hover:bg-white"
                              >
                                Manage
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: VIEW PURCHASE REQUEST DETAILS */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={(open) => !open && setSelectedRequest(null)}
      >
        <DialogContent className="max-w-xl bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#6B7280]">
                {selectedRequest?.requestNo}
              </span>
              <StatusBadge status={selectedRequest?.status} />
            </div>
            <DialogTitle className="font-serif text-xl font-bold text-[#07111F] text-left">
              Purchase Proposal Details
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280] text-left">
              Submitted on{" "}
              {selectedRequest?.createdAt &&
                new Date(selectedRequest.createdAt).toLocaleString()}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-2 text-xs">
              {/* Property Snapshot */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8E1D4] space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C89B3C] font-mono">
                  Target Property
                </span>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-[#07111F]">
                      {selectedRequest.property?.title}
                    </h4>
                    <p className="text-[#6B7280]">{selectedRequest.property?.city}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-serif font-black text-base text-[#07111F] block">
                      {formatPrice(selectedRequest.salePrice)}
                    </span>
                    <span className="text-[10px] text-[#6B7280]">Offered Sale Price</span>
                  </div>
                </div>
                <div className="pt-2 flex gap-2 border-t border-slate-100">
                  <Link
                    href={`/properties/${selectedRequest.property?.id}`}
                    target="_blank"
                    className="text-[11px] font-semibold text-[#C89B3C] hover:underline flex items-center gap-1"
                  >
                    Open Public Listing <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Customer Snapshot */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8E1D4] space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#C89B3C] font-mono">
                  Buyer Information
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Name:</span>
                    <span className="font-semibold text-[#07111F]">
                      {selectedRequest.customer?.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Email:</span>
                    <span className="font-semibold text-[#07111F]">
                      {selectedRequest.customer?.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Phone:</span>
                    <span className="font-semibold text-[#07111F]">
                      {selectedRequest.customer?.phone || "Not provided"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block text-[11px]">Manager:</span>
                    <span className="font-semibold text-[#07111F]">
                      {selectedRequest.manager?.name || "Kiro-Maal Corp"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes or message */}
              {selectedRequest.notes && (
                <div className="p-3 bg-[#F7F3EA] rounded-xl border border-[#E8E1D4]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block mb-1">
                    Buyer Notes / Message:
                  </span>
                  <p className="text-[#07111F]">{selectedRequest.notes}</p>
                </div>
              )}

              {/* Admin Review Notes */}
              {selectedRequest.reviewNotes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block mb-1">
                    Admin Review Notes:
                  </span>
                  <p className="text-amber-900">{selectedRequest.reviewNotes}</p>
                </div>
              )}

              {/* Payment and Transaction */}
              {selectedRequest.transaction && (
                <div className="p-3.5 bg-white rounded-xl border border-[#E8E1D4] space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#C89B3C] font-mono">
                    Transaction &amp; Settlement
                  </span>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-xs font-bold text-[#07111F]">
                        {selectedRequest.transaction.txnNo}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">
                        Status: {selectedRequest.transaction.status}
                      </p>
                    </div>
                    {selectedRequest.transaction.receipt && (
                      <Link
                        href={`/receipt/${selectedRequest.transaction.receipt.id}`}
                        target="_blank"
                      >
                        <Button
                          size="sm"
                          className="h-7 text-xs bg-[#07111F] text-[#D9B45B] hover:bg-[#07111F]/90"
                        >
                          Official Receipt
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              className="rounded-xl border-[#E8E1D4]"
            >
              Close
            </Button>
            {selectedRequest &&
              (selectedRequest.status === "PENDING" ||
                selectedRequest.status === "UNDER_REVIEW") && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setRejectingRequest(selectedRequest);
                      setRejectReason("");
                    }}
                    className="rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() =>
                      handleReviewAction(selectedRequest.id, "approve")
                    }
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Approve Request
                  </Button>
                </>
              )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: REJECT CONFIRMATION */}
      <Dialog
        open={!!rejectingRequest}
        onOpenChange={(open) => !open && setRejectingRequest(null)}
      >
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#07111F]">
              Reject Purchase Request {rejectingRequest?.requestNo}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              The property will remain available for sale. Provide an explanation for the buyer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-semibold text-[#07111F]">
              Reason for Rejection
            </Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Price offer below minimum reserve, buyer document unverified..."
              className="min-h-[100px] border-[#E8E1D4] rounded-xl bg-white text-xs"
              maxLength={2000}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectingRequest(null)}
              className="rounded-xl border-[#E8E1D4]"
            >
              Cancel
            </Button>
            <Button
              disabled={!rejectReason.trim() || busyId === rejectingRequest?.id}
              onClick={() =>
                handleReviewAction(
                  rejectingRequest.id,
                  "reject",
                  rejectReason.trim()
                )
              }
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: CUSTOMER PROFILE SNAPSHOT */}
      <Dialog
        open={!!customerModal}
        onOpenChange={(open) => !open && setCustomerModal(null)}
      >
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-[#07111F] text-[#D9B45B] flex items-center justify-center font-bold text-base mb-2">
              <User className="w-5 h-5" />
            </div>
            <DialogTitle className="font-serif text-[#07111F]">
              {customerModal?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Registered Real Estate Customer
            </DialogDescription>
          </DialogHeader>

          {customerModal && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-2">
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Email Address</span>
                  <span className="font-semibold text-[#07111F]">{customerModal.email}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Phone Number</span>
                  <span className="font-semibold text-[#07111F]">
                    {customerModal.phone || "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[11px]">Customer ID</span>
                  <span className="font-mono text-[11px] text-[#6B7280]">{customerModal.id}</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Link href={`/admin/users?role=CUSTOMER&q=${customerModal.email}`}>
                  <Button
                    size="sm"
                    className="h-8 text-xs bg-[#07111F] text-[#D9B45B] hover:bg-[#07111F]/90 rounded-xl"
                  >
                    View in User Directory
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
