import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, Receipt } from "lucide-react";
import MyTransactions from "@/components/transactions/MyTransactions";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Transactions & Requests – Customer Portal | Kiro-Maal Real Estate",
};

export default async function CustomerTransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Purchase &amp; Rental Portfolio
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Receipt className="h-7 w-7 text-[#C89B3C]" /> My Transactions &amp; Requests
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Track your purchase requests, rental agreements, payment milestones, and official receipts.
        </p>
      </div>

      <MyTransactions />
    </div>
  );
}
