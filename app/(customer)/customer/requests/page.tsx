// ================================================================
// PAGE NAME  : Customer Portal — My Requests
// ROUTE      : /customer/requests
// DESCRIPTION: Active and pending rental & purchase requests
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { FileText, Sparkles } from "lucide-react";
import CustomerRequestsView from "@/components/customer/CustomerRequestsView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Requests – Customer Portal | Kiro-Maal Real Estate",
};

export default async function CustomerRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Acquisition &amp; Lease Requests
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <FileText className="h-7 w-7 text-[#C89B3C]" /> My Requests
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Review all your submitted rental booking and purchase acquisition requests, live approval statuses, and notes.
        </p>
      </div>

      <CustomerRequestsView />
    </div>
  );
}
