"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, Eye, Search, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

type Kind = "purchase" | "rental";

const STATUSES = ["ALL", "PENDING", "UNDER_REVIEW", "PAYMENT_PENDING", "COMPLETED", "ACTIVE", "REJECTED", "CANCELLED", "EXPIRED"];

const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

/**
 * Staff view of purchase / rental requests. Scope (own vs all) is enforced by the API
 * from the session role — this component only renders what the API returns.
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
    setBusyId(r.id);
    try {
      const res = await fetch(`/api/requests/${kind}/${r.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: action === "approve" ? "Request approved — customer can now pay" : action === "reject" ? "Request rejected" : "Moved under review" });
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

  const canAct = (r: any) => ["PENDING", "UNDER_REVIEW"].includes(r.status) && (kind === "rental" || isAdmin);

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
      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden">
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
              <thead className="bg-[#F7F3EA] text-[#6B7280] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left p-3">Request</th>
                  <th className="text-left p-3">Customer</th>
                  <th className="text-left p-3">Property</th>
                  {kind === "rental" && <th className="text-left p-3">Period</th>}
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => {
                  const amount = kind === "purchase" ? r.salePrice : r.totalAmount;
                  const paid = r.transaction?.payments?.[0]?.status;
                  return (
                    <tr key={r.id} className="border-t border-[#E8E1D4] align-top">
                      <td className="p-3">
                        <p className="font-mono font-bold text-[#07111F]">{r.requestNo}</p>
                        <p className="text-[#6B7280]">{fmt(r.createdAt)}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-[#07111F]">{r.customer?.name}</p>
                        <p className="text-[#6B7280]">{r.customer?.email}</p>
                        {r.customer?.phone && <p className="text-[#6B7280]">{r.customer.phone}</p>}
                      </td>
                      <td className="p-3">
                        <Link href={`/properties/${r.property?.id}`} className="font-semibold text-[#07111F] hover:text-[#C89B3C]" target="_blank">
                          {r.property?.title}
                        </Link>
                        <p className="text-[#6B7280]">{r.property?.city}</p>
                        {isAdmin && r.manager?.name && <p className="text-[#6B7280]">Mgr: {r.manager.name}</p>}
                      </td>
                      {kind === "rental" && (
                        <td className="p-3 whitespace-nowrap">
                          <p>
                            {fmt(r.startDate)} → {fmt(r.endDate)}
                          </p>
                          <p className="text-[#6B7280]">
                            {r.periods} × {r.rentalPeriod?.toLowerCase()}
                          </p>
                        </td>
                      )}
                      <td className="p-3 font-bold text-[#07111F] whitespace-nowrap">
                        {formatPrice(amount)}
                        {kind === "rental" && r.securityDeposit > 0 && (
                          <p className="text-[10px] font-normal text-[#6B7280]">incl. {formatPrice(r.securityDeposit)} deposit</p>
                        )}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={r.status} />
                        {r.reviewNotes && <p className="text-[10px] text-[#6B7280] mt-1 max-w-[160px]">{r.reviewNotes}</p>}
                      </td>
                      <td className="p-3">
                        {r.transaction ? (
                          <div className="space-y-1">
                            <StatusBadge status={paid || (r.transaction.status === "PAYMENT_PENDING" ? "PENDING" : null)} />
                            <p className="font-mono text-[10px] text-[#6B7280]">{r.transaction.txnNo}</p>
                          </div>
                        ) : (
                          <span className="text-[#6B7280]">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex justify-end gap-1.5">
                          {r.transaction?.receipt && (
                            <Link href={`/receipt/${r.transaction.receipt.id}`} target="_blank">
                              <Button size="sm" variant="outline" className="h-8 rounded-lg text-[11px] border-[#E8E1D4]">
                                Receipt
                              </Button>
                            </Link>
                          )}
                          {canAct(r) && (
                            <>
                              {r.status === "PENDING" && (
                                <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => act(r, "review")} className="h-8 rounded-lg text-[11px] border-[#E8E1D4] gap-1">
                                  <Eye className="h-3 w-3" /> Review
                                </Button>
                              )}
                              <Button size="sm" disabled={busyId === r.id} onClick={() => act(r, "approve")} className="h-8 rounded-lg text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
                                {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />} Approve
                              </Button>
                              <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => setRejecting(r)} className="h-8 rounded-lg text-[11px] border-red-200 text-red-600 hover:bg-red-50 gap-1">
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
