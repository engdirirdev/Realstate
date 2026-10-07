"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Loader2,
  XCircle,
  Building2,
  Calendar,
  CreditCard,
  Inbox,
  AlertCircle,
  Clock,
  ArrowRight,
  Receipt,
  User,
  CheckCircle2,
  Eye,
  Info,
  MapPin,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "@/components/transactions/StatusBadge";

type RequestType = "ALL" | "RENTAL" | "PURCHASE";

export default function CustomerRequestsView() {
  const [filter, setFilter] = useState<RequestType>("ALL");
  const [loading, setLoading] = useState(true);
  const [rentalRequests, setRentalRequests] = useState<any[]>([]);
  const [purchaseRequests, setPurchaseRequests] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<any | null>(null);
  const [viewBookingTarget, setViewBookingTarget] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rentRes, purRes] = await Promise.all([
        fetch("/api/requests?kind=rental&mode=bookings&pageSize=50").then((r) => r.json()),
        fetch("/api/requests?kind=purchase&pageSize=50").then((r) => r.json()),
      ]);

      if (rentRes.success) setRentalRequests(rentRes.items || []);
      if (purRes.success) setPurchaseRequests(purRes.items || []);
    } catch {
      toast({
        title: "Network error",
        description: "Failed to load requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const cancelRequest = async (kind: "rental" | "purchase", id: string) => {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Request cancelled successfully" });
        loadData();
      } else {
        toast({ title: "Error", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Failed to cancel request.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const handlePay = async () => {
    if (!payTarget) return;
    setBusyId(payTarget.id);
    try {
      const res = await fetch(`/api/transactions/${payTarget.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethod: "SANDBOX" }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Payment completed!", description: `Receipt #${json.receiptNo} created.` });
        setPayTarget(null);
        loadData();
      } else {
        toast({ title: "Payment failed", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Payment error", description: "Payment processing failed.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const getBookingStatus = (item: any): string => {
    if (item._kind === "RENTAL") {
      if (item.bookingStatus) return item.bookingStatus;
      if (item.status === "ACTIVE") return "APPROVED";
      return item.status;
    }
    return item.status;
  };

  const allItems = [
    ...rentalRequests.map((r) => ({ ...r, _kind: "RENTAL" })),
    ...purchaseRequests.map((p) => ({ ...p, _kind: "PURCHASE" })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayedItems = allItems.filter((item) => {
    if (filter === "RENTAL") return item._kind === "RENTAL";
    if (filter === "PURCHASE") return item._kind === "PURCHASE";
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1 shadow-2xs">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "ALL"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            All Requests ({allItems.length})
          </button>
          <button
            onClick={() => setFilter("RENTAL")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "RENTAL"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Rental Bookings ({rentalRequests.length})
          </button>
          <button
            onClick={() => setFilter("PURCHASE")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              filter === "PURCHASE"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Purchase Requests ({purchaseRequests.length})
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-sm text-[#6B7280] bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-6 w-6 animate-spin text-[#C89B3C]" />
          <span>Loading your requests...</span>
        </div>
      ) : displayedItems.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto shadow-xs">
          <Inbox className="h-10 w-10 text-[#C89B3C] mx-auto mb-3 opacity-60" />
          <h3 className="font-serif font-bold text-[#07111F] text-base">No requests found</h3>
          <p className="text-xs text-[#6B7280] mt-1.5 mb-6">
            You don&apos;t have any {filter !== "ALL" ? filter.toLowerCase() : ""} requests yet. Browse our verified listings to book or purchase.
          </p>
          <Link
            href="/customer/properties"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-105 shadow-xs"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayedItems.map((item) => {
            const isRental = item._kind === "RENTAL";
            const cancellable = ["PENDING", "UNDER_REVIEW", "PAYMENT_PENDING"].includes(item.status);
            const amount = isRental ? item.totalAmount : item.salePrice;
            const propertyImage =
              item.property?.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";

            // Extract payment info
            const paymentRecord = item.transaction?.payments?.[0];
            const paymentStatus = paymentRecord?.status;
            const isPendingPayment = paymentStatus === "PENDING";
            const isPaidPayment = paymentStatus === "PAID";

            return (
              <div
                key={item.id}
                className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-5 shadow-xs hover:border-[#C89B3C]/50 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Kind Badge & Distinct Status Badges */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                        isRental
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-blue-100 text-blue-900 border border-blue-300"
                      }`}
                    >
                      {isRental ? "Rental Booking" : "Purchase Request"}
                    </span>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Booking Status Badge */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
                        Booking: {getBookingStatus(item)}
                      </span>

                      {/* Payment Status Badge */}
                      {isRental && paymentRecord && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                            isPaidPayment
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : isPendingPayment
                              ? "bg-amber-50 text-amber-900 border-amber-300"
                              : "bg-red-50 text-red-800 border-red-300"
                          }`}
                        >
                          {isPaidPayment ? (
                            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          ) : isPendingPayment ? (
                            <Clock className="h-3 w-3 text-amber-600" />
                          ) : null}
                          Payment: {isPaidPayment ? "PAID / VERIFIED" : isPendingPayment ? "PENDING VERIFICATION" : paymentStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Property Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#07111F] flex-shrink-0 border border-[#E8E1D4]">
                      <img
                        src={propertyImage}
                        alt={item.property?.title || "Property"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-mono font-bold text-[#A97918]">
                        #{item.requestNo}
                      </p>
                      <h4 className="font-serif font-bold text-sm text-[#07111F] truncate hover:text-[#C89B3C]">
                        <Link href={`/customer/properties/${item.property?.id}`}>
                          {item.property?.title || "Property"}
                        </Link>
                      </h4>
                      <p className="text-xs text-[#6B7280]">
                        {item.property?.city || item.property?.location || "Somalia"}
                      </p>
                    </div>
                  </div>

                  {/* Required User Message for Pending Booking */}
                  {isRental && item.status === "PENDING" && (
                    <div className="mb-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex items-start gap-2 text-xs">
                      <Info className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                      <p className="font-medium text-[11px] leading-relaxed">
                        Your payment has been submitted and your booking is waiting for Manager approval.
                      </p>
                    </div>
                  )}

                  {/* Request Specific Details */}
                  <div className="bg-[#F7F3EA] rounded-xl p-3 border border-[#E8E1D4] space-y-2 text-xs mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-[#6B7280]">Total Amount:</span>
                      <span className="font-serif font-bold text-[#07111F]">
                        {formatPrice(amount)}
                      </span>
                    </div>

                    {isRental && (
                      <>
                        <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                          <span>Check-in / Check-out:</span>
                          <span className="font-medium text-[#07111F]">
                            {item.startDate ? new Date(item.startDate).toLocaleDateString() : "—"} →{" "}
                            {item.endDate ? new Date(item.endDate).toLocaleDateString() : "—"}
                          </span>
                        </div>
                        {paymentRecord?.paymentMethod && (
                          <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                            <span>Payment Method:</span>
                            <span className="font-bold text-[#07111F]">{paymentRecord.paymentMethod}</span>
                          </div>
                        )}
                        {paymentRecord?.transactionRef && (
                          <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                            <span>Transaction Ref:</span>
                            <span className="font-mono text-[#8C6D23] font-semibold">{paymentRecord.transactionRef}</span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                      <span>Submitted Date:</span>
                      <span className="text-[#07111F]">
                        {new Date(item.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {item.manager && (
                      <div className="flex justify-between items-center text-[11px] text-[#6B7280]">
                        <span>Assigned Advisor:</span>
                        <span className="text-[#07111F] font-semibold flex items-center gap-1">
                          <User className="h-3 w-3 text-[#C89B3C]" /> {item.manager.name}
                        </span>
                      </div>
                    )}

                    {item.reviewNotes && (
                      <div className="pt-2 border-t border-[#E8E1D4] text-[11px]">
                        <span className="text-[#6B7280] block font-semibold">Staff Review Note:</span>
                        <span className="text-[#07111F] italic">&ldquo;{item.reviewNotes}&rdquo;</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E1D4]">
                  {/* View Booking Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewBookingTarget(item)}
                    className="rounded-xl text-xs border-[#E8E1D4] hover:bg-[#F7F3EA] text-[#07111F] font-semibold gap-1.5 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#C89B3C]" /> {isRental ? "View Booking" : "View Request"}
                  </Button>

                  {item.status === "PAYMENT_PENDING" && item.transaction && (
                    <Button
                      size="sm"
                      onClick={() => setPayTarget(item.transaction)}
                      className="rounded-xl text-xs bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold gap-1.5 border-0 shadow-xs cursor-pointer"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay Now
                    </Button>
                  )}

                  {item.transaction?.receipt && (
                    <Link href={`/receipt/${item.transaction.receipt.id}`} target="_blank">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs border-[#E8E1D4] gap-1 cursor-pointer font-medium"
                      >
                        <Receipt className="h-3 w-3 text-[#C89B3C]" /> Receipt
                      </Button>
                    </Link>
                  )}

                  {cancellable && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() => cancelRequest(isRental ? "rental" : "purchase", item.id)}
                      className="rounded-xl text-xs border-red-200 text-red-600 hover:bg-red-50 gap-1 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── View Booking Modal (User Section 5) ─── */}
      <Dialog open={!!viewBookingTarget} onOpenChange={(o) => !o && setViewBookingTarget(null)}>
        <DialogContent className="max-w-lg bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#A97918]">
                #{viewBookingTarget?.requestNo}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#07111F] text-[#D9B45B]">
                {viewBookingTarget?._kind === "RENTAL" ? "Rental Booking" : "Purchase Request"}
              </span>
            </div>
            <DialogTitle className="font-serif text-lg text-[#07111F] flex items-center gap-2 mt-1">
              <KeyRound className="h-5 w-5 text-[#C89B3C]" />
              Booking &amp; Payment Record
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Complete rental agreement, payment status, and verification details.
            </DialogDescription>
          </DialogHeader>

          {viewBookingTarget && (
            <div className="space-y-4 mt-2 text-xs">
              {/* Property Card */}
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#07111F] overflow-hidden shrink-0">
                  <img
                    src={viewBookingTarget.property?.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"}
                    alt={viewBookingTarget.property?.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[#07111F] truncate">{viewBookingTarget.property?.title}</h4>
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#C89B3C]" />
                    {viewBookingTarget.property?.city || viewBookingTarget.property?.location}
                  </p>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-2 bg-[#FAF6EC] p-3 rounded-xl border border-[#E8DEC8]">
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Booking Status</span>
                  <span className="font-bold text-xs text-[#07111F]">{getBookingStatus(viewBookingTarget)}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className="font-bold text-xs text-[#8C6D23]">
                    {viewBookingTarget.transaction?.payments?.[0]?.status === "PAID"
                      ? "PAID / VERIFIED"
                      : viewBookingTarget.transaction?.payments?.[0]?.status === "PENDING"
                      ? "PENDING VERIFICATION"
                      : viewBookingTarget.transaction?.payments?.[0]?.status || "PENDING VERIFICATION"}
                  </span>
                </div>
              </div>

              {viewBookingTarget.approvedAt && (
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-[#E8E1D4] text-[11px]">
                  <span className="text-[#6B7280]">Approval Date:</span>
                  <span className="text-[#07111F] font-semibold">
                    {new Date(viewBookingTarget.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Dates & Period (for rental) */}
              {viewBookingTarget._kind === "RENTAL" && (
                <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-2">
                  <h5 className="font-bold text-[#07111F] text-xs">Tenancy Dates</h5>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[#6B7280] block">Check-in:</span>
                      <span className="font-semibold text-[#07111F]">
                        {viewBookingTarget.startDate ? new Date(viewBookingTarget.startDate).toLocaleDateString() : "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#6B7280] block">Check-out:</span>
                      <span className="font-semibold text-[#07111F]">
                        {viewBookingTarget.endDate ? new Date(viewBookingTarget.endDate).toLocaleDateString() : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#E8E1D4] flex justify-between text-[11px]">
                    <span className="text-[#6B7280]">Rental Period:</span>
                    <span className="font-semibold text-[#07111F]">
                      {viewBookingTarget.periods} {viewBookingTarget.rentalPeriod?.toLowerCase()}
                    </span>
                  </div>
                </div>
              )}

              {/* Financial Breakdown */}
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-1.5 text-[11px]">
                <h5 className="font-bold text-[#07111F] text-xs mb-2">Amount Breakdown</h5>
                {viewBookingTarget._kind === "RENTAL" ? (
                  <>
                    <div className="flex justify-between text-[#6B7280]">
                      <span>Rent Amount:</span>
                      <span className="font-semibold text-[#07111F]">{formatPrice(viewBookingTarget.rentAmount)}</span>
                    </div>
                    {viewBookingTarget.securityDeposit > 0 && (
                      <div className="flex justify-between text-[#6B7280]">
                        <span>Security Deposit:</span>
                        <span className="font-semibold text-[#07111F]">{formatPrice(viewBookingTarget.securityDeposit)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1.5 border-t border-[#E8E1D4] font-bold text-xs text-[#07111F]">
                      <span>Total Amount:</span>
                      <span className="font-serif text-[#C89B3C] text-sm">{formatPrice(viewBookingTarget.totalAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between font-bold text-xs text-[#07111F]">
                    <span>Sale Price:</span>
                    <span className="font-serif text-[#C89B3C] text-sm">{formatPrice(viewBookingTarget.salePrice)}</span>
                  </div>
                )}
              </div>

              {/* Payment Method Details */}
              {viewBookingTarget.transaction?.payments?.[0] && (
                <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-2 text-[11px]">
                  <h5 className="font-bold text-[#07111F] text-xs">Payment Information</h5>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Method:</span>
                    <span className="font-bold text-[#07111F]">{viewBookingTarget.transaction.payments[0].paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Transaction Reference:</span>
                    <span className="font-mono font-bold text-[#8C6D23]">{viewBookingTarget.transaction.payments[0].transactionRef}</span>
                  </div>
                  {viewBookingTarget.transaction.payments[0].paidAt && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Verified At:</span>
                      <span className="text-[#07111F]">{new Date(viewBookingTarget.transaction.payments[0].paidAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Notes */}
              {viewBookingTarget.reviewNotes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px]">
                  <span className="font-bold text-amber-900 block mb-0.5">Manager Review Note:</span>
                  <p className="text-amber-800 italic">&ldquo;{viewBookingTarget.reviewNotes}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button
              variant="outline"
              onClick={() => setViewBookingTarget(null)}
              className="rounded-xl border-[#E8E1D4]"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sandbox Payment Confirmation Modal */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#07111F] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#C89B3C]" /> Pay for Request
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Transaction Reference #{payTarget?.txnNo}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#07111F] border border-[#C89B3C]/30 p-4 rounded-xl space-y-2 text-white">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D9B45B]">
              <span>Official Sandbox Payment Gateway</span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Instantly activates your agreement and automatically issues an official receipt.
            </p>
            <div className="pt-2 border-t border-[#C89B3C]/20 flex justify-between text-xs font-bold">
              <span>Total Amount Due</span>
              <span className="text-sm font-serif text-[#D9B45B]">
                {payTarget ? formatPrice(payTarget.amount) : ""}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayTarget(null)}
              className="rounded-xl border-[#E8E1D4]"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePay}
              disabled={busyId === payTarget?.id}
              className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold border-0"
            >
              {busyId === payTarget?.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm & Pay"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
