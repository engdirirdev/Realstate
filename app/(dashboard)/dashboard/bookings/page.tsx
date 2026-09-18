// ================================================================
// PAGE NAME  : Manager Dashboard — Booking Requests
// ROUTE      : /dashboard/bookings
// DESCRIPTION: View customer booking requests & confirm or cancel
// ROLE       : USER / Manager
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { Calendar, Building2, MapPin, CheckCircle2, XCircle, Clock, Loader2, CreditCard } from "lucide-react";
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
    <div className="space-y-6 bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
            <Calendar className="h-6 w-6 text-[#10B981]" /> Customer Booking &amp; Visit Requests
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Review scheduled on-site property viewings and confirmed reservations.</p>
        </div>

        <div className="flex items-center gap-2">
          {["ALL", "PENDING", "CONFIRMED", "CANCELLED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filter === f
                  ? "bg-[#10B981] text-white shadow-sm"
                  : "bg-white text-[#64748B] hover:bg-[#F1F5F9] border border-[#E2E8F0]"
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-card">
          <p className="text-xs font-semibold text-[#64748B]">Confirmed Visits</p>
          <p className="text-2xl font-bold text-[#059669] mt-0.5">{confirmedCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-card">
          <p className="text-xs font-semibold text-[#64748B]">Pending Responses</p>
          <p className="text-2xl font-bold text-[#F59E0B] mt-0.5">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-card col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-[#64748B]">Total Requests</p>
          <p className="text-2xl font-bold text-[#0F172A] mt-0.5">{bookings.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <p className="text-sm font-semibold text-[#0F172A]">Loading booking requests...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <Calendar className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No bookings found</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto">
            {filter === "ALL" ? "When customers reserve your properties, their booking requests will appear here." : `No bookings match the "${filter.toLowerCase()}" filter.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <div key={b.id} className="bg-white rounded-2xl p-6 shadow-card border border-[#E2E8F0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-base">{b.property?.title}</h3>
                  <p className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                    Customer: <span className="font-semibold text-[#0F172A]">{b.customer?.name}</span> ({b.customer?.email})
                    • Value: <span className="font-bold text-[#059669]">{formatPrice(b.totalPrice)}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    b.status === "CONFIRMED"
                      ? "bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]"
                      : b.status === "CANCELLED"
                      ? "bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]"
                      : "bg-[#FEF9C3] text-[#92400E] border border-[#FDE68A]"
                  }`}>
                    {b.status}
                  </span>

                  {b.status === "PENDING" && (
                    <div className="flex items-center gap-1.5">
                      <Button
                        onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                        disabled={updatingId === b.id}
                        size="sm"
                        className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs gap-1 font-semibold"
                      >
                        {updatingId === b.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                        Confirm
                      </Button>
                      <Button
                        onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                        disabled={updatingId === b.id}
                        variant="outline"
                        size="sm"
                        className="border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2] rounded-xl text-xs gap-1 font-semibold"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {b.notes && (
                <div className="bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] text-xs text-[#334155]">
                  <span className="font-semibold text-[#0F172A]">Customer Notes:</span> "{b.notes}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
