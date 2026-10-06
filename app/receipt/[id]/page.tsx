import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, ShieldCheck, Printer, ArrowLeft, Building2, Calendar, User, FileText } from "lucide-react";
import PrintButton from "./PrintButton";

type Props = { params: Promise<{ id: string }> };

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  const receipt = await prisma.receipt.findUnique({
    where: { id },
    include: {
      transaction: {
        include: {
          property: { select: { id: true, title: true, city: true, address: true, listingType: true } },
          customer: { select: { id: true, name: true, email: true, phone: true } },
          manager: { select: { id: true, name: true, email: true } },
        },
      },
      payment: true,
    },
  });

  if (!receipt) notFound();

  // Access control: customer who made it, manager of the property, or admin
  const user = session?.user;
  const isCustomer = user?.id === receipt.transaction.customerId;
  const isManager = user?.id === receipt.transaction.managerId;
  const isAdmin = (user as any)?.role === "ADMIN";

  if (!isCustomer && !isManager && !isAdmin) {
    return (
      <div className="min-h-screen bg-[#F7F3EA] flex items-center justify-center p-4">
        <div className="bg-[#FCFBF7] border border-[#E8E1D4] rounded-3xl p-8 max-w-md text-center space-y-4">
          <p className="text-sm font-bold text-red-600">Unauthorized Access</p>
          <p className="text-xs text-[#6B7280]">You do not have permission to view this official transaction receipt.</p>
          <Link
            href="/login"
            className="inline-block px-5 py-2.5 rounded-xl bg-[#07111F] text-[#D9B45B] text-xs font-bold"
          >
            Sign in to Authorized Account
          </Link>
        </div>
      </div>
    );
  }

  let details: any = {};
  try {
    details = JSON.parse(receipt.details);
  } catch {
    details = {};
  }

  const { transaction, payment } = receipt;
  const isRental = transaction.type === "RENTAL";

  return (
    <div className="min-h-screen bg-[#F7F3EA] py-8 px-4 sm:px-6 print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Navigation & Print Actions (Hidden on print) */}
        <div className="flex items-center justify-between gap-3 print:hidden">
          <Link
            href={isAdmin ? "/admin/transactions" : isManager ? "/dashboard/transactions" : "/customer/transactions"}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07111F] hover:text-[#C89B3C] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Portal
          </Link>
          <PrintButton />
        </div>

        {/* Receipt Card */}
        <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] shadow-sm p-8 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
          {/* Header */}
          <div className="border-b border-[#E8E1D4] pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-8 h-8 rounded-xl bg-[#07111F] flex items-center justify-center text-[#D9B45B] font-serif font-black text-sm">
                  KM
                </span>
                <span className="font-serif font-black text-xl text-[#07111F]">Kiro-Maal</span>
              </div>
              <p className="text-[11px] text-[#6B7280]">Official Real Estate Transaction Receipt</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Payment Completed
              </span>
              <p className="font-mono text-xs font-bold text-[#07111F]">{receipt.receiptNo}</p>
              <p className="text-[11px] text-[#6B7280]">
                Issued {new Date(receipt.issuedAt).toLocaleDateString()} at {new Date(receipt.issuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Transaction Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#F7F3EA] border border-[#E8E1D4] space-y-2">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Customer Details</span>
              <p className="font-bold text-[#07111F] text-sm">{transaction.customer.name}</p>
              <p className="text-[#6B7280]">{transaction.customer.email}</p>
              {transaction.customer.phone && <p className="text-[#6B7280]">{transaction.customer.phone}</p>}
            </div>

            <div className="p-4 rounded-2xl bg-[#F7F3EA] border border-[#E8E1D4] space-y-2">
              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Property & Manager</span>
              <p className="font-bold text-[#07111F] text-sm">{transaction.property.title}</p>
              <p className="text-[#6B7280]">
                {transaction.property.address ? `${transaction.property.address}, ` : ""}
                {transaction.property.city}
              </p>
              <p className="text-[#6B7280]">Manager: {transaction.manager?.name || "Direct Platform"}</p>
            </div>
          </div>

          {/* Breakdown Table */}
          <div className="space-y-3">
            <h3 className="font-serif font-black text-sm text-[#07111F] uppercase tracking-wider">
              Payment Breakdown
            </h3>
            <div className="border border-[#E8E1D4] rounded-2xl overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-[#F7F3EA] text-[#6B7280] text-[10px] uppercase">
                  <tr>
                    <th className="p-3 text-left">Item Description</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E1D4]">
                  {isRental ? (
                    <>
                      <tr>
                        <td className="p-3">
                          <p className="font-semibold text-[#07111F]">
                            Rental Lease ({details.periods || 1} × {details.rentalPeriod || "Monthly"})
                          </p>
                          <p className="text-[11px] text-[#6B7280]">
                            Period: {details.startDate ? new Date(details.startDate).toLocaleDateString() : ""} →{" "}
                            {details.endDate ? new Date(details.endDate).toLocaleDateString() : ""}
                          </p>
                        </td>
                        <td className="p-3 text-right font-semibold text-[#07111F]">
                          {formatPrice(details.rentAmount || payment.amount)}
                        </td>
                      </tr>
                      {details.securityDeposit > 0 && (
                        <tr>
                          <td className="p-3">
                            <p className="font-semibold text-[#07111F]">Refundable Security Deposit</p>
                            <p className="text-[11px] text-[#6B7280]">Held securely during the tenancy period</p>
                          </td>
                          <td className="p-3 text-right font-semibold text-[#07111F]">
                            {formatPrice(details.securityDeposit)}
                          </td>
                        </tr>
                      )}
                    </>
                  ) : (
                    <tr>
                      <td className="p-3">
                        <p className="font-semibold text-[#07111F]">Property Purchase Settlement</p>
                        <p className="text-[11px] text-[#6B7280]">Direct title acquisition transfer</p>
                      </td>
                      <td className="p-3 text-right font-semibold text-[#07111F]">
                        {formatPrice(payment.amount)}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-[#F7F3EA] font-bold text-sm">
                    <td className="p-3 text-[#07111F]">Total Amount Paid</td>
                    <td className="p-3 text-right text-[#C89B3C] font-serif text-base">
                      {formatPrice(payment.amount)} USD
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit & Legal Meta */}
          <div className="pt-4 border-t border-[#E8E1D4] grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-[#6B7280] block">Transaction No.</span>
              <strong className="font-mono text-[#07111F]">{transaction.txnNo}</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block">Payment Ref</span>
              <strong className="font-mono text-[#07111F]">{payment.transactionRef}</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block">Method</span>
              <strong className="text-[#07111F]">{payment.paymentMethod}</strong>
            </div>
            <div>
              <span className="text-[#6B7280] block">Platform Verification</span>
              <strong className="text-emerald-700 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Certified Halal
              </strong>
            </div>
          </div>

          {/* Footer Notice */}
          <div className="text-center pt-4 border-t border-[#E8E1D4] text-[10px] text-[#6B7280]">
            <p>
              This is a digitally verified receipt generated by Kiro-Maal Enterprise Real Estate System.
            </p>
            <p className="mt-0.5">
              Contact concierge@kiro-maal.so for official certified stamped paperwork and title deed transfer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
