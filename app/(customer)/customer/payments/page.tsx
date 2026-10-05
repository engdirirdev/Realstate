// ================================================================
// PAGE NAME  : Customer Portal — Payments & Receipts
// ROUTE      : /customer/payments
// DESCRIPTION: View customer payments history and receipt references
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreditCard, CheckCircle2, Building2, Calendar, FileText, Download, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment History & Receipts – Customer Portal | Kiro-Maal Real Estate" };

export default async function CustomerPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const payments = await prisma.payment.findMany({
    where: { customerId: session.user.id },
    include: {
      property: { select: { id: true, title: true, city: true } },
      booking: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Financial Settlements
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <CreditCard className="h-7 w-7 text-[#C89B3C]" /> Payment History &amp; Official Receipts
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">{payments.length} verified escrow settlements recorded</p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <CreditCard className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No payment receipts yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            When you complete a luxury property reservation settlement, your official certified receipt will appear here.
          </p>
          <Link
            href="/customer/properties"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Transaction Ref</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Property</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Payment Method</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Amount Paid</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Status</th>
                  <th className="text-left px-4 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Date</th>
                  <th className="text-right px-5 py-3.5 font-bold uppercase tracking-wider text-xs text-[#07111F]">Receipt Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                    <td className="px-5 py-4 font-bold text-[#07111F] font-mono text-xs">
                      {p.transactionRef}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#07111F]">
                      {p.property?.title || "Property Reservation"}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {p.paymentMethod}
                    </td>
                    <td className="px-4 py-4 font-serif font-bold text-[#07111F] text-sm">
                      {formatPrice(p.amount)} {p.currency}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-[#D9B45B]" /> {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#6B7280]">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#A97918] bg-[#F7F3EA] px-3 py-1 rounded-lg border border-[#E8E1D4]">
                        <FileText className="h-3.5 w-3.5 text-[#C89B3C]" /> Certified Receipt
                      </span>
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
