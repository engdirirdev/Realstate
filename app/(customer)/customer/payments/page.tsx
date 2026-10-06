// ================================================================
// PAGE NAME  : Customer Portal — Payments & Receipts
// ROUTE      : /customer/payments
// DESCRIPTION: View customer payments history, transaction types, and certified receipts
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreditCard, CheckCircle2, Building2, Calendar, FileText, Download, Sparkles, ExternalLink } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & Receipts – Customer Portal | Kiro-Maal Real Estate",
};

export default async function CustomerPaymentsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const payments = await prisma.payment.findMany({
    where: { customerId: session.user.id },
    include: {
      property: { select: { id: true, title: true, city: true } },
      booking: { select: { id: true, status: true } },
      receipt: { select: { id: true, receiptNo: true } },
      transaction: { select: { id: true, type: true, txnNo: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Financial Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <CreditCard className="h-7 w-7 text-[#C89B3C]" /> Payment History &amp; Official Receipts
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          {payments.length} verified escrow and lease transactions recorded on your account
        </p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-xs border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <CreditCard className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No payment records yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            When you complete a lease payment or property purchase settlement, your verified receipt will appear here.
          </p>
          <Link
            href="/customer/properties"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs hover:brightness-105"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-xs border border-[#E8E1D4] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F3EA] border-b border-[#E8E1D4] text-[#6B7280] uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold">Transaction Ref</th>
                  <th className="text-left px-4 py-3.5 font-bold">Property</th>
                  <th className="text-left px-4 py-3.5 font-bold">Type</th>
                  <th className="text-left px-4 py-3.5 font-bold">Payment Method</th>
                  <th className="text-left px-4 py-3.5 font-bold">Amount Paid</th>
                  <th className="text-left px-4 py-3.5 font-bold">Status</th>
                  <th className="text-left px-4 py-3.5 font-bold">Date</th>
                  <th className="text-right px-5 py-3.5 font-bold">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4]">
                {payments.map((p) => {
                  const txType = p.transaction?.type === "SALE" ? "Purchase" : "Rental";
                  return (
                    <tr key={p.id} className="hover:bg-[#F7F3EA]/50 transition-colors">
                      <td className="px-5 py-3.5 font-bold text-[#07111F] font-mono text-xs">
                        {p.transactionRef || p.transaction?.txnNo || "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#07111F]">{p.property?.title || "Property Settlement"}</p>
                        {p.property?.city && <p className="text-[10px] text-[#6B7280]">{p.property.city}</p>}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#07111F]">
                        {txType}
                      </td>
                      <td className="px-4 py-3.5 text-[#6B7280]">
                        {p.paymentMethod}
                      </td>
                      <td className="px-4 py-3.5 font-serif font-bold text-[#07111F] text-sm">
                        {formatPrice(p.amount)} {p.currency}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-green-100 text-green-800 border border-green-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 text-green-700" /> {p.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-[#6B7280]">
                        {new Date(p.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {p.receipt ? (
                          <Link
                            href={`/receipt/${p.receipt.id}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#C89B3C]/50 text-[#A97918] hover:bg-[#F7F3EA] text-xs font-bold transition-all shadow-2xs"
                          >
                            <FileText className="h-3.5 w-3.5 text-[#C89B3C]" />
                            <span>Receipt #{p.receipt.receiptNo}</span>
                          </Link>
                        ) : (
                          <span className="text-[11px] text-[#94A3B8] italic">Processing</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
