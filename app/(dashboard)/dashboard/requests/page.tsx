import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Sparkles, FileText } from "lucide-react";
import RequestsManager from "@/components/transactions/RequestsManager";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Purchase & Rental Requests – Manager Portal | Kiro-Maal Real Estate",
};

export default async function ManagerRequestsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="space-y-6 max-w-6xl p-4 sm:p-6 bg-[#F7F3EA] min-h-screen">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Deal Pipeline &amp; Verification
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-black text-[#07111F] flex items-center gap-2.5">
          <FileText className="h-7 w-7 text-[#C89B3C]" /> Purchase &amp; Rental Requests
        </h1>
        <p className="text-[#6B7280] text-xs sm:text-sm mt-1">
          Review customer acquisition bids and rental applications for your listings. Approving a request allows the customer to complete payment.
        </p>
      </div>

      <RequestsManager isAdmin={false} />
    </div>
  );
}
