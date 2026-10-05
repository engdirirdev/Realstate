"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, CreditCard, Receipt, XCircle, Inbox, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

type Tab = "transactions" | "purchase" | "rental";
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

/** Customer's own requests & transactions (API scopes everything to the signed-in customer). */
export default function MyTransactions() {
  const [tab, setTab] = useState<Tab>("transactions");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payTarget, setPayTarget] = useState<any | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = tab === "transactions" ? "/api/transactions?pageSize=50" : `/api/requests?kind=${tab}&pageSize=50`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setItems(json.items);
      else toast({ title: "Could not load data", description: json.error, variant: "destructive" });
    } catch {
      toast({ title: "Network error", description: "Could not load data.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const cancel = async (kind: "purchase" | "rental", id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/requests/${kind}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ title: "Request cancelled" });
        load();
      } else toast({ title: "Could not cancel", description: json.error, variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const pay = async () => {
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
        toast({ title: "Payment successful", description: `Receipt ${json.receiptNo} generated.` });
        setPayTarget(null);
        load();
      } else {
        toast({ title: "Payment failed", description: json.error || "Payment failed. Please try again.", variant: "destructive" });
        setPayTarget(null);
        load();
      }
    } catch {
      toast({ title: "Payment failed", description: "Payment failed. Please try again.", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: "transactions", label: "Transactions" },
    { key: "purchase", label: "Purchase Requests" },
    { key: "rental", label: "Rental Requests" },
  ];

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              tab === t.key ? "bg-[#07111F] text-[#D9B45B]" : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-[#6B7280] gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C]" /> Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Inbox className="h-8 w-8 text-[#C89B3C]" />
            <p className="text-sm font-bold text-[#07111F]">Nothing here yet</p>
            <p className="text-xs text-[#6B7280]">
              Browse <Link href="/customer/properties" className="text-[#C89B3C] font-semibold">properties</Link> to buy or rent.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F3EA] text-[#6B7280] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left p-3">{tab === "transactions" ? "Transaction" : "Request"}</th>
                  <th className="text-left p-3">Property</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-right p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tab === "transactions"
                  ? items.map((t) => (
                      <tr key={t.id} className="border-t border-[#E8E1D4] align-top">
                        <td className="p-3 font-mono font-bold text-[#07111F]">{t.txnNo}</td>
                        <td className="p-3">
                          <p className="font-semibold text-[#07111F]">{t.property?.title}</p>
                          {t.rentalRequest && (
                            <p className="text-[#6B7280]">
                              {fmt(t.rentalRequest.startDate)} → {fmt(t.rentalRequest.endDate)}
                            </p>
                          )}
                        </td>
                        <td className="p-3">{t.type === "SALE" ? "Sale" : "Rental"}</td>
                        <td className="p-3 font-bold">{formatPrice(t.amount)}</td>
                        <td className="p-3">
                          <StatusBadge status={t.status} />
                        </td>
                        <td className="p-3">{fmt(t.createdAt)}</td>
                        <td className="p-3">
                          <div className="flex justify-end gap-1.5">
                            {t.status === "PAYMENT_PENDING" && (
                              <Button size="sm" onClick={() => setPayTarget(t)} className="h-8 rounded-lg text-[11px] bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] font-bold gap-1 border-0">
                                <CreditCard className="h-3 w-3" /> Pay Now
                              </Button>
                            )}
                            {t.receipt && (
                              <Link href={`/receipt/${t.receipt.id}`} target="_blank">
                                <Button size="sm" variant="outline" className="h-8 rounded-lg text-[11px] border-[#E8E1D4] gap-1">
                                  <Receipt className="h-3 w-3" /> Receipt
                                </Button>
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  : items.map((r) => {
                      const amount = tab === "purchase" ? r.salePrice : r.totalAmount;
                      const cancellable = ["PENDING", "UNDER_REVIEW", "PAYMENT_PENDING"].includes(r.status);
                      return (
                        <tr key={r.id} className="border-t border-[#E8E1D4] align-top">
                          <td className="p-3 font-mono font-bold text-[#07111F]">{r.requestNo}</td>
                          <td className="p-3">
                            <Link href={`/properties/${r.property?.id}`} className="font-semibold text-[#07111F] hover:text-[#C89B3C]">
                              {r.property?.title}
                            </Link>
                            {tab === "rental" && (
                              <p className="text-[#6B7280]">
                                {fmt(r.startDate)} → {fmt(r.endDate)}
                              </p>
                            )}
                          </td>
                          <td className="p-3">{tab === "purchase" ? "Sale" : "Rental"}</td>
                          <td className="p-3 font-bold">{formatPrice(amount)}</td>
                          <td className="p-3">
                            <StatusBadge status={r.status} />
                            {r.reviewNotes && <p className="text-[10px] text-[#6B7280] mt-1 max-w-[180px]">Note: {r.reviewNotes}</p>}
                          </td>
                          <td className="p-3">{fmt(r.createdAt)}</td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1.5">
                              {r.status === "PAYMENT_PENDING" && r.transaction && (
                                <Button size="sm" onClick={() => setPayTarget(r.transaction)} className="h-8 rounded-lg text-[11px] bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] font-bold gap-1 border-0">
                                  <CreditCard className="h-3 w-3" /> Pay Now
                                </Button>
                              )}
                              {cancellable && (
                                <Button size="sm" variant="outline" disabled={busyId === r.id} onClick={() => cancel(tab as "purchase" | "rental", r.id)} className="h-8 rounded-lg text-[11px] border-red-200 text-red-600 hover:bg-red-50 gap-1">
                                  <XCircle className="h-3 w-3" /> Cancel
                                </Button>
                              )}
                              {r.transaction?.receipt && (
                                <Link href={`/receipt/${r.transaction.receipt.id}`} target="_blank">
                                  <Button size="sm" variant="outline" className="h-8 rounded-lg text-[11px] border-[#E8E1D4] gap-1">
                                    <Receipt className="h-3 w-3" /> Receipt
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

      {/* Payment confirmation */}
      <Dialog open={!!payTarget} onOpenChange={(o) => !o && setPayTarget(null)}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#07111F] flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-[#C89B3C]" /> Complete Payment
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">Transaction {payTarget?.txnNo}</DialogDescription>
          </DialogHeader>
          <div className="bg-[#07111F] border border-[#C89B3C]/30 p-4 rounded-xl space-y-2 text-white">
            <div className="flex items-center gap-2 text-xs font-bold text-[#D9B45B]">
              <ShieldCheck className="h-4 w-4 text-[#C89B3C]" /> Sandbox payment gateway
            </div>
            <p className="text-xs text-[#94A3B8]">No real money is charged. The amount is fixed by the server and a receipt is issued on success.</p>
            <div className="pt-2 border-t border-[#C89B3C]/20 flex justify-between text-xs font-bold">
              <span>Total Due</span>
              <span className="text-sm font-serif text-[#D9B45B]">{payTarget ? formatPrice(payTarget.amount) : ""}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayTarget(null)} className="rounded-xl border-[#E8E1D4]">
              Cancel
            </Button>
            <Button onClick={pay} disabled={busyId === payTarget?.id} className="rounded-xl bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] font-bold gap-2 border-0">
              {busyId === payTarget?.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Pay Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
