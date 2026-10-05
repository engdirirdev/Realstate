import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, History } from "lucide-react";
import CentralTransactionsView from "@/components/transactions/CentralTransactionsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transactions & Sales – Manager Portal | Kiro-Maal Real Estate",
};

export default async function ManagerTransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl p-4 sm:p-6 bg-[#F7F3EA] min-h-screen">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Deal Closures &amp; Revenue
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          <History className="h-7 w-7 text-[#C89B3C]" /> Property Transactions
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Complete log of sales transactions, rental leases, payment states, and issued customer receipts.
        </p>
      </div>

      <CentralTransactionsView isAdmin={false} />
    </div>
  );
}
