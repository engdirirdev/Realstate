"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Receipt, Search, ChevronLeft, ChevronRight, Inbox, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

const STATUSES = ["ALL", "PAYMENT_PENDING", "COMPLETED", "ACTIVE", "EXPIRED", "CANCELLED", "REJECTED"];
const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString() : "—");

export default function CentralTransactionsView({ isAdmin = false }: { isAdmin?: boolean }) {
  const [type, setType] = useState<"ALL" | "SALE" | "RENTAL">("ALL");
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: any[]; total: number; totalPages: number; revenue?: number | null }>({
    items: [],
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page) });
      if (type !== "ALL") sp.set("type", type);
      if (status !== "ALL") sp.set("status", status);
      if (q.trim()) sp.set("q", q.trim());
      const res = await fetch(`/api/transactions?${sp}`);
      const json = await res.json();
      if (json.success) setData(json);
      else toast({ title: "Could not load transactions", description: json.error, variant: "destructive" });
    } catch {
      toast({ title: "Network error", description: "Failed to load transactions.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [type, status, page, q]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  return (
    <div className="space-y-5">
      {/* Revenue Card for Staff */}
      {data.revenue !== null && data.revenue !== undefined && (
        <div className="bg-[#07111F] rounded-2xl p-5 text-white flex items-center justify-between border border-[#C89B3C]/30 shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-[#D9B45B] uppercase tracking-wider block">
              {isAdmin ? "Total Platform Transaction Settlement" : "My Closed Portfolio Revenue"}
            </span>
            <p className="text-2xl font-black font-serif text-[#FCFBF7] mt-0.5">
              {formatPrice(data.revenue)} <span className="text-xs font-sans text-[#D9B45B]">USD</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#C89B3C] to-[#D9B45B] flex items-center justify-center text-[#07111F]">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="inline-flex rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1">
        {(["ALL", "SALE", "RENTAL"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setType(t);
              setPage(1);
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              type === t ? "bg-[#07111F] text-[#D9B45B]" : "text-[#6B7280] hover:text-[#07111F]"
            }`}
          >
            {t === "ALL" ? "All Deals" : t === "SALE" ? "Sales Transactions" : "Rental Leases"}
          </button>
        ))}
      </div>

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
            placeholder="Search by transaction no. or property..."
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
            <Loader2 className="h-4 w-4 animate-spin text-[#C89B3C]" /> Loading deals...
          </div>
        ) : data.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
            <Inbox className="h-8 w-8 text-[#C89B3C]" />
            <p className="text-sm font-bold text-[#07111F]">No transactions found</p>
            <p className="text-xs text-[#6B7280]">Completed and in-progress property transactions will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F3EA] text-[#6B7280] uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="text-left p-3">Txn No</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Property</th>
                  <th className="text-left p-3">Customer</th>
                  {isAdmin && <th className="text-left p-3">Manager</th>}
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Deal Status</th>
                  <th className="text-left p-3">Payment</th>
                  <th className="text-left p-3">Date</th>
                  <th className="text-right p-3">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((t) => {
                  const payment = t.payments?.[0];
                  return (
                    <tr key={t.id} className="border-t border-[#E8E1D4] align-top">
                      <td className="p-3 font-mono font-bold text-[#07111F]">{t.txnNo}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          t.type === "SALE" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {t.type === "SALE" ? "Sale" : "Rental"}
                        </span>
                      </td>
                      <td className="p-3">
                        <Link href={`/properties/${t.property?.id}`} className="font-semibold text-[#07111F] hover:text-[#C89B3C]" target="_blank">
                          {t.property?.title}
                        </Link>
                        <p className="text-[#6B7280]">{t.property?.city}</p>
                        {t.rentalRequest && (
                          <p className="text-[11px] text-[#6B7280]">
                            {fmt(t.rentalRequest.startDate)} → {fmt(t.rentalRequest.endDate)} ({t.rentalRequest.periods} {t.rentalRequest.rentalPeriod?.toLowerCase()})
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-semibold text-[#07111F]">{t.customer?.name}</p>
                        <p className="text-[#6B7280]">{t.customer?.email}</p>
                      </td>
                      {isAdmin && (
                        <td className="p-3 text-[#6B7280]">
                          {t.manager?.name || "Platform Direct"}
                        </td>
                      )}
                      <td className="p-3 font-bold text-[#07111F] whitespace-nowrap">
                        {formatPrice(t.amount)}
                      </td>
                      <td className="p-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="p-3">
                        {payment ? (
                          <div>
                            <StatusBadge status={payment.status} />
                            <p className="text-[10px] text-[#6B7280] mt-0.5">{payment.paymentMethod}</p>
                          </div>
                        ) : (
                          <span className="text-[#6B7280] text-[11px]">Unpaid</span>
                        )}
                      </td>
                      <td className="p-3 text-[#6B7280]">{fmt(t.createdAt)}</td>
                      <td className="p-3 text-right">
                        {t.receipt ? (
                          <Link href={`/receipt/${t.receipt.id}`} target="_blank">
                            <Button size="sm" variant="outline" className="h-8 rounded-lg text-[11px] border-[#E8E1D4] gap-1">
                              <Receipt className="h-3 w-3" /> Receipt
                            </Button>
                          </Link>
                        ) : (
                          <span className="text-[#6B7280] text-[11px]">—</span>
                        )}
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
    </div>
  );
}
