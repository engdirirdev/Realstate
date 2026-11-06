import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, CreditCard } from "lucide-react";
import CentralTransactionsView from "@/components/transactions/CentralTransactionsView";
import { getTransactionsDashboardData } from "@/lib/server/dashboard-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments – Manager Portal | Kiro-Maal Real Estate",
  description: "Unified manager payment logs, escrow settlements, and verified customer receipts.",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function ManagerTransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { paymentsData, ledgerData } = await getTransactionsDashboardData(
    session.user.id,
    (session.user as any).role || "USER"
  );

  return (
    <div className="space-y-6 w-full min-w-0">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Rental Settlements &amp; Revenue
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          <CreditCard className="h-7 w-7 text-[#C89B3C]" /> Payments
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Complete log of customer payments, settlement records, escrow states, and issued receipts.
        </p>
      </div>

      <CentralTransactionsView
        isAdmin={false}
        initialTab="payments"
        initialPaymentsData={paymentsData}
        initialLedgerData={ledgerData}
      />
    </div>
  );
}
