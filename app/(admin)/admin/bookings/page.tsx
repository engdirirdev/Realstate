// ================================================================
// PAGE NAME  : Admin Dashboard — Manage Bookings
// ROUTE      : /admin/bookings
// DESCRIPTION: Platform-wide property booking & reservation control
// ROLE       : ADMIN
// ================================================================
"use client";

import { useState, useEffect } from "react";
import { Calendar, CheckCircle2, XCircle, Clock, Building2, User, Loader2, Filter } from "lucide-react";
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
    <div className="space-y-6 bg-[#F8FAFC] min-h-screen p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
            <Calendar className="h-6 w-6 text-[#10B981]" /> Manage All Bookings
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Platform-wide property reservations, visit requests, and booking statuses.</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64748B]">Status Filter:</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 border-[#E2E8F0] rounded-xl bg-white text-xs text-[#0F172A] w-[160px]">
              <SelectValue placeholder="Status Filter" />
            </SelectTrigger>
            <SelectContent className="bg-white border-[#E2E8F0]">
              <SelectItem value="ALL">All Bookings</SelectItem>
              <SelectItem value="PENDING">Pending Review</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#64748B] flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-[#10B981]" />
            <p className="text-sm font-medium">Loading platform bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="font-semibold text-[#0F172A]">No property bookings found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">Property</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Customer</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Manager</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Amount</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Status</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-[#64748B]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#0F172A] flex items-center gap-1.5 text-xs sm:text-sm">
                        <Building2 className="h-4 w-4 text-[#10B981]" /> {b.property?.title}
                      </p>
                      <p className="text-[11px] text-[#64748B]">{b.property?.city}</p>
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-[#0F172A]">
                      <p>{b.customer?.name}</p>
                      <p className="text-[#64748B] font-normal text-[11px]">{b.customer?.email}</p>
                    </td>

                    <td className="px-4 py-4 text-xs font-semibold text-[#0F172A]">
                      <p>{b.manager?.name || "Unassigned"}</p>
                      <p className="text-[#64748B] font-normal text-[11px]">{b.manager?.email || ""}</p>
                    </td>

                    <td className="px-4 py-4 font-bold text-[#059669] text-xs sm:text-sm">
                      {formatPrice(b.totalPrice)}
                    </td>

                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        b.status === "CONFIRMED"
                          ? "bg-[#D1FAE5] text-[#065F46]"
                          : b.status === "PENDING"
                          ? "bg-[#FEF9C3] text-[#92400E]"
                          : b.status === "COMPLETED"
                          ? "bg-[#ECFEFF] text-[#0891B2]"
                          : "bg-[#FEE2E2] text-[#991B1B]"
                      }`}>
                        {b.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status !== "CONFIRMED" && (
                          <Button onClick={() => handleUpdateStatus(b.id, "CONFIRMED")} size="sm" variant="outline" className="h-8 text-xs text-[#065F46] border-[#A7F3D0] rounded-lg">
                            Confirm
                          </Button>
                        )}
                        {b.status !== "COMPLETED" && b.status === "CONFIRMED" && (
                          <Button onClick={() => handleUpdateStatus(b.id, "COMPLETED")} size="sm" variant="outline" className="h-8 text-xs text-[#0891B2] border-[#A5F3FC] rounded-lg">
                            Complete
                          </Button>
                        )}
                        {b.status !== "CANCELLED" && (
                          <Button onClick={() => handleUpdateStatus(b.id, "CANCELLED")} size="sm" variant="outline" className="h-8 text-xs text-[#991B1B] border-[#FCA5A5] rounded-lg">
                            Cancel
                          </Button>
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
