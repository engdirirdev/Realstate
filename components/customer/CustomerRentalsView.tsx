"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Key,
  Calendar,
  MapPin,
  User,
  ShieldCheck,
  Receipt,
  Loader2,
  FileCheck2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "@/components/transactions/StatusBadge";
import { PROPERTY_CARD_BLUR_DATA_URL } from "@/lib/image-utils";

type RentalTab = "ACTIVE" | "UPCOMING" | "COMPLETED" | "EXPIRED" | "CANCELLED" | "ALL";

interface CustomerRentalsViewProps {
  initialRentals?: any[];
}

export default function CustomerRentalsView({ initialRentals }: CustomerRentalsViewProps = {}) {
  const [tab, setTab] = useState<RentalTab>("ACTIVE");
  const [loading, setLoading] = useState(initialRentals ? false : true);
  const [rentals, setRentals] = useState<any[]>(initialRentals || []);
  const isInitialMount = useRef(true);

  const loadRentals = useCallback(async () => {
    setLoading(true);
    try {
      // mode=rentals ensures only active/expired/completed/cancelled rental agreements are returned
      const res = await fetch("/api/requests?kind=rental&mode=rentals&pageSize=100");
      const json = await res.json();
      if (json.success) {
        setRentals(json.items || []);
      } else {
        toast({ title: "Failed to load rentals", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Could not load rentals.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialRentals) return;
    }
    loadRentals();
  }, [loadRentals, initialRentals]);

  const now = new Date();

  // Helper to resolve effective rental agreement status
  const getRentalStatus = (r: any): string => {
    if (r.rentalStatus) return r.rentalStatus;
    if (["ACTIVE", "EXPIRED", "COMPLETED", "CANCELLED"].includes(r.status)) return r.status;
    return "ACTIVE";
  };

  const filteredRentals = rentals.filter((r) => {
    const status = getRentalStatus(r);
    // Explicitly exclude any pending booking requests that might slip through
    if (["PENDING", "UNDER_REVIEW", "PAYMENT_PENDING"].includes(r.status) && !r.rentalStatus) {
      return false;
    }

    if (tab === "ALL") return true;
    if (tab === "ACTIVE") {
      return status === "ACTIVE" && (!r.startDate || new Date(r.startDate) <= now) && (!r.endDate || new Date(r.endDate) >= now);
    }
    if (tab === "UPCOMING") {
      return status === "ACTIVE" && r.startDate && new Date(r.startDate) > now;
    }
    if (tab === "COMPLETED") {
      return status === "COMPLETED";
    }
    if (tab === "EXPIRED") {
      return status === "EXPIRED" || (status === "ACTIVE" && r.endDate && new Date(r.endDate) < now);
    }
    if (tab === "CANCELLED") {
      return status === "CANCELLED";
    }
    return true;
  });

  const activeCount = rentals.filter((r) => {
    const st = getRentalStatus(r);
    return st === "ACTIVE" && (!r.startDate || new Date(r.startDate) <= now) && (!r.endDate || new Date(r.endDate) >= now);
  }).length;

  const upcomingCount = rentals.filter((r) => {
    const st = getRentalStatus(r);
    return st === "ACTIVE" && r.startDate && new Date(r.startDate) > now;
  }).length;

  const completedCount = rentals.filter((r) => getRentalStatus(r) === "COMPLETED").length;

  const expiredCount = rentals.filter((r) => {
    const st = getRentalStatus(r);
    return st === "EXPIRED" || (st === "ACTIVE" && r.endDate && new Date(r.endDate) < now);
  }).length;

  const cancelledCount = rentals.filter((r) => getRentalStatus(r) === "CANCELLED").length;

  return (
    <div className="space-y-6">
      {/* Category Tabs: ACTIVE, UPCOMING, COMPLETED, EXPIRED, CANCELLED, ALL */}
      <div className="flex flex-wrap items-center gap-2">
        <div role="tablist" aria-label="Rental status filter" className="inline-flex flex-wrap rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1 shadow-2xs">
          <button
            role="tab"
            aria-selected={tab === "ACTIVE"}
            onClick={() => setTab("ACTIVE")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] ${
              tab === "ACTIVE"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            role="tab"
            aria-selected={tab === "UPCOMING"}
            onClick={() => setTab("UPCOMING")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] ${
              tab === "UPCOMING"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            role="tab"
            aria-selected={tab === "COMPLETED"}
            onClick={() => setTab("COMPLETED")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] ${
              tab === "COMPLETED"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            role="tab"
            aria-selected={tab === "EXPIRED"}
            onClick={() => setTab("EXPIRED")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] ${
              tab === "EXPIRED"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Expired ({expiredCount})
          </button>
          <button
            role="tab"
            aria-selected={tab === "CANCELLED"}
            onClick={() => setTab("CANCELLED")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] ${
              tab === "CANCELLED"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            Cancelled ({cancelledCount})
          </button>
          <button
            role="tab"
            aria-selected={tab === "ALL"}
            onClick={() => setTab("ALL")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C89B3C] ${
              tab === "ALL"
                ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
                : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            All Agreements ({rentals.length})
          </button>
        </div>
      </div>

      {/* Rentals List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-sm text-[#6B7280] bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-6 w-6 animate-spin text-[#C89B3C]" />
          <span>Retrieving your active rental agreements...</span>
        </div>
      ) : filteredRentals.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto shadow-xs">
          <Key className="h-10 w-10 text-[#C89B3C] mx-auto mb-3 opacity-60" />
          <h3 className="font-serif font-bold text-[#07111F] text-base">No rentals in this category</h3>
          <p className="text-xs text-[#6B7280] mt-1.5 mb-6">
            You don&apos;t have any {tab !== "ALL" ? tab.toLowerCase() : ""} rental agreements. Explore available luxury properties to book a stay.
          </p>
          <Link
            href="/customer/properties?listingType=FOR_RENT"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:brightness-105 shadow-xs"
          >
            Browse Rental Listings
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredRentals.map((rental) => {
            const propertyImage =
              rental.property?.images?.[0]?.url ||
              "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";
            const effectiveStatus = getRentalStatus(rental);
            const agreementNo = rental.agreementNo || `AGR-${rental.requestNo}`;

            return (
              <div
                key={rental.id}
                className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs hover:border-[#C89B3C]/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Image + Badges */}
                  <div className="relative aspect-[16/9] bg-[#07111F] overflow-hidden">
                    <Image
                      src={propertyImage}
                      alt={rental.property?.title || "Property"}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      placeholder="blur"
                      blurDataURL={PROPERTY_CARD_BLUR_DATA_URL}
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#07111F]/90 text-[#D9B45B] border border-[#C89B3C]/50 backdrop-blur-xs flex items-center gap-1.5">
                        <FileCheck2 className="h-3.5 w-3.5 text-[#C89B3C]" />
                        Rental Agreement
                      </span>
                      <StatusBadge status={effectiveStatus} />
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs bg-black/70 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-[#E8E1D4]">Agreement #</div>
                        <span className="font-mono font-bold text-[#D9B45B]">
                          {agreementNo}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-[#E8E1D4]">Rent</div>
                        <span className="font-serif font-bold text-sm text-white">
                          {formatPrice(rental.rentAmount)} / {rental.rentalPeriod?.toLowerCase() || "month"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="text-[10px] font-mono font-bold text-[#8C6D23] mb-0.5">
                        Booking Ref: #{rental.requestNo}
                      </div>
                      <Link href={`/customer/properties/${rental.property?.id}`}>
                        <h3 className="font-serif font-bold text-base text-[#07111F] hover:text-[#C89B3C] transition-colors line-clamp-1">
                          {rental.property?.title}
                        </h3>
                      </Link>
                      <p className="text-xs text-[#6B7280] flex items-center gap-1.5 mt-1">
                        <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" />
                        <span>{rental.property?.city || rental.property?.location || "Somalia"}</span>
                      </p>
                    </div>

                    {/* Tenancy Specifications */}
                    <div className="bg-[#F7F3EA] rounded-xl p-3.5 border border-[#E8E1D4] space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#E8E1D4]">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                            Start / Move-in
                          </span>
                          <span className="font-bold text-[#07111F] flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3.5 w-3.5 text-[#C89B3C]" />
                            {rental.startDate ? new Date(rental.startDate).toLocaleDateString() : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                            End Date
                          </span>
                          <span className="font-bold text-[#07111F] flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3.5 w-3.5 text-[#C89B3C]" />
                            {rental.endDate ? new Date(rental.endDate).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1 text-[11px]">
                        <span className="text-[#6B7280]">Security Deposit:</span>
                        <span className="font-semibold text-[#07111F]">
                          {rental.securityDeposit ? formatPrice(rental.securityDeposit) : "None"}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-[#6B7280]">Payment Status:</span>
                        <span className="font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md bg-green-100 text-green-800 border border-green-300 flex items-center gap-1">
                          <ShieldCheck className="h-3 w-3 text-green-700" /> PAID / VERIFIED
                        </span>
                      </div>

                      {rental.manager && (
                        <div className="flex justify-between items-center pt-1 border-t border-[#E8E1D4] text-[11px]">
                          <span className="text-[#6B7280]">Managing Advisor:</span>
                          <span className="text-[#07111F] font-semibold flex items-center gap-1">
                            <User className="h-3 w-3 text-[#C89B3C]" /> {rental.manager.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-[#FCFBF7] border-t border-[#E8E1D4] flex items-center justify-between gap-2">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="flex-1 rounded-xl text-xs border-[#E8E1D4] hover:bg-[#F7F3EA]"
                  >
                    <Link href={`/customer/properties/${rental.property?.id}`}>
                      View Property
                    </Link>
                  </Button>

                  {rental.transaction?.receipt && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1 rounded-xl text-xs border-[#C89B3C]/40 text-[#A97918] hover:bg-[#F7F3EA] gap-1"
                    >
                      <Link
                        href={`/receipt/${rental.transaction.receipt.id}`}
                      >
                        <Receipt className="h-3.5 w-3.5 text-[#C89B3C]" /> View Receipt
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
