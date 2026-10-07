"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
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
  AlertCircle,
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
  const [activeTab, setActiveTab] = useState<"payments" | "ledger">(initialTab);
  const [selectedPayment, setSelectedPayment] = useState<any | null>(null);

  // Sync initialTab when route or parent prop changes
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (newTab: "payments" | "ledger") => {
    setActiveTab(newTab);
    if (typeof window !== "undefined" && isAdmin) {
      const target = newTab === "ledger" ? "/admin/transactions" : "/admin/payments";
      if (window.location.pathname !== target) {
        window.history.replaceState(null, "", target);
      }
    }
  };

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
    const t = setTimeout(loadLedger, ledgerQ ? 300 : 0);
    return () => clearTimeout(t);
  }, [loadLedger, ledgerQ]);

  // Unified metrics
  const totalSettlement = paymentsData.totalRevenue || ledgerData.revenue || 0;
  const verifiedCount = paymentsData.totalPaidTransactions || 0;
  const totalDealsCount = ledgerData.total || paymentsData.totalDeals || 0;

  return (
    <div className="space-y-6">
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

        {/* Card 3: Total Recorded Deals */}
        <div className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex items-center justify-between transition-all hover:border-[#C89B3C]/50">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              {isAdmin ? "Total Deal Agreements" : "Total Rental Agreements"}
            </p>
            <p className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] mt-1">
              {totalDealsCount}
            </p>
            <p className="text-[11px] text-[#A97918] mt-0.5 font-medium">
              {isAdmin ? "Sales Acquisitions & Leases" : "Verified Rental Leases"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner shrink-0">
            <ScrollText className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* 2. UNIFIED TAB SWITCHER (Payments & Escrow FIRST, Ledger SECOND) */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 bg-[#FCFBF7] border border-[#E8E1D4] rounded-2xl shadow-xs">
        <div className="flex items-center gap-1.5 flex-1">
          {/* 1st Tab: Payments & Escrow */}
          <button
            type="button"
            onClick={() => handleTabChange("payments")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "payments"
                ? "bg-[#07111F] text-[#D9B45B] shadow-sm shadow-[#07111F]/20"
                : "text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA]"
            )}
          >
            <CreditCard className="w-4 h-4 text-[#C89B3C]" />
            <span>Payments &amp; Escrow</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono",
                activeTab === "payments" ? "bg-white/15 text-[#FCFBF7]" : "bg-[#E8E1D4] text-[#07111F]"
              )}
            >
              {paymentsData.payments.length}
            </span>
          </button>

          {/* 2nd Tab: Transactions Ledger */}
          <button
            type="button"
            onClick={() => handleTabChange("ledger")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "ledger"
                ? "bg-[#07111F] text-[#D9B45B] shadow-sm shadow-[#07111F]/20"
                : "text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA]"
            )}
          >
            <ScrollText className="w-4 h-4 text-[#C89B3C]" />
            <span>{isAdmin ? "Transactions Ledger" : "Rental Leases Ledger"}</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-mono",
                activeTab === "ledger" ? "bg-white/15 text-[#FCFBF7]" : "bg-[#E8E1D4] text-[#07111F]"
              )}
            >
              {ledgerData.total}
            </span>
          </button>
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
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs">
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
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF6EC] text-[#475569] uppercase text-[10px] font-bold tracking-wider border-b border-[#E8E1D4]">
                    <tr>
                      <th className="text-left py-3.5 pl-4 pr-3">Transaction Ref</th>
                      <th className="text-left py-3.5 px-3">Property Listing</th>
                      <th className="text-left py-3.5 px-3">{isAdmin ? "Client / Buyer" : "Client / Tenant"}</th>
                      {isAdmin && <th className="text-left py-3.5 px-3">Assigned Advisor</th>}
                      <th className="text-left py-3.5 px-3">Settlement Amount</th>
                      <th className="text-left py-3.5 px-3">Payment Method</th>
                      <th className="text-left py-3.5 px-3">Escrow Status</th>
                      <th className="text-left py-3.5 px-3">Date</th>
                      <th className="text-right py-3.5 pl-3 pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D4]/80">
                    {paymentsData.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-[#FAF6EC]/70 transition-colors align-middle">
                        {/* Transaction Ref */}
                        <td className="py-3.5 pl-4 pr-3 align-middle">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F]/5 border border-[#E8E1D4] text-[#07111F] font-mono font-bold text-xs tracking-tight shadow-2xs">
                            <CreditCard className="h-3 w-3 text-[#C89B3C] shrink-0" />
                            <span>{p.transactionRef}</span>
                          </div>
                        </td>

                        {/* Property Listing */}
                        <td className="py-3.5 px-3 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#07111F] to-[#1E293B] border border-[#E8E1D4] shrink-0 flex items-center justify-center shadow-2xs">
                              {p.property?.images?.[0]?.url ? (
                                <img
                                  src={p.property.images[0].url}
                                  alt={p.property?.title || "Property"}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <Building2 className="h-5 w-5 text-[#C89B3C]" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-[220px] space-y-0.5">
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
                        <td className="py-3.5 px-3 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#07111F] to-[#1E293B] text-[#D9B45B] border border-[#C89B3C]/30 flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                              {getInitials(p.customer?.name)}
                            </div>
                            <div className="min-w-0 space-y-0.5">
                              <p className="font-semibold text-xs text-[#07111F] truncate">{p.customer?.name || "Anonymous Client"}</p>
                              <p className="text-[11px] text-[#64748B] truncate">{p.customer?.email || "No email"}</p>
                              {p.customer?.phone && (
                                <p className="text-[10px] font-mono font-medium text-[#8C6D23] flex items-center gap-1">
                                  <Phone className="h-2.5 w-2.5 text-[#C89B3C]" />
                                  <span>{p.customer.phone}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Assigned Advisor (Admin only) */}
                        {isAdmin && (
                          <td className="py-3.5 px-3 align-middle">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EC] border border-[#E8E1D4] text-[11px] font-medium text-[#07111F]">
                              <User className="h-3 w-3 text-[#C89B3C]" />
                              <span>{p.manager?.name || "Kiro-Maal Concierge"}</span>
                            </div>
                          </td>
                        )}

                        {/* Settlement Amount */}
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <p className="font-serif font-black text-sm text-[#07111F] tracking-tight">
                            {formatPrice(p.amount)}
                          </p>
                          <p className="text-[10px] font-medium text-[#64748B]">Settled Funds</p>
                        </td>

                        {/* Payment Method */}
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF6EC] border border-[#E8E1D4] text-[11px] font-medium text-[#07111F]">
                            {p.paymentMethod || "Direct Settlement"}
                          </span>
                        </td>

                        {/* Escrow Status */}
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#07111F]">
                            <Calendar className="h-3 w-3 text-[#C89B3C]" />
                            <span>{fmt(p.createdAt)}</span>
                          </div>
                        </td>

                        {/* Action */}
                        <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap align-middle">
                          <div className="flex items-center justify-end gap-1.5">
                            {p.receipt ? (
                              <Link href={`/receipt/${p.receipt.id}`} target="_blank">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                                >
                                  <Receipt className="h-3 w-3 text-[#C89B3C]" /> Receipt
                                </Button>
                              </Link>
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
          <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-xs">
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
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-[#FAF6EC] text-[#475569] uppercase text-[10px] font-bold tracking-wider border-b border-[#E8E1D4]">
                    <tr>
                      <th className="text-left py-3.5 pl-4 pr-3">Txn No</th>
                      {isAdmin && <th className="text-left py-3.5 px-3">Type</th>}
                      <th className="text-left py-3.5 px-3">Property Listing</th>
                      <th className="text-left py-3.5 px-3">{isAdmin ? "Customer" : "Tenant"}</th>
                      {isAdmin && <th className="text-left py-3.5 px-3">Assigned Advisor</th>}
                      <th className="text-left py-3.5 px-3">Amount</th>
                      <th className="text-left py-3.5 px-3">Deal Status</th>
                      <th className="text-left py-3.5 px-3">Payment</th>
                      <th className="text-left py-3.5 px-3">Date</th>
                      <th className="text-right py-3.5 pl-3 pr-4">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E1D4]/80">
                    {ledgerData.items.map((t) => {
                      const payment = t.payments?.[0];
                      return (
                        <tr key={t.id} className="hover:bg-[#FAF6EC]/70 transition-colors align-middle">
                          {/* Txn No */}
                          <td className="py-3.5 pl-4 pr-3 align-middle">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#07111F]/5 border border-[#E8E1D4] text-[#07111F] font-mono font-bold text-xs tracking-tight shadow-2xs">
                              <FileText className="h-3 w-3 text-[#C89B3C] shrink-0" />
                              <span>{t.txnNo}</span>
                            </div>
                          </td>

                          {/* Type (Admin only) */}
                          {isAdmin && (
                            <td className="py-3.5 px-3 align-middle">
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
                          <td className="py-3.5 px-3 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#07111F] to-[#1E293B] border border-[#E8E1D4] shrink-0 flex items-center justify-center shadow-2xs">
                                {t.property?.images?.[0]?.url ? (
                                  <img
                                    src={t.property.images[0].url}
                                    alt={t.property?.title || "Property"}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <Building2 className="h-5 w-5 text-[#C89B3C]" />
                                )}
                              </div>
                              <div className="min-w-0 max-w-[220px] space-y-0.5">
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
                                  <div className="text-[10px] font-medium text-[#8C6D23] flex items-center gap-1 mt-0.5">
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
                          <td className="py-3.5 px-3 align-middle">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#07111F] to-[#1E293B] text-[#D9B45B] border border-[#C89B3C]/30 flex items-center justify-center font-bold text-[11px] shrink-0 shadow-2xs">
                                {getInitials(t.customer?.name)}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <p className="font-semibold text-xs text-[#07111F] truncate">{t.customer?.name || "Anonymous Client"}</p>
                                <p className="text-[11px] text-[#64748B] truncate">{t.customer?.email || "No email"}</p>
                                {t.customer?.phone && (
                                  <p className="text-[10px] font-mono font-medium text-[#8C6D23] flex items-center gap-1">
                                    <Phone className="h-2.5 w-2.5 text-[#C89B3C]" />
                                    <span>{t.customer.phone}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Assigned Advisor (Admin only) */}
                          {isAdmin && (
                            <td className="py-3.5 px-3 align-middle">
                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF6EC] border border-[#E8E1D4] text-[11px] font-medium text-[#07111F]">
                                <User className="h-3 w-3 text-[#C89B3C]" />
                                <span>{t.manager?.name || "Platform Direct"}</span>
                              </div>
                            </td>
                          )}

                          {/* Amount */}
                          <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                            <p className="font-serif font-black text-sm text-[#07111F] tracking-tight">
                              {formatPrice(t.amount)}
                            </p>
                            <p className="text-[10px] font-medium text-[#64748B]">Deal Volume</p>
                          </td>

                          {/* Deal Status */}
                          <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                            <StatusBadge status={t.status} />
                          </td>

                          {/* Payment */}
                          <td className="py-3.5 px-3 whitespace-nowrap align-middle">
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
                          <td className="py-3.5 px-3 whitespace-nowrap align-middle">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#07111F]">
                              <Calendar className="h-3 w-3 text-[#C89B3C]" />
                              <span>{fmt(t.createdAt)}</span>
                            </div>
                          </td>

                          {/* Receipt */}
                          <td className="py-3.5 pl-3 pr-4 text-right whitespace-nowrap align-middle">
                            {t.receipt ? (
                              <Link href={`/receipt/${t.receipt.id}`} target="_blank">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs rounded-lg border-[#E8E1D4] hover:border-[#C89B3C] text-[#07111F] bg-[#FCFBF7] gap-1 cursor-pointer font-medium"
                                >
                                  <Receipt className="h-3 w-3 text-[#C89B3C]" /> Receipt
                                </Button>
                              </Link>
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
                <Link href={`/receipt/${selectedPayment.receipt.id}`} target="_blank">
                  <Button
                    size="sm"
                    className="bg-[#07111F] hover:bg-[#07111F]/90 text-[#D9B45B] text-xs rounded-xl gap-1.5 cursor-pointer"
                  >
                    <Receipt className="h-3.5 w-3.5 text-[#C89B3C]" /> View Official Receipt
                  </Button>
                </Link>
              )}
              {selectedPayment.property && (
                <Link href={`/properties/${selectedPayment.property.id}`} target="_blank">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#E8E1D4] text-xs rounded-xl gap-1 cursor-pointer"
                  >
                    <ExternalLink className="h-3 w-3" /> View Listing
                  </Button>
                </Link>
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
