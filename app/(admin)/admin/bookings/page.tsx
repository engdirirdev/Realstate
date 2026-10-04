// ================================================================
// PAGE NAME  : Admin Dashboard — Manage Bookings
// ROUTE      : /admin/bookings
// DESCRIPTION: Platform-wide property booking & reservation control
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, XCircle, Clock, Building2, User, Loader2, Filter, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

interface BookingItem {
  id: string;
  totalPrice: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  notes: string | null;
  createdAt: string;
  property: { title: string; city: string; price: number };
  customer: { name: string; email: string };
  manager: { name: string; email: string } | null;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/admin/bookings?${params.toString()}`);
      const data = await res.json();
      if (data.success) setBookings(data.bookings);
    } catch {
      toast({ title: "Error", description: "Failed to load platform bookings.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/bookings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Booking Updated", description: `Status changed to ${newStatus}.` });
        setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: newStatus as any } : b)));
      }
    } catch {
      toast({ title: "Error", description: "Failed to update booking status." });
    }
  };

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Platform Escrow &amp; Viewings
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Calendar className="h-7 w-7 text-[#C89B3C]" /> Platform-Wide Bookings &amp; Visits
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Platform-wide property reservations, visit requests, and booking statuses.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Status Filter:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 border-[#E8E1D4] rounded-xl bg-white text-xs font-semibold text-[#07111F] w-[160px] focus:ring-1 focus:ring-[#C89B3C]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="bg-[#FCFBF7] border-[#E8E1D4]">
              <SelectItem value="ALL">All Bookings</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
            <p className="text-sm font-medium">Loading platform bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center text-[#9CA3AF]">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-[#C89B3C]/40" />
            <p className="font-semibold text-[#07111F]">No property bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Property</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Customer</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Manager</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Amount</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Status</th>
                  <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#07111F] flex items-center gap-1.5 text-xs sm:text-sm">
                        <Building2 className="h-4 w-4 text-[#C89B3C]" /> {b.property?.title}
                      </p>
                      <p className="text-[11px] text-[#6B7280]">{b.property?.city}</p>
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-[#07111F]">
                      <p>{b.customer?.name}</p>
                      <p className="text-[#6B7280] font-normal text-[11px]">{b.customer?.email}</p>
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-[#07111F]">
                      <p>{b.manager?.name || "Unassigned"}</p>
                      <p className="text-[#6B7280] font-normal text-[11px]">{b.manager?.email || ""}</p>
                    </td>

                    <td className="px-4 py-4 font-serif font-bold text-[#07111F] text-xs sm:text-sm">
                      {formatPrice(b.totalPrice)}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${
                        b.status === "CONFIRMED"
                          ? "bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40"
                          : b.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-800 border border-amber-500/30"
                          : b.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-800 border border-emerald-500/40"
                          : "bg-red-500/15 text-red-700 border border-red-500/30"
                      }`}>
                        {b.status === "COMPLETED" && "✓ "}
                        {b.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {b.status === "PENDING" && (
                          <>
                            <Button
                              onClick={() => handleUpdateStatus(b.id, "CONFIRMED")}
                              size="sm"
                              className="h-8 px-3 text-xs bg-gradient-to-r from-[#C89B3C] via-[#E8B849] to-[#D9A336] text-[#07111F] hover:brightness-105 font-bold rounded-xl border-0 shadow-xs cursor-pointer"
                            >
                              Confirm
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs text-red-600 bg-red-50/50 hover:bg-red-100/80 border border-red-200 rounded-xl font-semibold cursor-pointer"
                            >
                              Cancel
                            </Button>
                          </>
                        )}

                        {b.status === "CONFIRMED" && (
                          <>
                            <Button
                              onClick={() => handleUpdateStatus(b.id, "COMPLETED")}
                              size="sm"
                              className="h-8 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                            >
                              Complete
                            </Button>
                            <Button
                              onClick={() => handleUpdateStatus(b.id, "CANCELLED")}
                              size="sm"
                              variant="outline"
                              className="h-8 px-3 text-xs text-red-600 bg-red-50/50 hover:bg-red-100/80 border border-red-200 rounded-xl font-semibold cursor-pointer"
                            >
                              Cancel
                            </Button>
                          </>
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
