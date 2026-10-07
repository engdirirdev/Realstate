"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  FileText,
  Building2,
  MapPin,
  Phone,
  Calendar,
  Clock,
  Receipt,
  User,
  KeyRound,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
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
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

function getInitials(name?: string | null): string {
  if (!name) return "CL";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Kind = "purchase" | "rental";

const STATUSES = ["ALL", "PENDING", "UNDER_REVIEW", "PAYMENT_PENDING", "COMPLETED", "ACTIVE", "REJECTED", "CANCELLED", "EXPIRED"];

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

/**
 * Staff view of purchase / rental requests.
 * Normal rental approval belongs ONLY to the Property Manager.
 * Admins monitor, view details, view payments, but DO NOT approve or reject rental bookings.
 */
export default function RequestsManager({
  isAdmin = false,
  defaultKind = "purchase",
  hideKindTabs = false,
}: {
  isAdmin?: boolean;
  defaultKind?: Kind;
  hideKindTabs?: boolean;
}) {
  const [kind, setKind] = useState<Kind>(defaultKind);
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; total: number; totalPages: number }>({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [viewingTarget, setViewingTarget] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ kind, status, page: String(page) });
      if (q.trim()) sp.set("q", q.trim());
      const res = await fetch(`/api/requests?${sp}`);
      const json = await res.json();
      if (json.success) setData({ items: json.items, total: json.total, totalPages: json.totalPages });
      else toast({ title: "Could not load requests", description: json.error, variant: "destructive" });
    } catch {
      toast({ title: "Network error", description: "Could not load requests.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [kind, status, page, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const act = async (r: any, action: "approve" | "reject" | "review", notes?: string) => {
    // Backend will reject if Admin attempts to approve/reject rental booking
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/requests/${kind}/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          title:
            action === "approve"
              ? "Request approved successfully"
              : action === "reject"
              ? "Request rejected"
              : "Moved under review",
        });
        setRejecting(null);
        setReason("");
        load();
      } else {
        toast({ title: "Action failed", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Action could not be completed.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  // Section 9 & 10: ADMIN MUST NOT HAVE APPROVE/REJECT FOR NORMAL RENTAL BOOKINGS
  const canAct = (r: any) => {
    if (kind === "rental" && isAdmin) return false;
    return ["PENDING", "UNDER_REVIEW"].includes(r.status) && (kind === "rental" || isAdmin);
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      {!hideKindTabs && (
        <div className="inline-flex rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1">
          {(["purchase", "rental"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                kind === k ? "bg-[#07111F] text-[#D9B45B]" : "text-[#6B7280] hover:text-[#07111F]"
              }`}
            >
              {k === "purchase" ? "Purchase Requests" : "Rental Requests"}
            </button>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-[#6B7280]" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search by request no., property or customer..."
            className="pl-9 h-10 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border cursor-pointer transition-colors ${
                status === s ? "bg-[#C89B3C] text-[#07111F] border-[#C89B3C]" : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:border-[#C89B3C]"
              }`}
            >
              {s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C]" /> Loading requests...
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Inbox className="h-8 w-8 text-[#C89B3C]" />
            <p className="text-sm font-bold text-[#07111F]">No {kind} requests found</p>
            <p className="text-xs text-[#6B7280]">Requests from customers will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#FAF6EC] text-[#475569] uppercase text-[10px] font-bold tracking-wider border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left py-3.5 pl-4 pr-3">Request #</th>
                  <th className="text-left py-3.5 px-3">Customer</th>
                  <th className="text-left py-3.5 px-3">Property</th>
                  {kind === "rental" && <th className="text-left py-3.5 px-3">Period</th>}
                  <th className="text-left py-3.5 px-3">Amount</th>
                  <th className="text-left py-3.5 px-3">Booking Status</th>
                  <th className="text-left py-3.5 px-3">Payment</th>
                  <th className="text-right py-3.5 pl-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]/80">
                {data.items.map((r) => {
                  const amount = kind === "purchase" ? r.salePrice : r.totalAmount;
                  const payment = r.transaction?.payments?.[0];
                  const paid = payment?.status === "PAID";
                  const pendingPayment = payment?.status === "PENDING";

                  return (
                    <tr key={r.id} className="hover:bg-[#FAF6EC]/70 transition-colors align-middle">
                      {/* Request # */}
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
                              <MapPin className="h-3 w-3 text-[#C89B3C]" />
                              <span className="truncate">{r.property?.city || "Location on file"}</span>
                            </div>
                            {r.manager?.name && (
                              <div className="inline-flex items-center gap-1 text-[10px] text-[#07111F] bg-[#FAF6EC] px-1.5 py-0.5 rounded border border-[#E8E1D4]">
                                <User className="h-2.5 w-2.5 text-[#C89B3C]" />
                                <span>Manager: {r.manager.name}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Period (Rentals only) */}
                      {kind === "rental" && (
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#07111F]">
                            <Calendar className="h-3.5 w-3.5 text-[#C89B3C]" />
                            <span>{fmt(r.startDate)} → {fmt(r.endDate)}</span>
                          </div>
                          <div className="text-[10px] text-[#64748B] mt-0.5 flex items-center gap-1.5 pl-5">
                            <span className="px-1.5 py-0.5 rounded bg-[#FAF6EC] border border-[#E8DEC8] text-[#8C6D23] font-bold">
                              {r.periods}× {r.rentalPeriod?.toLowerCase()}
                            </span>
                            <span>tenancy</span>
                          </div>
                        </td>
                      )}

                      {/* Amount */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                        <p className="font-serif font-black text-sm text-[#07111F] tracking-tight">
                          {formatPrice(amount)}
                        </p>
                        {kind === "rental" && r.securityDeposit > 0 ? (
                          <p className="text-[10px] font-medium text-[#64748B]">incl. {formatPrice(r.securityDeposit)} dep.</p>
                        ) : (
                          <p className="text-[10px] font-medium text-[#64748B]">{kind === "rental" ? "Total Contract" : "Purchase Price"}</p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                        <StatusBadge status={r.status} />
                        {r.reviewNotes && (
                          <p className="text-[10px] italic text-[#64748B] mt-1 max-w-[160px] truncate" title={r.reviewNotes}>
                            &ldquo;{r.reviewNotes}&rdquo;
                          </p>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                        {paid ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-950 border border-emerald-500/40 shadow-2xs">
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                            PAID
                          </span>
                        ) : pendingPayment ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-950 border border-amber-500/40 shadow-2xs">
                              <Clock className="h-3 w-3 text-amber-700" />
                              PENDING
                            </span>
                            {payment?.transactionRef && (
                              <p className="text-[9px] font-mono text-[#8C6D23] truncate max-w-[120px]">
                                Ref: {payment.transactionRef}
                              </p>
                            )}
                          </div>
                        ) : r.transaction ? (
                          <span className="text-[#64748B] text-xs font-mono">{r.transaction.status}</span>
                        ) : (
                          <span className="text-[#64748B] text-xs">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Dedicated View Modal for full details */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setViewingTarget(r)}
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

                          {/* Approve/Reject shown ONLY when allowed (NEVER for Admin on rental bookings) */}
                          {canAct(r) && (
                            <>
                              {r.status === "PENDING" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busyId === r.id}
                                  onClick={() => act(r, "review")}
                                  className="h-7 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                                >
                                  Review
                                </Button>
                              )}
                              <Button
                                size="sm"
                                disabled={busyId === r.id}
                                onClick={() => act(r, "approve")}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg gap-1 cursor-pointer shadow-2xs"
                              >
                                {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === r.id}
                                onClick={() => setRejecting(r)}
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

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-[#6B7280]">
          <span>
            {data.total} total · Page {page} of {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-8 rounded-lg border-[#E8E1D4]">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)} className="h-8 rounded-lg border-[#E8E1D4]">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View Booking Details Modal (User Section 9) */}
      <Dialog open={!!viewingTarget} onOpenChange={(o) => !o && setViewingTarget(null)}>
        <DialogContent className="max-w-lg bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-6 shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-[#A97918]">#{viewingTarget?.requestNo}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#07111F] text-[#D9B45B]">
                {kind === "rental" ? "Rental Booking" : "Purchase Request"}
              </span>
            </div>
            <DialogTitle className="font-serif text-lg text-[#07111F] flex items-center gap-2 mt-1">
              <KeyRound className="h-5 w-5 text-[#C89B3C]" />
              Booking &amp; Settlement Details
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Complete booking record for administrative oversight and audit tracking.
            </DialogDescription>
          </DialogHeader>

          {viewingTarget && (
            <div className="space-y-4 mt-2 text-xs">
              {/* Property Details */}
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-[#07111F] overflow-hidden shrink-0">
                  <img
                    src={viewingTarget.property?.images?.[0]?.url || "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800"}
                    alt={viewingTarget.property?.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-[#07111F] truncate">{viewingTarget.property?.title}</h4>
                  <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#C89B3C]" />
                    {viewingTarget.property?.city || viewingTarget.property?.location}
                  </p>
                </div>
              </div>

              {/* Customer & Manager info */}
              <div className="grid grid-cols-2 gap-2 bg-[#FAF6EC] p-3 rounded-xl border border-[#E8DEC8]">
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Customer</span>
                  <span className="font-bold text-xs text-[#07111F]">{viewingTarget.customer?.name}</span>
                  <p className="text-[11px] text-[#64748B]">{viewingTarget.customer?.email}</p>
                  {viewingTarget.customer?.phone && (
                    <p className="text-[10px] font-mono text-[#8C6D23]">{viewingTarget.customer.phone}</p>
                  )}
                </div>
                <div>
                  <span className="text-[#6B7280] block text-[10px] uppercase font-bold">Assigned Manager</span>
                  <span className="font-bold text-xs text-[#07111F]">{viewingTarget.manager?.name || "Unassigned"}</span>
                  <p className="text-[11px] text-[#64748B]">{viewingTarget.manager?.email || "—"}</p>
                  {viewingTarget.manager?.phone && (
                    <p className="text-[10px] font-mono text-[#8C6D23]">{viewingTarget.manager.phone}</p>
                  )}
                </div>
              </div>

              {/* Status and dates */}
              <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Booking Status:</span>
                  <span className="font-bold text-[#07111F]">{viewingTarget.status}</span>
                </div>
                {kind === "rental" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Check-in Date:</span>
                      <span className="font-semibold text-[#07111F]">{fmt(viewingTarget.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Check-out Date:</span>
                      <span className="font-semibold text-[#07111F]">{fmt(viewingTarget.endDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Tenancy Duration:</span>
                      <span className="font-semibold text-[#07111F]">{viewingTarget.periods} {viewingTarget.rentalPeriod?.toLowerCase()}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between pt-1 border-t border-[#E8E1D4]">
                  <span className="text-[#6B7280]">Total Amount:</span>
                  <span className="font-serif font-black text-sm text-[#C89B3C]">
                    {formatPrice(kind === "rental" ? viewingTarget.totalAmount : viewingTarget.salePrice)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              {viewingTarget.transaction?.payments?.[0] && (
                <div className="p-3 bg-white rounded-xl border border-[#E8E1D4] space-y-2 text-[11px]">
                  <h5 className="font-bold text-[#07111F] text-xs">Payment Verification Data</h5>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Method:</span>
                    <span className="font-bold text-[#07111F]">{viewingTarget.transaction.payments[0].paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Transaction Reference:</span>
                    <span className="font-mono font-bold text-[#8C6D23]">{viewingTarget.transaction.payments[0].transactionRef}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B7280]">Payment Status:</span>
                    <span className="font-bold text-[#07111F]">
                      {viewingTarget.transaction.payments[0].status === "PAID"
                        ? "PAID / VERIFIED"
                        : viewingTarget.transaction.payments[0].status === "PENDING"
                        ? "PENDING VERIFICATION"
                        : viewingTarget.transaction.payments[0].status}
                    </span>
                  </div>
                  {viewingTarget.transaction.payments[0].paidAt && (
                    <div className="flex justify-between">
                      <span className="text-[#6B7280]">Verified At:</span>
                      <span className="text-[#07111F]">{new Date(viewingTarget.transaction.payments[0].paidAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Review notes / History */}
              {viewingTarget.reviewNotes && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px]">
                  <span className="font-bold text-amber-900 block mb-0.5">Manager Review Notes:</span>
                  <p className="text-amber-800 italic">&ldquo;{viewingTarget.reviewNotes}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setViewingTarget(null)} className="rounded-xl border-[#E8E1D4]">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#07111F]">Reject request {rejecting?.requestNo}</DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">The customer will be notified with your reason.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-[#07111F]">Reason</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[90px] border-[#E8E1D4] rounded-xl bg-white text-sm" maxLength={2000} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)} className="rounded-xl border-[#E8E1D4]">
              Cancel
            </Button>
            <Button disabled={!reason.trim() || busyId === rejecting?.id} onClick={() => act(rejecting, "reject", reason)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
              Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
