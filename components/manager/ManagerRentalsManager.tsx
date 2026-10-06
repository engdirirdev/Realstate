"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  PlusCircle,
  KeyRound,
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  User,
  Building2,
  Receipt,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

const RENTAL_TABS = ["ALL", "PENDING", "APPROVED", "ACTIVE", "EXPIRED", "REJECTED", "CANCELLED"] as const;

export default function ManagerRentalsManager() {
  const [tab, setTab] = useState<string>("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ items: any[]; total: number; totalPages: number }>({
    items: [],
    total: 0,
    totalPages: 1,
  });

  // Action states
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejectingReq, setRejectingReq] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // Create Rental Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [myProperties, setMyProperties] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);

  // Form state
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rentAmount, setRentAmount] = useState<string>("");
  const [securityDeposit, setSecurityDeposit] = useState<string>("0");
  const [paymentStatus, setPaymentStatus] = useState<"PENDING" | "PAID">("PENDING");
  const [rentalNotes, setRentalNotes] = useState("");

  const loadRentals = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ kind: "rental", status: tab, page: String(page) });
      if (q.trim()) sp.set("q", q.trim());
      const res = await fetch(`/api/requests?${sp}`);
      const json = await res.json();
      if (json.success) {
        setData({ items: json.items, total: json.total, totalPages: json.totalPages });
      } else {
        toast({ title: "Could not load rentals", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Could not load rentals.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tab, page, q]);

  useEffect(() => {
    const t = setTimeout(loadRentals, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadRentals, q]);

  // Load properties and customers when opening Create Rental modal
  const openCreateModal = async () => {
    setCreateModalOpen(true);
    try {
      const [propsRes, custRes] = await Promise.all([
        fetch("/api/properties?mode=my-properties"),
        fetch("/api/customers"),
      ]);
      const propsJson = await propsRes.json();
      const custJson = await custRes.json();
      if (propsJson.success) {
        // Filter properties that are FOR_RENT and not SOLD
        const rentProps = (propsJson.properties || []).filter(
          (p: any) => (p.listingType === "FOR_RENT" || !p.listingType) && p.status !== "SOLD"
        );
        setMyProperties(rentProps);
      }
      if (custJson.success) {
        setCustomers(custJson.customers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePropertyChange = (propId: string) => {
    setSelectedPropertyId(propId);
    const found = myProperties.find((p) => p.id === propId);
    if (found) {
      setRentAmount(String(found.price || ""));
      setSecurityDeposit(String(found.securityDeposit || "0"));
    }
  };

  const handleCreateRentalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyId || !selectedCustomerId || !checkIn || !checkOut) {
      toast({ title: "Missing fields", description: "Please complete all required fields.", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/rentals/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          customerId: selectedCustomerId,
          startDate: checkIn,
          endDate: checkOut,
          rentAmount: rentAmount ? Number(rentAmount) : undefined,
          securityDeposit: securityDeposit ? Number(securityDeposit) : undefined,
          paymentStatus,
          notes: rentalNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: "Rental Created Successfully! 🎉",
          description: `Agreement ${json.request?.requestNo || ""} is now on record.`,
        });
        setCreateModalOpen(false);
        // Reset form
        setSelectedPropertyId("");
        setSelectedCustomerId("");
        setCheckIn("");
        setCheckOut("");
        setRentAmount("");
        setSecurityDeposit("0");
        setRentalNotes("");
        loadRentals();
      } else {
        toast({ title: "Failed to create rental", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to create rental.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleReviewAction = async (rental: any, action: "approve" | "reject", notes?: string) => {
    setBusyId(rental.id);
    try {
      const res = await fetch(`/api/requests/rental/${rental.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title: action === "approve" ? "Rental booking approved! Tenant can now pay." : "Rental booking rejected.",
        });
        setRejectingReq(null);
        setRejectReason("");
        loadRentals();
      } else {
        toast({ title: "Action failed", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to update rental.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

  return (
    <div className="space-y-6">
      {/* Header bar with tabs & Create Rental Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {RENTAL_TABS.map((t) => {
            const isActive = tab === t;
            return (
              <button
                key={t}
                onClick={() => {
                  setTab(t);
                  setPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                  isActive
                    ? "bg-[#07111F] text-[#D9B45B] border-[#07111F]"
                    : "bg-[#FCFBF7] text-[#6B7280] hover:text-[#07111F] border-[#E8E1D4]"
                }`}
              >
                {t.replace(/_/g, " ")}
              </button>
            );
          })}
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold rounded-xl gap-2 shadow-sm hover:brightness-105 border-0 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="h-4 w-4" /> Create Rental Directly
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search rentals by agreement no., property title, or customer name..."
          className="pl-9.5 h-10 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-xs"
        />
      </div>

      {/* Rentals Table */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-[#6B7280] text-xs gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C]" /> Loading rental agreements...
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <Inbox className="h-10 w-10 text-[#C89B3C] opacity-70" />
            <p className="text-sm font-bold text-[#07111F]">No rental agreements found</p>
            <p className="text-xs text-[#6B7280]">Customer rental requests and direct rentals will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F3EA] text-[#6B7280] uppercase text-[10px] tracking-wider border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left p-3.5">Agreement #</th>
                  <th className="text-left p-3.5">Property</th>
                  <th className="text-left p-3.5">Customer</th>
                  <th className="text-left p-3.5">Rental Period</th>
                  <th className="text-left p-3.5">Total Rent</th>
                  <th className="text-left p-3.5">Status</th>
                  <th className="text-left p-3.5">Payment</th>
                  <th className="text-right p-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {data.items.map((r) => {
                  const paid = r.transaction?.payments?.[0]?.status === "PAID";
                  const canReview = r.status === "PENDING" || r.status === "UNDER_REVIEW";
                  return (
                    <tr key={r.id} className="hover:bg-[#F7F3EA]/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-[#07111F]">
                        {r.requestNo}
                        <p className="text-[10px] text-[#6B7280] font-sans font-normal">{fmt(r.createdAt)}</p>
                      </td>
                      <td className="p-3.5">
                        <Link href={`/properties/${r.property?.id}`} className="font-semibold text-[#07111F] hover:text-[#C89B3C]" target="_blank">
                          {r.property?.title}
                        </Link>
                        <p className="text-[10px] text-[#6B7280]">{r.property?.city}</p>
                      </td>
                      <td className="p-3.5">
                        <p className="font-semibold text-[#07111F]">{r.customer?.name}</p>
                        <p className="text-[10px] text-[#6B7280]">{r.customer?.email}</p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <p className="font-medium text-[#07111F]">{fmt(r.startDate)} → {fmt(r.endDate)}</p>
                        <p className="text-[10px] text-[#6B7280]">{r.periods} × {r.rentalPeriod?.toLowerCase()}</p>
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-bold text-[#07111F]">
                        {formatPrice(r.totalAmount)}
                        {r.securityDeposit > 0 && (
                          <p className="text-[10px] font-normal text-[#6B7280]">incl. {formatPrice(r.securityDeposit)} dep.</p>
                        )}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          paid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {paid ? "PAID" : "PENDING"}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {r.transaction?.receipt && (
                            <Link href={`/receipt/${r.transaction.receipt.id}`} target="_blank">
                              <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-[#E8E1D4]">
                                Receipt
                              </Button>
                            </Link>
                          )}
                          {canReview && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyId === r.id}
                                onClick={() => handleReviewAction(r, "approve")}
                                className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg gap-1"
                              >
                                {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === r.id}
                                onClick={() => setRejectingReq(r)}
                                className="h-7 text-[10px] border-red-200 text-red-600 hover:bg-red-50 rounded-lg gap-1"
                              >
                                <XCircle className="h-3 w-3" /> Reject
                              </Button>
                            </>
                          )}
                          {!canReview && (
                            <Link href={`/properties/${r.property?.id}`} target="_blank">
                              <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg border-[#E8E1D4] text-[#6B7280]">
                                <Eye className="h-3 w-3" /> View
                              </Button>
                            </Link>
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

      {/* Reject Dialog */}
      <Dialog open={!!rejectingReq} onOpenChange={(o) => !o && setRejectingReq(null)}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#07111F]">Reject Rental Request</DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Explain the reason for rejecting agreement {rejectingReq?.requestNo}. The customer will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            <Label className="text-xs font-semibold text-[#07111F]">Rejection Reason</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Property already under contract for those dates or verification required..."
              className="min-h-[80px] bg-white rounded-xl text-xs border-[#E8E1D4]"
            />
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={() => setRejectingReq(null)} className="rounded-xl border-[#E8E1D4]">
              Cancel
            </Button>
            <Button
              disabled={!rejectReason.trim() || busyId === rejectingReq?.id}
              onClick={() => handleReviewAction(rejectingReq, "reject", rejectReason)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Rental Directly Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-lg bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-bold text-[#07111F] flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[#C89B3C]" /> Create Direct Rental Agreement
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Create an official rental agreement directly for a customer. The property availability will be automatically updated.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRentalSubmit} className="space-y-4 mt-2">
            {/* Select Property */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#07111F]">Select Property *</Label>
              <select
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E1D4] bg-white text-[#07111F]"
                required
              >
                <option value="">-- Choose Rental Property --</option>
                {myProperties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (${p.price?.toLocaleString()} / {p.rentPeriod || "MONTHLY"}) - {p.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Select Customer */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#07111F]">Select Customer *</Label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E1D4] bg-white text-[#07111F]"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) {c.phone ? `• ${c.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Check-in and Check-out */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#07111F]">Check-in Date *</Label>
                <Input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-white rounded-xl text-xs h-9 border-[#E8E1D4]"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#07111F]">Check-out Date *</Label>
                <Input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-white rounded-xl text-xs h-9 border-[#E8E1D4]"
                  required
                />
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#07111F]">Rent Rate ($)</Label>
                <Input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  placeholder="Rent per period"
                  className="bg-white rounded-xl text-xs h-9 border-[#E8E1D4]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#07111F]">Security Deposit ($)</Label>
                <Input
                  type="number"
                  value={securityDeposit}
                  onChange={(e) => setSecurityDeposit(e.target.value)}
                  placeholder="Deposit"
                  className="bg-white rounded-xl text-xs h-9 border-[#E8E1D4]"
                />
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#07111F]">Payment Status</Label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E8E1D4] bg-white text-[#07111F]"
              >
                <option value="PENDING">Pending (Tenant will pay later)</option>
                <option value="PAID">Paid (Cash / Direct settlement completed - Property marks RENTED)</option>
              </select>
            </div>

            {/* Notes */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#07111F]">Notes / Special Conditions</Label>
              <Textarea
                value={rentalNotes}
                onChange={(e) => setRentalNotes(e.target.value)}
                placeholder="Optional lease agreement notes..."
                className="bg-white rounded-xl text-xs min-h-[60px] border-[#E8E1D4]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)} className="rounded-xl border-[#E8E1D4]">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold rounded-xl gap-2 hover:brightness-105 border-0"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                Create Rental
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
