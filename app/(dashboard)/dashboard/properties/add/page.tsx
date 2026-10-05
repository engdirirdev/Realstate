// ================================================================
// PAGE NAME  : Manager Dashboard — Add Property (Dynamic Form)
// ROUTE      : /dashboard/properties/add
// DESCRIPTION: Dynamic Property Registration Form adapted per Property
//              Type with dedicated specifications, validation, and media
// ROLE       : USER / Manager / Admin
// ================================================================
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Building2 } from "lucide-react";
import DynamicPropertyForm from "@/components/property/DynamicPropertyForm";

export default function ManagerAddPropertyPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-2xl bg-[#FCFBF7] border border-[#E8E1D4] flex items-center justify-center hover:bg-[#F7F3EA] text-[#07111F] transition-colors cursor-pointer shadow-2xs"
          title="Go Back"
        >
          <ArrowLeft className="h-4 w-4 text-[#07111F]" />
        </button>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#A97918] text-[11px] font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-3 w-3 text-[#C89B3C]" />
            <span>Dynamic Property Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] tracking-tight">
            Add New Property Listing
          </h1>
          <p className="text-[#6B7280] text-xs sm:text-sm mt-0.5">
            Select your property type to load custom fields, spatial parameters, and verified media assets.
          </p>
        </div>
      </div>

      {/* Dynamic Multi-Step Property Form */}
      <DynamicPropertyForm onSuccessRedirect="/dashboard/properties" />
    </div>
  );
}
