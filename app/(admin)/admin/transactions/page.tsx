import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldCheck, CreditCard } from "lucide-react";
import CentralTransactionsView from "@/components/transactions/CentralTransactionsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payments & Transactions – Admin | Kiro-Maal Real Estate",
  description: "Unified financial payment logs, platform settlements, revenue metrics, and property transactions ledger.",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; view?: string }>;
}) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const resolved = searchParams ? await searchParams : {};
  const initialTab =
    resolved?.tab === "ledger" || resolved?.view === "ledger"
      ? "ledger"
      : "payments";

  return (
    <div className="space-y-6 max-w-7xl p-4 sm:p-8 bg-[#F7F3EA] min-h-screen">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C89B3C]" /> Platform Financial Settlements &amp; Escrow
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          <CreditCard className="h-7 w-7 text-[#C89B3C]" /> Payments &amp; Transactions
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Consolidated repository of customer payment escrow logs, cleared settlement volume, property purchase agreements, and rental leases.
        </p>
      </div>

      <CentralTransactionsView isAdmin={true} initialTab={initialTab} />
    </div>
  );
}
