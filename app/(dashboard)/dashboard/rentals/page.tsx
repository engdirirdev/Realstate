import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, KeyRound } from "lucide-react";
import ManagerRentalsManager from "@/components/manager/ManagerRentalsManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rental & Lease Agreements – Manager Portal | Kiro-Maal Real Estate",
};

export default async function ManagerRentalsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl p-4 sm:p-6 bg-[#F7F3EA] min-h-screen">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Rental Portfolio &amp; Leases
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          <KeyRound className="h-7 w-7 text-[#C89B3C]" /> Rental Management &amp; Agreements
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Review incoming tenant booking requests, approve or reject applications, create direct leases, and track active rental agreements.
        </p>
      </div>

      <ManagerRentalsManager />
    </div>
  );
}
