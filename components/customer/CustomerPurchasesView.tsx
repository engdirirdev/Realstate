"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Building2,
  MapPin,
  Calendar,
  CreditCard,
  Receipt,
  Loader2,
  Inbox,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "@/components/transactions/StatusBadge";

type PurchaseTab = "ALL" | "APPROVED" | "PENDING" | "COMPLETED" | "CANCELLED";

export default function CustomerPurchasesView() {
  const [tab, setTab] = useState<PurchaseTab>("ALL");
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [payTarget, setPayTarget] = useState<any | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/requests?kind=purchase&pageSize=100");
      const json = await res.json();
      if (json.success) {
        setPurchases(json.items || []);
      } else {
        toast({ title: "Failed to load purchases", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Could not load purchases.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPurchases();
  }, [loadPurchases]);

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
        toast({
          title: "Payment successful! 🎊",
          description: `Acquisition complete. Receipt #${json.receiptNo} generated.`,
        });
        setPayTarget(null);
        loadPurchases();
      } else {
        toast({ title: "Payment failed", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Payment processing failed.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const filteredPurchases = purchases.filter((p) => {
    if (tab === "ALL") return true;
    if (tab === "APPROVED") return p.status === "APPROVED" || p.status === "PAYMENT_PENDING";
    if (tab === "PENDING") return p.status === "PENDING" || p.status === "UNDER_REVIEW";
    if (tab === "COMPLETED") return p.status === "COMPLETED";
    if (tab === "CANCELLED") return p.status === "CANCELLED" || p.status === "REJECTED";
    return true;
  });

  const approvedCount = purchases.filter((p) => p.status === "APPROVED" || p.status === "PAYMENT_PENDING").length;
  const pendingCount = purchases.filter((p) => p.status === "PENDING" || p.status === "UNDER_REVIEW").length;
  const completedCount = purchases.filter((p) => p.status === "COMPLETED").length;
  const cancelledCount = purchases.filter((p) => p.status === "CANCELLED" || p.status === "REJECTED").length;

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1 shadow-2xs">
          <button
            onClick={() => setTab("ALL")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "ALL"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            All Purchases ({purchases.length})
          </button>
          <button
            onClick={() => setTab("APPROVED")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "APPROVED"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setTab("PENDING")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "PENDING"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            onClick={() => setTab("COMPLETED")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "COMPLETED"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setTab("CANCELLED")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tab === "CANCELLED"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Closed / Cancelled ({cancelledCount})
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-sm text-[#6B7280] bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-6 w-6 animate-spin text-[#C89B3C]" />
          <span>Retrieving your purchase portfolio...</span>
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto shadow-xs">
          <ShoppingBag className="h-10 w-10 text-[#C89B3C] mx-auto mb-3 opacity-60" />
          <h3 className="font-serif font-bold text-[#07111F] text-base">No purchases found</h3>
          <p className="text-xs text-[#6B7280] mt-1.5 mb-6">
            You don&apos;t have any {tab !== "ALL" ? tab.toLowerCase() : ""} property purchases yet. Explore our for-sale verified inventory.
          </p>
          <Link
            href="/customer/properties?listingType=FOR_SALE"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-105 shadow-xs"
          >
            Browse Properties for Sale
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPurchases.map((purchase) => {
            const propertyImage =
              purchase.property?.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";
            const isCompleted = purchase.status === "COMPLETED";
            const paymentStatus =
              purchase.transaction?.status === "PAID" || isCompleted
                ? "PAID"
                : purchase.status === "PAYMENT_PENDING"
                ? "PENDING"
                : "PENDING_APPROVAL";

            return (
              <div
                key={purchase.id}
                className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs hover:border-[#C89B3C]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Image + Badges */}
                  <div className="relative aspect-[16/9] bg-[#07111F] overflow-hidden">
                    <img
                      src={propertyImage}
                      alt={purchase.property?.title || "Property"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#07111F]/90 text-[#D9B45B] border border-[#C89B3C]/50 backdrop-blur-xs">
                        Property Acquisition
                      </span>
                      <StatusBadge status={purchase.status} />
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs bg-black/60 backdrop-blur-xs p-2 rounded-xl">
                      <span className="font-mono font-bold text-[#D9B45B]">
                        #{purchase.requestNo}
                      </span>
                      <span className="font-serif font-bold text-sm">
                        {formatPrice(purchase.salePrice)}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <Link href={`/customer/properties/${purchase.property?.id}`}>
                        <h3 className="font-serif font-bold text-base text-[#07111F] hover:text-[#C89B3C] transition-colors line-clamp-1">
                          {purchase.property?.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#6B7280] flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" />
                        <span>{purchase.property?.city || purchase.property?.location || "Somalia"}</span>
                      </p>
                    </div>

                    {/* Acquisition Details */}
                    <div className="bg-[#F7F3EA] rounded-xl p-3.5 border border-[#E8E1D4] space-y-2 text-xs">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#6B7280]">Agreed Sale Price:</span>
                        <span className="font-serif font-bold text-sm text-[#07111F]">
                          {formatPrice(purchase.salePrice)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#6B7280]">Request Submitted:</span>
                        <span className="text-[#07111F] font-medium">
                          {new Date(purchase.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#6B7280]">Approval Status:</span>
                        <span className="font-bold text-[#07111F]">{purchase.status}</span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#6B7280]">Payment Status:</span>
                        <span
                          className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${
                            paymentStatus === "PAID"
                              ? "bg-green-100 text-green-800 border border-green-300"
                              : "bg-amber-100 text-amber-800 border border-amber-300"
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      </div>

                      {isCompleted && (
                        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-[#E8E1D4]">
                          <span className="text-[#6B7280]">Completion Date:</span>
                          <span className="font-bold text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                            {new Date(purchase.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                      {purchase.manager && (
                        <div className="flex justify-between items-center pt-1 border-t border-[#E8E1D4] text-[11px]">
                          <span className="text-[#6B7280]">Listing Advisor:</span>
                          <span className="text-[#07111F] font-semibold flex items-center gap-1">
                            <User className="h-3 w-3 text-[#C89B3C]" /> {purchase.manager.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-[#FCFBF7] border-t border-[#E8E1D4] flex items-center justify-between gap-2">
                  <Link href={`/customer/properties/${purchase.property?.id}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full rounded-xl text-xs border-[#E8E1D4] hover:bg-[#F7F3EA]"
                    >
                      View Property
                    </Button>
                  </Link>

                  {(purchase.status === "PAYMENT_PENDING" || (purchase.status === "APPROVED" && purchase.transaction)) && (
                    <Button
                      size="sm"
                      onClick={() => setPayTarget(purchase.transaction)}
                      className="flex-1 rounded-xl text-xs bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold gap-1 border-0 shadow-xs"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay Now
                    </Button>
                  )}

                  {purchase.transaction?.receipt && (
                    <Link
                      href={`/receipt/${purchase.transaction.receipt.id}`}
                      target="_blank"
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-xl text-xs border-[#C89B3C]/40 text-[#A97918] hover:bg-[#F7F3EA] gap-1"
                      >
                        <Receipt className="h-3.5 w-3.5 text-[#C89B3C]" /> Official Receipt
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#07111F] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#C89B3C]" /> Complete Property Purchase
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Transaction Reference #{payTarget?.txnNo}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-[#07111F] border border-[#C89B3C]/30 p-4 rounded-xl space-y-2 text-white">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D9B45B]">
              <ShieldCheck className="h-4 w-4 text-[#C89B3C]" />
              <span>Official Escrow / Acquisition Gateway</span>
            </div>
            <p className="text-xs text-[#94A3B8]">
              Executing payment will close this transaction, mark the property SOLD, and issue the official ownership transfer receipt.
            </p>
            <div className="pt-2 border-t border-[#C89B3C]/20 flex justify-between text-xs font-bold">
              <span>Total Purchase Consideration</span>
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
              {busyId === payTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authorize Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
