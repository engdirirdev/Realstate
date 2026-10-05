import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, ShieldCheck } from "lucide-react";
import CentralTransactionsView from "@/components/transactions/CentralTransactionsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Transactions & Financial Settlements – Admin | Kiro-Maal Real Estate",
};

export default async function AdminTransactionsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl p-4 sm:p-8 bg-[#F7F3EA] min-h-screen">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" /> Platform Financial Settlement
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          Central Transactions Ledger
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Complete ledger of all closed property sales, active lease agreements, revenue aggregation, and customer receipts.
        </p>
      </div>

      <CentralTransactionsView isAdmin={true} />
    </div>
  );
}
