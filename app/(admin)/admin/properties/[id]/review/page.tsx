// ================================================================
// PAGE NAME  : Admin Dashboard — Property Review
// ROUTE      : /admin/properties/[id]/review
// DESCRIPTION: Review a single property — approve, reject, mark
//              as sold/unavailable, toggle featured status
// ROLE       : ADMIN only
// ================================================================
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Star, Loader2, ArrowLeft, ShieldCheck, Tag, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

import { use } from "react";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const updateStatus = async (status: string) => {
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        router.push("/admin/properties");
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const toggleFeatured = async (featured: boolean) => {
    setLoading("featured");
    try {
      await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: featured }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl min-h-screen p-2 sm:p-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center gap-2 text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Properties
      </button>

      <div>
        <h1 className="font-serif text-2xl font-bold text-[#07111F] flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[#C89B3C]" /> Review Property Listing
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Perform administrative verification, set publication status, or spotlight as a featured listing.
        </p>
      </div>

      <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-6 space-y-6">
        <div>
          <h2 className="font-serif text-base font-bold text-[#07111F] mb-1">Update Publication Status</h2>
          <p className="text-xs text-[#6B7280]">
            Select the new administrative status for listing ID: <span className="font-mono text-[#07111F] font-semibold">{id}</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Button
            onClick={() => updateStatus("APPROVED")}
            disabled={loading !== null}
            className="gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] font-bold rounded-xl shadow-sm h-11 border-0"
            size="lg"
          >
            {loading === "APPROVED" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve Listing
          </Button>

          <Button
            onClick={() => updateStatus("REJECTED")}
            disabled={loading !== null}
            variant="destructive"
            size="lg"
            className="gap-2 bg-[#991B1B] text-white hover:bg-[#7F1D1D] rounded-xl h-11 border-0 font-bold"
          >
            {loading === "REJECTED" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Reject Listing
          </Button>

          <Button
            onClick={() => updateStatus("SOLD")}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="gap-2 bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30 hover:bg-[#0B1728] rounded-xl h-11 font-bold"
          >
            {loading === "SOLD" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4 text-[#C89B3C]" />}
            Mark as Sold
          </Button>

          <Button
            onClick={() => updateStatus("UNAVAILABLE")}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="gap-2 bg-[#FCFBF7] text-[#6B7280] border border-[#E8E1D4] hover:bg-[#F7F3EA] rounded-xl h-11 font-medium"
          >
            {loading === "UNAVAILABLE" ? <Loader2 className="h-4 w-4 animate-spin" /> : <EyeOff className="h-4 w-4" />}
            Mark Unavailable
          </Button>
        </div>

        <div className="border-t border-[#E8E1D4] pt-5">
          <h3 className="font-serif text-sm font-bold text-[#07111F] mb-1">Featured Spotlight</h3>
          <p className="text-xs text-[#6B7280] mb-3">
            Promote this property on the Kiro-Maal homepage featured collection.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => toggleFeatured(true)}
              disabled={loading !== null}
              variant="outline"
              className="gap-2 text-[#07111F] border-[#C89B3C] bg-[#C89B3C]/10 hover:bg-[#C89B3C]/20 rounded-xl text-xs font-bold"
            >
              <Star className="h-4 w-4 text-[#C89B3C] fill-[#C89B3C]" />
              {loading === "featured" ? "Updating..." : "Set as Featured"}
            </Button>
            <Button
              onClick={() => toggleFeatured(false)}
              disabled={loading !== null}
              variant="outline"
              className="gap-2 bg-[#FCFBF7] text-[#6B7280] border border-[#E8E1D4] hover:bg-[#F7F3EA] rounded-xl text-xs font-medium"
            >
              Remove Featured
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
