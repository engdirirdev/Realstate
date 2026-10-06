import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldCheck, Key } from "lucide-react";
import RequestsManager from "@/components/transactions/RequestsManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rentals & Leases – Admin Governance | Kiro-Maal Real Estate",
};

export default async function AdminRequestsPage() {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl p-4 sm:p-8 bg-[#F7F3EA] min-h-screen">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#07111F] border border-[#C89B3C]/30 text-[#D9B45B] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Key className="w-3.5 h-3.5 text-[#C89B3C]" /> Rental Portfolio &amp; Leases
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          Rentals &amp; Leases Management
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Full oversight of all customer rental bookings, active lease agreements, security deposits, and manager approvals across the entire real estate portfolio.
        </p>
      </div>

      <RequestsManager isAdmin={true} defaultKind="rental" hideKindTabs={true} />
    </div>
  );
}
