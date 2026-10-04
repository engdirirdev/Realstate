// ================================================================
// PAGE NAME  : Manager Dashboard — Booking Requests
// ROUTE      : /dashboard/bookings
// DESCRIPTION: View customer booking requests & confirm or cancel
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER / Manager
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { Calendar, Building2, MapPin, CheckCircle2, XCircle, Clock, Loader2, CreditCard, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

export default function ManagerBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("ALL");

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load booking requests.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    setUpdatingId(bookingId);
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `Booking ${status}`, description: `Booking status updated to ${status}.` });
        fetchBookings();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update booking status.", variant: "destructive" });
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Visit Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-[#C89B3C]" /> Customer Visit &amp; Booking Requests
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Review scheduled on-site property viewings and confirmed reservations.</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["ALL", "PENDING", "CONFIRMED", "CANCELLED"].map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs border ${
                  isActive
                    ? "bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] border-transparent"
                    : "bg-[#FCFBF7] text-[#6B7280] hover:text-[#07111F] border-[#E8E1D4]"
                }`}
              >
                {f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>
      </div>

      {/* Schedule Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-[#FCFBF7] rounded-2xl p-4 border border-[#E8E1D4] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Confirmed Viewings</p>
          <p className="text-2xl font-serif font-bold text-[#07111F] mt-0.5">{confirmedCount}</p>
        </div>
        <div className="bg-[#FCFBF7] rounded-2xl p-4 border border-[#E8E1D4] shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Pending Responses</p>
          <p className="text-2xl font-serif font-bold text-amber-700 mt-0.5">{pendingCount}</p>
        </div>
        <div className="bg-[#FCFBF7] rounded-2xl p-4 border border-[#E8E1D4] shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total Inquiries</p>
          <p className="text-2xl font-serif font-bold text-[#07111F] mt-0.5">{bookings.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="p-16 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] text-center flex flex-col items-center justify-center gap-3 max-w-lg mx-auto shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="font-serif font-bold text-[#07111F] text-base">Loading Booking Requests...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Calendar className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No bookings found</h2>
          <p className="text-[#6B7280] text-xs mt-1 max-w-sm mx-auto leading-relaxed">
            {filter === "ALL" ? "When clients request viewings for your listings, their reservations will appear here." : `No bookings match the "${filter.toLowerCase()}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div key={b.id} className="bg-[#FCFBF7] rounded-2xl p-6 shadow-sm border border-[#E8E1D4] space-y-4 hover:border-[#C89B3C]/50 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
                <div>
                  <h3 className="font-serif font-bold text-[#07111F] text-base">{b.property?.title}</h3>
                  <p className="text-xs text-[#6B7280] flex items-center gap-2 mt-0.5">
                    Client: <span className="font-semibold text-[#07111F]">{b.customer?.name}</span> ({b.customer?.email})
                    • Portfolio Value: <span className="font-serif font-bold text-[#07111F]">{formatPrice(b.totalPrice)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                    b.status === "CONFIRMED"
                      ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                      : b.status === "CANCELLED"
                      ? "bg-red-500/15 text-red-700 border border-red-500/30"
                      : b.status === "COMPLETED"
                      ? "bg-emerald-500/20 text-emerald-800 border border-emerald-500/40"
                      : "bg-amber-500/15 text-amber-800 border border-amber-500/30"
                  }`}>
                    {b.status === "COMPLETED" && "✓ "}
                    {b.status}
                  </span>

                  {b.status === "PENDING" && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                        disabled={updatingId === b.id}
                        size="sm"
                        className="bg-gradient-to-r from-[#C89B3C] via-[#E8B849] to-[#D9A336] text-[#07111F] hover:brightness-105 rounded-xl text-xs gap-1 font-bold border-0 shadow-xs cursor-pointer"
                      >
                        {updatingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                        disabled={updatingId === b.id}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100 rounded-xl text-xs gap-1 font-medium cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  )}

                  {b.status === "CONFIRMED" && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                        disabled={updatingId === b.id}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1 font-bold shadow-xs cursor-pointer"
                      >
                        {updatingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Complete
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                        disabled={updatingId === b.id}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 bg-red-50/50 hover:bg-red-100 rounded-xl text-xs gap-1 font-medium cursor-pointer"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  )}

                  {b.status === "COMPLETED" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 text-emerald-800 text-xs font-bold border border-emerald-500/30 cursor-default select-none">
                      ✓ Completed
                    </span>
                  )}

                  {b.status === "CANCELLED" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-500/15 text-red-700 text-xs font-bold border border-red-500/30 cursor-default select-none">
                      ✕ Cancelled
                    </span>
                  )}
                </div>
              </div>

              {b.notes && (
                <div className="bg-[#F7F3EA] p-3.5 rounded-xl border border-[#E8E1D4] text-xs text-[#4B5563]">
                  <span className="font-bold text-[#07111F]">Client Inquiry Notes:</span> &ldquo;{b.notes}&rdquo;
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
