// ================================================================
// PAGE NAME  : Customer Portal — My Purchases
// ROUTE      : /customer/purchases
// DESCRIPTION: Property purchase applications, approvals, escrow payments,
//              and completed asset acquisitions
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShoppingBag, Sparkles } from "lucide-react";
import CustomerPurchasesView from "@/components/customer/CustomerPurchasesView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Purchases – Customer Portal | Kiro-Maal Real Estate",
};

export default async function CustomerPurchasesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Asset Acquisition Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <ShoppingBag className="h-7 w-7 text-[#C89B3C]" /> My Purchases
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Review purchase requests, admin approval status, pending settlement payments, and completed deeds.
        </p>
      </div>

      <CustomerPurchasesView />
    </div>
  );
}
