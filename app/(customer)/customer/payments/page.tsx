// ================================================================
// PAGE NAME  : Customer Portal — Payments & Receipts
// ROUTE      : /customer/payments
// DESCRIPTION: View customer payments history and receipt references
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { CreditCard, CheckCircle2, Building2, Calendar, FileText, Download } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Payment History & Receipts – Customer Portal" };

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
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <CreditCard className="h-6 w-6 text-[#10B981]" /> Payment History & Receipts
        </h1>
        <p className="text-[#64748B] text-sm mt-1">{payments.length} transactions recorded</p>
      </div>

      {payments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <CreditCard className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No payment receipts yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto mb-6">
            When you complete a property booking payment, your official transaction receipt will appear here.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold text-[#64748B]">Transaction Ref</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Property</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Payment Method</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Amount Paid</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Status</th>
                  <th className="text-left px-4 py-3.5 font-semibold text-[#64748B]">Date</th>
                  <th className="text-right px-5 py-3.5 font-semibold text-[#64748B]">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-5 py-4 font-bold text-[#0F172A] font-mono text-xs">
                      {p.transactionRef}
                    </td>
                    <td className="px-4 py-4 text-xs font-semibold text-[#0F172A]">
                      {p.property?.title || "Property Reservation"}
                    </td>
                    <td className="px-4 py-4 text-xs text-[#64748B]">
                      {p.paymentMethod}
                    </td>
                    <td className="px-4 py-4 font-bold text-[#059669]">
                      {formatPrice(p.amount)} {p.currency}
                    </td>
                    <td className="px-4 py-4">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0] inline-flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#94A3B8]">
                      {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#10B981] bg-[#ECFDF5] px-3 py-1 rounded-lg border border-[#A7F3D0]">
                        <FileText className="h-3.5 w-3.5" /> Receipt Verified
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
