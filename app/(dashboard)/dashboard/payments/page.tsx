// ================================================================
// PAGE NAME  : Manager Dashboard — Payments & Earnings
// ROUTE      : /dashboard/payments
// DESCRIPTION: Manager earnings view and transaction log for properties
// ROLE       : USER / Manager
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CreditCard, DollarSign, CheckCircle2, Building2, TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payments & Earnings – Manager Dashboard" };

export default async function ManagerPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [payments, aggregate] = await Promise.all([
    prisma.payment.findMany({
      where: { managerId: session.user.id },
      include: {
        property: { select: { id: true, title: true, city: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.payment.aggregate({
      where: { managerId: session.user.id, status: "PAID" },
      _sum: { amount: true },
      _count: { id: true },
    }),
  ]);

  const totalEarnings = aggregate._sum.amount || 0;
  const totalTransactions = aggregate._count.id || 0;

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <CreditCard className="h-6 w-6 text-[#10B981]" /> Payments &amp; Property Earnings
        </h1>
        <p className="text-[#64748B] text-sm mt-1">Track financial transactions and total revenue generated from your property portfolio.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Total Revenue Earned</p>
            <p className="text-3xl font-extrabold text-[#059669] mt-1">{formatPrice(totalEarnings)}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center text-[#10B981]">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-card border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Paid Transactions</p>
            <p className="text-3xl font-extrabold text-[#0F172A] mt-1">{totalTransactions}</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center text-[#0F172A]">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <CreditCard className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No payment transactions recorded yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto">
            Payments processed for your properties will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">Transaction Ref</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Property</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Customer</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Amount</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Status</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#0F172A] font-mono text-xs">
                      {p.transactionRef}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#0F172A]">
                      {p.property?.title || "Property Listing"}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#64748B]">
                      {p.customer?.name} ({p.customer?.email})
                    </td>
                    <td className="px-4 py-4 font-bold text-[#059669]">
                      {formatPrice(p.amount)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#94A3B8]">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
