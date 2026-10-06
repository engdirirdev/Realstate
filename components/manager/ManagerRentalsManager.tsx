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
  MapPin,
  Phone,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function getInitials(name?: string | null): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
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
  const [viewModalTarget, setViewModalTarget] = useState<any | null>(null);

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
              <thead className="bg-[#FAF6EC] text-[#475569] uppercase text-[10px] font-bold tracking-wider border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left py-3.5 pl-4 pr-3">Agreement #</th>
                  <th className="text-left py-3.5 px-3">Property</th>
                  <th className="text-left py-3.5 px-3">Customer</th>
                  <th className="text-left py-3.5 px-3">Rental Period</th>
                  <th className="text-left py-3.5 px-3">Total Rent</th>
                  <th className="text-left py-3.5 px-3">Status</th>
                  <th className="text-left py-3.5 px-3">Payment</th>
                  <th className="text-right py-3.5 pl-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]/80">
                {data.items.map((r) => {
                  const paid = r.transaction?.payments?.[0]?.status === "PAID";
                  const canReview = r.status === "PENDING" || r.status === "UNDER_REVIEW";
                  return (
                    <tr key={r.id} className="hover:bg-[#FAF6EC]/70 transition-colors align-middle">
                      {/* Agreement # */}
                      <td className="py-3.5 pl-4 pr-3 align-middle">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F]/5 border border-[#E8E1D4] text-[#07111F] font-mono font-bold text-xs tracking-tight shadow-2xs">
                          <FileText className="h-3 w-3 text-[#C89B3C] shrink-0" />
                          <span>{r.requestNo}</span>
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-1 flex items-center gap-1 pl-0.5">
                          <Clock className="h-2.5 w-2.5 text-[#C89B3C]" />
                          <span>{fmt(r.createdAt)}</span>
                        </div>
                      </td>

                      {/* Property */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#07111F] to-[#1E293B] border border-[#E8E1D4] shrink-0 flex items-center justify-center shadow-2xs">
                            {r.property?.images?.[0]?.url ? (
                              <img
                                src={r.property.images[0].url}
                                alt={r.property?.title || "Property"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-[#C89B3C]" />
                            )}
                          </div>
                          <div className="min-w-0 max-w-[220px] space-y-0.5">
                            <Link
                              href={`/properties/${r.property?.id || ""}`}
                              className="font-bold text-xs text-[#07111F] hover:text-[#C89B3C] transition-colors truncate block"
                              target="_blank"
                              title={r.property?.title}
                            >
                              {r.property?.title || "Untitled Property"}
                            </Link>
                            <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                              <MapPin className="h-3 w-3 text-[#C89B3C] shrink-0" />
                              <span className="truncate">{r.property?.city || "Location on file"}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-3 align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#07111F] to-[#1E293B] text-[#D9B45B] border border-[#C89B3C]/30 flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                            {getInitials(r.customer?.name)}
                          </div>
                          <div className="min-w-0 space-y-0.5">
                            <p className="font-semibold text-xs text-[#07111F] truncate">{r.customer?.name || "Anonymous Client"}</p>
                            <p className="text-[11px] text-[#64748B] truncate">{r.customer?.email || "No email"}</p>
                            {r.customer?.phone && (
                              <p className="text-[10px] font-mono font-medium text-[#8C6D23] flex items-center gap-1">
                                <Phone className="h-2.5 w-2.5 text-[#C89B3C]" />
                                <span>{r.customer.phone}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Rental Period */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#07111F]">
                          <Calendar className="h-3.5 w-3.5 text-[#C89B3C] shrink-0" />
                          <span>{fmt(r.startDate)} → {fmt(r.endDate)}</span>
                        </div>
                        <div className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1.5 pl-5">
                          <span className="px-1.5 py-0.5 rounded bg-[#FAF6EC] border border-[#E8DEC8] text-[#8C6D23] font-bold">
                            {r.periods}× {r.rentalPeriod?.toLowerCase()}
                          </span>
                          <span>tenancy</span>
                        </div>
                      </td>

                      {/* Total Rent */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                        <p className="font-serif font-black text-sm text-[#07111F] tracking-tight">
                          {formatPrice(r.totalAmount)}
                        </p>
                        {r.securityDeposit > 0 ? (
                          <p className="text-[10px] font-medium text-[#64748B]">incl. {formatPrice(r.securityDeposit)} dep.</p>
                        ) : (
                          <p className="text-[10px] font-medium text-[#64748B]">Total Contract</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                        {paid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-950 border border-emerald-500/40 shadow-2xs">
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                            PAID / VERIFIED
                          </span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-950 border border-amber-500/40 shadow-2xs">
                              <Clock className="h-3 w-3 text-amber-700" />
                              PENDING VERIFICATION
                            </span>
                            {r.transaction?.payments?.[0]?.transactionRef && (
                              <p className="text-[9px] font-mono text-[#8C6D23] truncate max-w-[130px]">
                                Ref: {r.transaction.payments[0].transactionRef}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View is ALWAYS available for Manager */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewModalTarget(r)}
                            className="h-7 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                          >
                            <Eye className="h-3 w-3 text-[#C89B3C]" /> View
                          </Button>

                          {r.transaction?.receipt && (
                            <Link href={`/receipt/${r.transaction.receipt.id}`} target="_blank">
                              <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium">
                                <Receipt className="h-3 w-3 text-[#C89B3C]" /> Receipt
                              </Button>
                            </Link>
                          )}

                          {canReview && (
                            <>
                              <Button
                                size="sm"
                                disabled={busyId === r.id}
                                onClick={() => handleReviewAction(r, "approve")}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg gap-1 cursor-pointer shadow-2xs"
                              >
                                {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === r.id}
                                onClick={() => setRejectingReq(r)}
                                className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 bg-red-50/40 rounded-lg gap-1 cursor-pointer"
                              >
                                <XCircle className="h-3 w-3" /> Reject
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

      {/* View Booking Details Modal */}
      <Dialog open={!!viewModalTarget} onOpenChange={(o) => !o && setViewModalTarget(null)}>
        <DialogContent className="max-w-lg bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#A97918]">#{viewModalTarget?.requestNo}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#07111F] text-[#D9B45B]">
                Rental Booking
              </span>
            </div>
            <DialogTitle className="font-serif text-lg text-[#07111F] flex items-center gap-2 mt-1">
              <KeyRound className="h-5 w-5 text-[#C89B3C]" />
              Booking Details &amp; Verification
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Review tenant credentials, dates, pricing, and manual payment verification before approval.
            </DialogDescription>
          </DialogHeader>

          {viewModalTarget && (
            <div className="space-y-4 mt-2 text-xs">
              {/* Property Details */}
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#07111F] overflow-hidden shrink-0">
                  <img
                    src={viewModalTarget.property?.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"}
                    alt={viewModalTarget.property?.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[#07111F] truncate">{viewModalTarget.property?.title}</h4>
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#C89B3C]" />
                    {viewModalTarget.property?.city || viewModalTarget.property?.location}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="p-3 bg-[#FAF6EC] rounded-xl border border-[#E8DEC8] space-y-1">
                <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Tenant Information</span>
                <p className="font-bold text-xs text-[#07111F]">{viewModalTarget.customer?.name}</p>
                <p className="text-[11px] text-[#64748B]">{viewModalTarget.customer?.email}</p>
                {viewModalTarget.customer?.phone && (
                  <p className="text-[10px] font-mono text-[#8C6D23] font-semibold">{viewModalTarget.customer.phone}</p>
                )}
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-xl border border-[#E8E1D4]">
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Booking Status</span>
                  <span className="font-bold text-xs text-[#07111F]">{viewModalTarget.status}</span>
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Payment Status</span>
                  <span className="font-bold text-xs text-[#8C6D23]">
                    {viewModalTarget.transaction?.payments?.[0]?.status === "PAID"
                      ? "PAID / VERIFIED"
                      : "PENDING VERIFICATION"}
                  </span>
                </div>
              </div>

              {/* Tenancy Dates */}
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-2">
                <h5 className="font-bold text-[#07111F] text-xs">Tenancy Duration</h5>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#6B7280] block">Check-in:</span>
                    <span className="font-semibold text-[#07111F]">{fmt(viewModalTarget.startDate)}</span>
                  </div>
                  <div>
                    <span className="text-[#6B7280] block">Check-out:</span>
                    <span className="font-semibold text-[#07111F]">{fmt(viewModalTarget.endDate)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#E8E1D4] flex justify-between text-[11px]">
                  <span className="text-[#6B7280]">Contract Duration:</span>
                  <span className="font-semibold text-[#07111F]">
                    {viewModalTarget.periods}× {viewModalTarget.rentalPeriod?.toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-1.5 text-[11px]">
                <h5 className="font-bold text-[#07111F] text-xs mb-2">Financial Breakdown</h5>
                <div className="flex justify-between text-[#6B7280]">
                  <span>Rent Amount:</span>
                  <span className="font-semibold text-[#07111F]">{formatPrice(viewModalTarget.rentAmount)}</span>
                </div>
                {viewModalTarget.securityDeposit > 0 && (
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Security Deposit:</span>
                    <span className="font-semibold text-[#07111F]">{formatPrice(viewModalTarget.securityDeposit)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1.5 border-t border-[#E8E1D4] font-bold text-xs text-[#07111F]">
                  <span>Total Due:</span>
                  <span className="font-serif text-[#C89B3C] text-sm">{formatPrice(viewModalTarget.totalAmount)}</span>
                </div>
              </div>

              {/* Payment Verification Data */}
              {viewModalTarget.transaction?.payments?.[0] && (
                <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-2 text-[11px]">
                  <h5 className="font-bold text-[#07111F] text-xs">Payment Verification Data</h5>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Payment Method:</span>
                    <span className="font-bold text-[#07111F]">{viewModalTarget.transaction.payments[0].paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Transaction Reference:</span>
                    <span className="font-mono font-bold text-[#8C6D23]">{viewModalTarget.transaction.payments[0].transactionRef}</span>
                  </div>
                </div>
              )}

              {/* Review notes */}
              {viewModalTarget.reviewNotes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px]">
                  <span className="font-bold text-amber-900 block mb-0.5">Review Notes:</span>
                  <p className="text-amber-800 italic">&ldquo;{viewModalTarget.reviewNotes}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-2 flex items-center justify-between">
            <Button variant="outline" onClick={() => setViewModalTarget(null)} className="rounded-xl border-[#E8E1D4]">
              Close
            </Button>
            {viewModalTarget && (viewModalTarget.status === "PENDING" || viewModalTarget.status === "UNDER_REVIEW") && (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const t = viewModalTarget;
                    setViewModalTarget(null);
                    setRejectingReq(t);
                  }}
                  className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    const t = viewModalTarget;
                    setViewModalTarget(null);
                    handleReviewAction(t, "approve");
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve Booking
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
