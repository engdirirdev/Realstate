// ================================================================
// PAGE NAME  : Admin Dashboard — Finance & Transactions
// ROUTE      : /admin/payments
// DESCRIPTION: Platform-wide transactions, revenue summary, and customer payments
//              Kiro-Maal Real Estate Master Design System
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreditCard, DollarSign, TrendingUp, CheckCircle2, Building2, User, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Finance & Payments – Admin | Kiro-Maal Real Estate" };

export default async function AdminPaymentsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/dashboard");

  const [payments, revenueAggregate] = await Promise.all([
    prisma.payment.findMany({
      include: {
        property: { select: { id: true, title: true, city: true } },
        customer: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.aggregate({
      where: { status: "PAID" },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalPlatformRevenue = revenueAggregate._sum.amount || 0;
  const totalPaidTransactions = revenueAggregate._count.id || 0;

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Fiscal Intelligence
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <CreditCard className="h-7 w-7 text-[#C89B3C]" /> Platform Transactions &amp; Escrow
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Platform-wide financial metrics, completed customer settlements, and revenue reporting.</p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#FCFBF7] rounded-2xl p-6 shadow-sm border border-[#E8E1D4] flex items-center justify-between transition-all hover:border-[#C89B3C]/50">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Total Platform Settlement Volume</p>
            <p className="text-3xl font-serif font-bold text-[#07111F] mt-1.5">{formatPrice(totalPlatformRevenue)}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner p-3">
            <TrendingUp className="h-7 w-7" />
          </div>
        </div>

        <div className="bg-[#FCFBF7] rounded-2xl p-6 shadow-sm border border-[#E8E1D4] flex items-center justify-between transition-all hover:border-[#C89B3C]/50">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Verified Completed Transactions</p>
            <p className="text-3xl font-serif font-bold text-[#07111F] mt-1.5">{totalPaidTransactions}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] border border-[#C89B3C]/40 flex items-center justify-center text-[#D9B45B] shadow-inner p-3">
            <CreditCard className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
              <tr>
                <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Transaction Ref</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Property Listing</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Client / Buyer</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Assigned Advisor</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Amount</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Settlement Status</th>
                <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Transaction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E1D4]">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[#9CA3AF]">
                    <CreditCard className="h-10 w-10 mx-auto mb-2 text-[#C89B3C]/40" />
                    No platform transactions recorded yet.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#07111F] font-mono text-xs">
                      {p.transactionRef}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#07111F]">
                      {p.property?.title || "Property Listing"}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {p.customer?.name}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {p.manager?.name || "Kiro-Maal Concierge"}
                    </td>
                    <td className="px-4 py-4 font-serif font-bold text-[#07111F] text-sm">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-[#D9B45B]" /> {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
