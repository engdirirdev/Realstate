// ================================================================
// PAGE NAME  : Customer Portal — My Rentals
// ROUTE      : /customer/rentals
// DESCRIPTION: Active, upcoming, and historical rental leases
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Key, Sparkles } from "lucide-react";
import CustomerRentalsView from "@/components/customer/CustomerRentalsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Rentals – Customer Portal | Kiro-Maal Real Estate",
};

export default async function CustomerRentalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Residential &amp; Commercial Tenancies
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Key className="h-7 w-7 text-[#C89B3C]" /> My Rentals
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Monitor your active leases, move-in schedules, payment receipts, and tenancy renewal timelines.
        </p>
      </div>

      <CustomerRentalsView />
    </div>
  );
}
