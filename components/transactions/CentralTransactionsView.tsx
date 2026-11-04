"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Receipt,
  Search,
  ChevronLeft,
  ChevronRight,
  Inbox,
  CreditCard,
  TrendingUp,
  CheckCircle2,
  Clock,
  ScrollText,
  ShieldCheck,
  RefreshCw,
  FileText,
  ExternalLink,
  Building2,
  MapPin,
  Phone,
  User,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice, cn } from "@/lib/utils";
import StatusBadge from "./StatusBadge";

const PAYMENT_STATUSES = ["ALL", "PAID", "PENDING", "FAILED"];
const LEDGER_STATUSES = ["ALL", "PAYMENT_PENDING", "COMPLETED", "ACTIVE", "EXPIRED", "CANCELLED", "REJECTED"];
const fmt = (d?: string | null | Date) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

interface CentralTransactionsViewProps {
  isAdmin?: boolean;
  initialTab?: "payments" | "ledger";
}

export default function CentralTransactionsView({
  isAdmin = false,
  initialTab = "payments",
}: CentralTransactionsViewProps) {
  const [activeTab, setActiveTab] = useState<"payments" | "ledger">(isAdmin ? initialTab : "payments");
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // --- Payment Gateway Logs State ---
  const [paymentsQ, setPaymentsQ] = useState("");
  const [paymentsStatus, setPaymentsStatus] = useState("ALL");
  const [paymentsData, setPaymentsData] = useState<{
    payments: any[];
    totalRevenue: number;
    totalPaidTransactions: number;
    totalDeals?: number;
  }>({
    payments: [],
    totalRevenue: 0,
    totalPaidTransactions: 0,
    totalDeals: 0,
  });
  const [paymentsLoading, setPaymentsLoading] = useState(true);

  // --- Transactions Ledger State ---
  const [ledgerType, setLedgerType] = useState<"ALL" | "SALE" | "RENTAL">(isAdmin ? "ALL" : "RENTAL");
  const [ledgerStatus, setLedgerStatus] = useState("ALL");
  const [ledgerQ, setLedgerQ] = useState("");
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerData, setLedgerData] = useState<{
    items: any[];
    total: number;
    totalPages: number;
    revenue?: number | null;
  }>({
    items: [],
    total: 0,
    totalPages: 1,
  });
  const [ledgerLoading, setLedgerLoading] = useState(true);

  // --- Load Payments Data ---
  const loadPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const sp = new URLSearchParams();
      if (paymentsStatus !== "ALL") sp.set("status", paymentsStatus);
      if (paymentsQ.trim()) sp.set("q", paymentsQ.trim());
      const res = await fetch(`/api/payments?${sp}`);
      const json = await res.json();
      if (json.success) {
        setPaymentsData(json);
      } else {
        toast({ title: "Could not load payments", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Failed to load payments.", variant: "destructive" });
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentsStatus, paymentsQ]);

  // --- Load Ledger Data ---
  const loadLedger = useCallback(async () => {
    setLedgerLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(ledgerPage) });
      if (ledgerType !== "ALL") sp.set("type", ledgerType);
      if (ledgerStatus !== "ALL") sp.set("status", ledgerStatus);
      if (ledgerQ.trim()) sp.set("q", ledgerQ.trim());
      const res = await fetch(`/api/transactions?${sp}`);
      const json = await res.json();
      if (json.success) {
        setLedgerData(json);
      } else {
        toast({ title: "Could not load transactions", description: json.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Network error", description: "Failed to load transactions.", variant: "destructive" });
    } finally {
      setLedgerLoading(false);
    }
  }, [ledgerType, ledgerStatus, ledgerPage, ledgerQ]);

  useEffect(() => {
    const t = setTimeout(loadPayments, paymentsQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadPayments, paymentsQ]);

  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(loadLedger, ledgerQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadLedger, ledgerQ, isAdmin]);

  // Unified metrics
  const totalSettlement = paymentsData.totalRevenue || ledgerData.revenue || 0;
  const verifiedCount = paymentsData.totalPaidTransactions || 0;
  const totalDealsCount = ledgerData.total || paymentsData.totalDeals || 0;

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* ================================================================ */}
      {/* 1. TOP KPI SUMMARY METRICS (Payments Volume & Deals)             */}
      {/* ================================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Settlement Volume */}
        <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex items-center justify-between transition-all hover:border-[#C89B3C]/50">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              {isAdmin ? "Total Platform Settlement Volume" : "Portfolio Rental Yield"}
            </p>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] mt-1">
              {formatPrice(totalSettlement)}
            </p>
            <p className="text-[11px] text-[#A97918] mt-0.5 font-medium">
              {isAdmin ? "Cleared Escrow Funds" : "Cleared Rental Payments"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner shrink-0">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Verified Completed Transactions */}
        <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex items-center justify-between transition-all hover:border-[#C89B3C]/50">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              Verified Completed Settlements
            </p>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] mt-1">
              {verifiedCount}
            </p>
            <p className="text-[11px] text-[#A97918] mt-0.5 font-medium">Authenticated Payments</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner shrink-0">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Total Recorded Deals / Payments */}
        <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex items-center justify-between transition-all hover:border-[#C89B3C]/50">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              {isAdmin ? "Total Deal Agreements" : "Total Payment Records"}
            </p>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] mt-1">
              {isAdmin ? totalDealsCount : paymentsData.payments.length}
            </p>
            <p className="text-[11px] text-[#A97918] mt-0.5 font-medium">
              {isAdmin ? "Sales Acquisitions & Leases" : "Authenticated Payment Records"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner shrink-0">
            <ScrollText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* 2. TAB SWITCHER (Payments only for Manager, Ledger also for Admin) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-[#FCFBF7] border border-[#E8E1D4] rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 flex-1">
          {/* 1st Tab: Payments */}
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "payments"
                ? "bg-[#07111F] text-[#D9B45B] shadow-sm shadow-[#07111F]/20"
                : "text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA]"
            )}
          >
            <CreditCard className="w-4 h-4 text-[#C89B3C]" />
            <span>Payments</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono",
                activeTab === "payments" ? "bg-white/15 text-[#FCFBF7]" : "bg-[#E8E1D4] text-[#07111F]"
              )}
            >
              {paymentsData.payments.length}
            </span>
          </button>

          {/* 2nd Tab: Transactions Ledger (Admin Only) */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab("ledger")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
                activeTab === "ledger"
                  ? "bg-[#07111F] text-[#D9B45B] shadow-sm shadow-[#07111F]/20"
                  : "text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA]"
              )}
            >
              <ScrollText className="w-4 h-4 text-[#C89B3C]" />
              <span>Transactions Ledger</span>
              <span
                className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-mono",
                  activeTab === "ledger" ? "bg-white/15 text-[#FCFBF7]" : "bg-[#E8E1D4] text-[#07111F]"
                )}
              >
                {ledgerData.total}
              </span>
            </button>
          )}
        </div>

        <div className="flex items-center justify-end px-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (activeTab === "payments") loadPayments();
              else loadLedger();
            }}
            className="text-xs text-[#6B7280] hover:text-[#07111F] gap-1.5 h-8 rounded-lg cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 3. TAB 1: PAYMENTS & ESCROW (Holding All Payments Data)          */}
      {/* ================================================================ */}
      {activeTab === "payments" && (
        <div className="space-y-4">
          {/* Sub-Filters: Search & Status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
              <Input
                value={paymentsQ}
                onChange={(e) => setPaymentsQ(e.target.value)}
                placeholder="Search payments by reference PAY-XXXXXX, property, or client..."
                className="pl-10 h-10 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => setPaymentsStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border cursor-pointer transition-colors",
                    paymentsStatus === s
                      ? "bg-[#C89B3C] text-[#07111F] border-[#C89B3C]"
                      : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:border-[#C89B3C]"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Payments Table */}
          <div className="w-full max-w-full bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] shadow-xs overflow-hidden">
            {paymentsLoading ? (
              <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#C89B3C]" /> Loading payment records...
              </div>
            ) : paymentsData.payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <CreditCard className="h-9 w-9 text-[#C89B3C]" />
                <p className="text-sm font-bold text-[#07111F]">No payment records found</p>
                <p className="text-xs text-[#6B7280]">
                  Customer payments and escrow settlements will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* ─── DESKTOP & TABLET: HORIZONTAL SCROLL TABLE (Matching Bookings) ─── */}
                <div className="hidden md:block w-full max-w-full overflow-x-auto">
                  <table className={cn("w-full text-left border-collapse text-xs", isAdmin ? "min-w-[980px] lg:min-w-0" : "min-w-[880px] lg:min-w-0")}>
                    <thead className="bg-[#FAF6EC] text-[#475569] uppercase text-[10px] font-bold tracking-wider border-b border-[#E8E1D4]">
                      <tr>
                        <th className="py-2.5 pl-3 pr-2.5 w-[140px]">Transaction Ref</th>
                        <th className="py-2.5 px-2.5 w-[240px]">Property Listing</th>
                        <th className="py-2.5 px-2.5 w-[200px]">{isAdmin ? "Client / Buyer" : "Client / Tenant"}</th>
                        {isAdmin && <th className="py-2.5 px-2.5 w-[150px]">Assigned Advisor</th>}
                        <th className="py-2.5 px-2.5 w-[125px]">Settlement Amount</th>
                        <th className="py-2.5 px-2.5 w-[120px]">Payment Method</th>
                        <th className="py-2.5 px-2.5 w-[110px]">Escrow Status</th>
                        <th className="py-2.5 px-2.5 w-[110px]">Date</th>
                        <th className="py-3.5 pl-3 pr-4 text-right w-[125px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E1D4]/80">
                      {paymentsData.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-[#FAF6EC]/70 transition-colors align-middle">
                          {/* Transaction Ref */}
                          <td className="py-2.5 pl-3 pr-2.5 align-middle w-[140px] whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F]/5 border border-[#E8E1D4] text-[#07111F] font-mono font-bold text-xs tracking-tight shadow-2xs">
                              <CreditCard className="h-3 w-3 text-[#C89B3C] shrink-0" />
                              <span>{p.transactionRef}</span>
                            </div>
                          </td>

                          {/* Property Listing */}
                          <td className="py-2.5 px-2.5 align-middle w-[240px]">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#07111F] to-[#1E293B] border border-[#E8E1D4] shrink-0 flex items-center justify-center shadow-2xs">
                                {p.property?.images?.[0]?.url ? (
                                  <Image
                                    src={p.property.images[0].url}
                                    alt={p.property?.title || "Property"}
                                    fill
                                    sizes="44px"
                                    className="object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <Building2 className="h-5 w-5 text-[#C89B3C]" />
                                )}
                              </div>
                              <div className="min-w-0 max-w-[170px] space-y-0.5">
                                {p.property ? (
                                  <Link
                                    href={`/properties/${p.property.id}`}
                                    className="font-bold text-xs text-[#07111F] hover:text-[#C89B3C] transition-colors truncate block"
                                    target="_blank"
                                    title={p.property.title}
                                  >
                                    {p.property.title}
                                  </Link>
                                ) : (
                                  <span className="font-bold text-xs text-[#07111F]">Platform Service</span>
                                )}
                                <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                                  <MapPin className="h-3 w-3 text-[#C89B3C] shrink-0" />
                                  <span className="truncate">{p.property?.city || "Direct Escrow"}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Client */}
                          <td className="py-2.5 px-2.5 align-middle w-[200px]">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#07111F] to-[#1E293B] text-[#D9B45B] border border-[#C89B3C]/30 flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                                {getInitials(p.customer?.name)}
                              </div>
                              <div className="min-w-0 max-w-[150px] space-y-0.5">
                                <p className="font-semibold text-xs text-[#07111F] truncate" title={p.customer?.name || "Anonymous Client"}>
                                  {p.customer?.name || "Anonymous Client"}
                                </p>
                                <p className="text-[11px] text-[#64748B] truncate" title={p.customer?.email || ""}>
                                  {p.customer?.email || "No email"}
                                </p>
                                {p.customer?.phone && (
                                  <p className="text-[10px] font-mono font-medium text-[#8C6D23] flex items-center gap-1 truncate">
                                    <Phone className="h-2.5 w-2.5 text-[#C89B3C] shrink-0" />
                                    <span>{p.customer.phone}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Assigned Advisor (Admin only) */}
                          {isAdmin && (
                            <td className="py-2.5 px-2.5 align-middle w-[150px]">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EC] border border-[#E8E1D4] text-[11px] font-medium text-[#07111F] max-w-[140px]">
                                <User className="h-3 w-3 text-[#C89B3C] shrink-0" />
                                <span className="truncate">{p.manager?.name || "Kiro-Maal Concierge"}</span>
                              </div>
                            </td>
                          )}

                          {/* Settlement Amount */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[125px]">
                            <p className="font-serif font-black text-sm text-[#07111F] tracking-tight">
                              {formatPrice(p.amount)}
                            </p>
                            <p className="text-[10px] font-medium text-[#64748B]">Settled Funds</p>
                          </td>

                          {/* Payment Method */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[120px]">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6EC] border border-[#E8E1D4] text-[11px] font-medium text-[#07111F]">
                              {p.paymentMethod || "Direct Settlement"}
                            </span>
                          </td>

                          {/* Escrow Status */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[110px]">
                            <StatusBadge status={p.status} />
                          </td>

                          {/* Date */}
                          <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[110px]">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#07111F]">
                              <Calendar className="h-3 w-3 text-[#C89B3C] shrink-0" />
                              <span>{fmt(p.createdAt)}</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap align-middle w-[125px]">
                            <div className="flex items-center justify-end gap-1.5">
                              {p.receipt ? (
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                                  >
                                    <Link href={`/receipt/${p.receipt.id}`} target="_blank">
                                      <Receipt className="h-3 w-3 text-[#C89B3C]" /> Receipt
                                    </Link>
                                  </Button>
                              ) : p.transaction ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setLedgerQ(p.transaction.txnNo);
                                    setActiveTab("ledger");
                                  }}
                                  className="h-7 text-xs rounded-lg text-[#8C6D23] hover:text-[#07111F] hover:bg-[#FAF6EC] gap-1 cursor-pointer font-medium"
                                >
                                  View Deal
                                </Button>
                              ) : null}

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedPayment(p)}
                                className="h-7 text-xs rounded-lg text-[#64748B] hover:text-[#07111F] hover:bg-[#FAF6EC] gap-1 cursor-pointer font-medium"
                                title="View Payment Breakdown"
                              >
                                <FileText className="h-3 w-3" /> Slip
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* ─── MOBILE: RESPONSIVE CARDS VIEW (Matching Bookings) ─── */}
                <div className="block md:hidden divide-y divide-[#E8E1D4]/80">
                  {paymentsData.payments.map((p) => (
                    <div key={p.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F]/5 border border-[#E8E1D4] text-[#07111F] font-mono font-bold text-xs">
                          <CreditCard className="h-3 w-3 text-[#C89B3C] shrink-0" />
                          <span>{p.transactionRef}</span>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      {/* Property Listing */}
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#07111F] to-[#1E293B] border border-[#E8E1D4] shrink-0 flex items-center justify-center">
                          {p.property?.images?.[0]?.url ? (
                            <Image
                              src={p.property.images[0].url}
                              alt={p.property?.title || "Property"}
                              fill
                              sizes="48px"
                              className="object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Building2 className="h-5 w-5 text-[#C89B3C]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-0.5">
                          {p.property ? (
                            <Link
                              href={`/properties/${p.property.id}`}
                              className="font-bold text-xs text-[#07111F] hover:text-[#C89B3C] transition-colors truncate block"
                              target="_blank"
                            >
                              {p.property.title}
                            </Link>
                          ) : (
                            <span className="font-bold text-xs text-[#07111F]">Platform Service</span>
                          )}
                          <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                            <MapPin className="h-3 w-3 text-[#C89B3C] shrink-0" />
                            <span className="truncate">{p.property?.city || "Direct Escrow"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Details Info Grid */}
                      <div className="bg-[#FAF6EC]/80 rounded-xl p-3 text-xs space-y-2 border border-[#E8E1D4]">
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B] text-[11px]">{isAdmin ? "Client / Buyer:" : "Client / Tenant:"}</span>
                          <span className="font-semibold text-[#07111F] truncate max-w-[180px]">
                            {p.customer?.name || "Anonymous Client"}
                          </span>
                        </div>
                        {isAdmin && (
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] text-[11px]">Advisor:</span>
                            <span className="font-medium text-[#07111F] truncate max-w-[180px]">
                              {p.manager?.name || "Kiro-Maal Concierge"}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B] text-[11px]">Amount:</span>
                          <span className="font-serif font-black text-sm text-[#07111F]">
                            {formatPrice(p.amount)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B] text-[11px]">Method:</span>
                          <span className="px-2 py-0.5 rounded-md bg-[#FCFBF7] border border-[#E8E1D4] text-[10px] font-semibold text-[#07111F]">
                            {p.paymentMethod || "Direct Settlement"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#64748B] text-[11px]">Date:</span>
                          <span className="font-medium text-[#07111F] text-[11px] flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#C89B3C] shrink-0" />
                            {fmt(p.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Mobile Actions */}
                      <div className="flex items-center justify-end gap-2 pt-1">
                        {p.receipt ? (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                          >
                            <Link href={`/receipt/${p.receipt.id}`} target="_blank">
                              <Receipt className="h-3.5 w-3.5 text-[#C89B3C]" /> Receipt
                            </Link>
                          </Button>
                        ) : p.transaction ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setLedgerQ(p.transaction.txnNo);
                              setActiveTab("ledger");
                            }}
                            className="h-8 text-xs rounded-lg text-[#8C6D23] hover:text-[#07111F] hover:bg-[#FAF6EC] gap-1 cursor-pointer font-medium"
                          >
                            View Deal
                          </Button>
                        ) : null}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedPayment(p)}
                          className="h-8 text-xs rounded-lg text-[#64748B] hover:text-[#07111F] hover:bg-[#FAF6EC] gap-1 cursor-pointer font-medium"
                        >
                          <FileText className="h-3.5 w-3.5" /> Slip
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 4. TAB 2: TRANSACTIONS LEDGER (Sales & Rentals Agreements)       */}
      {/* ================================================================ */}
      {activeTab === "ledger" && (
        <div className="space-y-4">
          {/* Sub-Filters: Deal Type */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {isAdmin && (
              <div className="inline-flex rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] p-1">
                {(["ALL", "SALE", "RENTAL"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      setLedgerType(t);
                      setLedgerPage(1);
                    }}
                    className={cn(
                      "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer",
                      ledgerType === t
                        ? "bg-[#07111F] text-[#D9B45B]"
                        : "text-[#6B7280] hover:text-[#07111F]"
                    )}
                  >
                    {t === "ALL" ? "All Deals" : t === "SALE" ? "Sales Transactions" : "Rental Leases"}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {LEDGER_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setLedgerStatus(s);
                    setLedgerPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border cursor-pointer transition-colors",
                    ledgerStatus === s
                      ? "bg-[#C89B3C] text-[#07111F] border-[#C89B3C]"
                      : "bg-[#FCFBF7] text-[#6B7280] border-[#E8E1D4] hover:border-[#C89B3C]"
                  )}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#6B7280]" />
            <Input
              value={ledgerQ}
              onChange={(e) => {
                setLedgerQ(e.target.value);
                setLedgerPage(1);
              }}
              placeholder="Search deals by transaction no., property, or customer..."
              className="pl-10 h-10 border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-sm"
            />
          </div>

          {/* Ledger Table */}
          <div className="w-full max-w-full bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] shadow-xs overflow-hidden">
            {ledgerLoading ? (
              <div className="flex items-center justify-center py-16 text-[#6B7280] text-sm gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-[#C89B3C]" /> Loading transactions ledger...
              </div>
            ) : ledgerData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
                <Inbox className="h-9 w-9 text-[#C89B3C]" />
                <p className="text-sm font-bold text-[#07111F]">No transactions found</p>
                <p className="text-xs text-[#6B7280]">
                  {isAdmin
                    ? "Approved and completed property transactions will automatically record here."
                    : "Approved and completed rental leases will automatically record here."}
                </p>
              </div>
            ) : (
              <>
                {/* ─── DESKTOP & TABLET: HORIZONTAL SCROLL TABLE (Matching Bookings) ─── */}
                <div className="hidden md:block w-full max-w-full overflow-x-auto">
                  <table className={cn("w-full text-left border-collapse text-xs", isAdmin ? "min-w-[980px] lg:min-w-0" : "min-w-[880px] lg:min-w-0")}>
                    <thead className="bg-[#FAF6EC] text-[#475569] uppercase text-[10px] font-bold tracking-wider border-b border-[#E8E1D4]">
                      <tr>
                        <th className="py-2.5 pl-3 pr-2.5 w-[140px]">Txn No</th>
                        {isAdmin && <th className="py-2.5 px-2.5 w-[95px]">Type</th>}
                        <th className="py-2.5 px-2.5 w-[240px]">Property Listing</th>
                        <th className="py-2.5 px-2.5 w-[190px]">{isAdmin ? "Customer" : "Tenant"}</th>
                        {isAdmin && <th className="py-2.5 px-2.5 w-[150px]">Assigned Advisor</th>}
                        <th className="py-2.5 px-2.5 w-[120px]">Amount</th>
                        <th className="py-2.5 px-2.5 w-[110px]">Deal Status</th>
                        <th className="py-2.5 px-2.5 w-[115px]">Payment</th>
                        <th className="py-2.5 px-2.5 w-[110px]">Date</th>
                        <th className="py-3.5 pl-3 pr-4 text-right w-[115px]">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E1D4]/80">
                      {ledgerData.items.map((t) => {
                        const payment = t.payments?.[0];
                        return (
                          <tr key={t.id} className="hover:bg-[#FAF6EC]/70 transition-colors align-middle">
                            {/* Txn No */}
                            <td className="py-2.5 pl-3 pr-2.5 align-middle w-[140px] whitespace-nowrap">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F]/5 border border-[#E8E1D4] text-[#07111F] font-mono font-bold text-xs tracking-tight shadow-2xs">
                                <FileText className="h-3 w-3 text-[#C89B3C] shrink-0" />
                                <span>{t.txnNo}</span>
                              </div>
                            </td>

                            {/* Type (Admin only) */}
                            {isAdmin && (
                              <td className="py-2.5 px-2.5 align-middle w-[95px] whitespace-nowrap">
                                <span
                                  className={cn(
                                    "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-2xs",
                                    t.type === "SALE"
                                      ? "bg-amber-500/15 text-amber-950 border border-amber-500/40"
                                      : "bg-blue-500/15 text-blue-950 border border-blue-500/40"
                                  )}
                                >
                                  {t.type === "SALE" ? "Sale" : "Rental"}
                                </span>
                              </td>
                            )}

                            {/* Property Listing */}
                            <td className="py-2.5 px-2.5 align-middle w-[240px]">
                              <div className="flex items-center gap-3">
                                <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#07111F] to-[#1E293B] border border-[#E8E1D4] shrink-0 flex items-center justify-center shadow-2xs">
                                  {t.property?.images?.[0]?.url ? (
                                    <Image
                                      src={t.property.images[0].url}
                                      alt={t.property?.title || "Property"}
                                      fill
                                      sizes="44px"
                                      className="object-cover"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <Building2 className="h-5 w-5 text-[#C89B3C]" />
                                  )}
                                </div>
                                <div className="min-w-0 max-w-[170px] space-y-0.5">
                                  <Link
                                    href={`/properties/${t.property?.id}`}
                                    className="font-bold text-xs text-[#07111F] hover:text-[#C89B3C] transition-colors truncate block"
                                    target="_blank"
                                    title={t.property?.title}
                                  >
                                    {t.property?.title}
                                  </Link>
                                  <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                                    <MapPin className="h-3 w-3 text-[#C89B3C]" />
                                    <span className="truncate">{t.property?.city || "Location on file"}</span>
                                  </div>
                                  {t.rentalRequest && (
                                    <div className="text-[10px] font-medium text-[#8C6D23] flex items-center gap-1 mt-0.5 truncate">
                                      <Calendar className="h-2.5 w-2.5 text-[#C89B3C]" />
                                      <span>
                                        {fmt(t.rentalRequest.startDate)} → {fmt(t.rentalRequest.endDate)} ({t.rentalRequest.periods}×)
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Customer */}
                            <td className="py-2.5 px-2.5 align-middle w-[190px]">
                              <div className="flex items-center gap-2.5">
                                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#07111F] to-[#1E293B] text-[#D9B45B] border border-[#C89B3C]/30 flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                                  {getInitials(t.customer?.name)}
                                </div>
                                <div className="min-w-0 max-w-[140px] space-y-0.5">
                                  <p className="font-semibold text-xs text-[#07111F] truncate" title={t.customer?.name || "Anonymous Client"}>
                                    {t.customer?.name || "Anonymous Client"}
                                  </p>
                                  <p className="text-[11px] text-[#64748B] truncate" title={t.customer?.email || ""}>
                                    {t.customer?.email || "No email"}
                                  </p>
                                  {t.customer?.phone && (
                                    <p className="text-[10px] font-mono font-medium text-[#8C6D23] flex items-center gap-1 truncate">
                                      <Phone className="h-2.5 w-2.5 text-[#C89B3C]" />
                                      <span>{t.customer.phone}</span>
                                    </p>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Assigned Advisor (Admin only) */}
                            {isAdmin && (
                              <td className="py-2.5 px-2.5 align-middle w-[150px]">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EC] border border-[#E8E1D4] text-[11px] font-medium text-[#07111F] max-w-[140px]">
                                  <User className="h-3 w-3 text-[#C89B3C]" />
                                  <span className="truncate">{t.manager?.name || "Platform Direct"}</span>
                                </div>
                              </td>
                            )}

                            {/* Amount */}
                            <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[120px]">
                              <p className="font-serif font-black text-sm text-[#07111F] tracking-tight">
                                {formatPrice(t.amount)}
                              </p>
                              <p className="text-[10px] font-medium text-[#64748B]">Deal Volume</p>
                            </td>

                            {/* Deal Status */}
                            <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[110px]">
                              <StatusBadge status={t.status} />
                            </td>

                            {/* Payment */}
                            <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[115px]">
                              {payment ? (
                                <div className="space-y-1">
                                  <StatusBadge status={payment.status} />
                                  <p className="text-[10px] text-[#64748B] pl-1 font-medium">{payment.paymentMethod}</p>
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-700 border border-slate-300">
                                  Unpaid
                                </span>
                              )}
                            </td>

                            {/* Date */}
                            <td className="py-2.5 px-2.5 whitespace-nowrap align-middle w-[110px]">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#07111F]">
                                <Calendar className="h-3 w-3 text-[#C89B3C]" />
                                <span>{fmt(t.createdAt)}</span>
                              </div>
                            </td>

                            {/* Receipt */}
                            <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap align-middle w-[115px]">
                              {t.receipt ? (
                                <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                                  >
                                    <Link href={`/receipt/${t.receipt.id}`} target="_blank">
                                      <Receipt className="h-3 w-3 text-[#C89B3C]" /> Receipt
                                    </Link>
                                  </Button>
                              ) : t.status === "PAYMENT_PENDING" ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-950 border border-amber-500/40">
                                  <Clock className="h-2.5 w-2.5 text-amber-700" /> Awaiting Payment
                                </span>
                              ) : (
                                <span className="text-[#9CA3AF] text-xs italic">Not Settled</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ─── MOBILE: RESPONSIVE CARDS VIEW (Matching Bookings) ─── */}
                <div className="block md:hidden divide-y divide-[#E8E1D4]/80">
                  {ledgerData.items.map((t) => {
                    const payment = t.payments?.[0];
                    return (
                      <div key={t.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F]/5 border border-[#E8E1D4] text-[#07111F] font-mono font-bold text-xs">
                            <FileText className="h-3 w-3 text-[#C89B3C]" />
                            <span>{t.txnNo}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isAdmin && (
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                  t.type === "SALE"
                                    ? "bg-amber-500/15 text-amber-950 border border-amber-500/40"
                                    : "bg-blue-500/15 text-blue-950 border border-blue-500/40"
                                )}
                              >
                                {t.type === "SALE" ? "Sale" : "Rental"}
                              </span>
                            )}
                            <StatusBadge status={t.status} />
                          </div>
                        </div>

                        {/* Property Listing */}
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-12 rounded-xl overflow-hidden bg-gradient-to-br from-[#07111F] to-[#1E293B] border border-[#E8E1D4] shrink-0 flex items-center justify-center">
                            {t.property?.images?.[0]?.url ? (
                              <Image
                                src={t.property.images[0].url}
                                alt={t.property?.title || "Property"}
                                fill
                                sizes="48px"
                                className="object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <Building2 className="h-5 w-5 text-[#C89B3C]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 space-y-0.5">
                            <Link
                              href={`/properties/${t.property?.id}`}
                              className="font-bold text-xs text-[#07111F] hover:text-[#C89B3C] transition-colors truncate block"
                              target="_blank"
                            >
                              {t.property?.title}
                            </Link>
                            <div className="flex items-center gap-1 text-[11px] text-[#64748B]">
                              <MapPin className="h-3 w-3 text-[#C89B3C]" />
                              <span className="truncate">{t.property?.city || "Location on file"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Details Info Grid */}
                        <div className="bg-[#FAF6EC]/80 rounded-xl p-3 text-xs space-y-2 border border-[#E8E1D4]">
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] text-[11px]">{isAdmin ? "Customer:" : "Tenant:"}</span>
                            <span className="font-semibold text-[#07111F] truncate max-w-[180px]">
                              {t.customer?.name || "Anonymous Client"}
                            </span>
                          </div>
                          {isAdmin && (
                            <div className="flex items-center justify-between">
                              <span className="text-[#64748B] text-[11px]">Advisor:</span>
                              <span className="font-medium text-[#07111F] truncate max-w-[180px]">
                                {t.manager?.name || "Platform Direct"}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] text-[11px]">Deal Amount:</span>
                            <span className="font-serif font-black text-sm text-[#07111F]">
                              {formatPrice(t.amount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] text-[11px]">Payment:</span>
                            {payment ? (
                              <StatusBadge status={payment.status} />
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-700 border border-slate-300">
                                Unpaid
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#64748B] text-[11px]">Date:</span>
                            <span className="font-medium text-[#07111F] text-[11px] flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-[#C89B3C]" />
                              {fmt(t.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex items-center justify-end pt-1">
                          {t.receipt ? (
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                            >
                              <Link href={`/receipt/${t.receipt.id}`} target="_blank">
                                <Receipt className="h-3.5 w-3.5 text-[#C89B3C]" /> Receipt
                              </Link>
                            </Button>
                          ) : t.status === "PAYMENT_PENDING" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-950 border border-amber-500/40">
                              <Clock className="h-2.5 w-2.5 text-amber-700" /> Awaiting Payment
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF] text-xs italic">Not Settled</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Ledger Pagination */}
          {ledgerData.totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-[#6B7280]">
              <span>
                {ledgerData.total} deals recorded · Page {ledgerPage} of {ledgerData.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ledgerPage <= 1}
                  onClick={() => setLedgerPage((p) => p - 1)}
                  className="h-8 rounded-lg border-[#E8E1D4]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={ledgerPage >= ledgerData.totalPages}
                  onClick={() => setLedgerPage((p) => p + 1)}
                  className="h-8 rounded-lg border-[#E8E1D4]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================================================================ */}
      {/* 5. PAYMENT BREAKDOWN SLIP MODAL                                  */}
      {/* ================================================================ */}
      {selectedPayment && (
        <Dialog open={!!selectedPayment} onOpenChange={(open) => !open && setSelectedPayment(null)}>
          <DialogContent className="max-w-md bg-[#FCFBF7] border border-[#E8E1D4] rounded-3xl p-6 shadow-2xl">
            <DialogHeader className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold w-fit">
                <ShieldCheck className="h-3 w-3 text-[#C89B3C]" /> Certified Escrow Slip
              </div>
              <DialogTitle className="font-serif font-black text-xl text-[#07111F]">
                Payment Breakdown
              </DialogTitle>
              <DialogDescription className="text-xs text-[#6B7280] font-mono">
                {selectedPayment.transactionRef}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              {/* Highlight Amount Banner */}
              <div className="p-4 rounded-2xl bg-[#07111F] border border-[#C89B3C]/30 text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#D9B45B] tracking-wider block">
                    Settled Amount
                  </span>
                  <p className="text-2xl font-black font-serif text-[#FCFBF7]">
                    {formatPrice(selectedPayment.amount)}
                  </p>
                  <p className="text-[10px] text-slate-300 mt-0.5 font-mono">
                    Method: {selectedPayment.paymentMethod || "Direct Settlement"}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                      selectedPayment.status === "PAID"
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-700/50"
                        : "bg-amber-950 text-amber-300 border border-amber-700/50"
                    )}
                  >
                    <CheckCircle2 className="h-3 w-3" /> {selectedPayment.status}
                  </span>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#F7F3EA] border border-[#E8E1D4]">
                  <span className="text-[10px] font-bold uppercase text-[#6B7280] block mb-1">
                    Client / Payer
                  </span>
                  <p className="font-bold text-[#07111F] truncate">{selectedPayment.customer?.name}</p>
                  <p className="text-[11px] text-[#6B7280] truncate">{selectedPayment.customer?.email}</p>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F3EA] border border-[#E8E1D4]">
                  <span className="text-[10px] font-bold uppercase text-[#6B7280] block mb-1">
                    Advisor / Agent
                  </span>
                  <p className="font-bold text-[#07111F] truncate">
                    {selectedPayment.manager?.name || "Kiro-Maal Concierge"}
                  </p>
                  <p className="text-[11px] text-[#6B7280] truncate">
                    {selectedPayment.manager?.email || "Platform Direct"}
                  </p>
                </div>
              </div>

              {selectedPayment.property && (
                <div className="p-3 rounded-xl bg-[#F7F3EA] border border-[#E8E1D4] text-xs">
                  <span className="text-[10px] font-bold uppercase text-[#6B7280] block mb-1">
                    Property Asset
                  </span>
                  <p className="font-bold text-[#07111F]">{selectedPayment.property.title}</p>
                  <p className="text-[11px] text-[#6B7280]">{selectedPayment.property.city}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-[#6B7280] px-1">
                <span>Recorded On:</span>
                <span className="font-semibold text-[#07111F]">
                  {new Date(selectedPayment.createdAt).toLocaleString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E1D4]">
              {selectedPayment.receipt && (
                <Button
                    asChild
                    size="sm"
                    className="bg-[#07111F] hover:bg-[#07111F]/90 text-[#D9B45B] text-xs rounded-xl gap-1.5 cursor-pointer"
                  >
                    <Link href={`/receipt/${selectedPayment.receipt.id}`} target="_blank">
                      <Receipt className="h-3.5 w-3.5 text-[#C89B3C]" /> View Official Receipt
                    </Link>
                  </Button>
              )}
              {selectedPayment.property && (
                <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="border-[#E8E1D4] text-xs rounded-xl gap-1 cursor-pointer"
                  >
                    <Link href={`/properties/${selectedPayment.property.id}`} target="_blank">
                      <ExternalLink className="h-3 w-3" /> View Listing
                    </Link>
                  </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelectedPayment(null)}
                className="text-xs rounded-xl text-[#6B7280]"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
