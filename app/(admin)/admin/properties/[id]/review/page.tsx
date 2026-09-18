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
import { CheckCircle2, XCircle, Star, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";

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
    <div className="space-y-6 max-w-2xl bg-[#F8FAFC] min-h-screen p-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Properties
      </button>

      <h1 className="font-display text-2xl font-bold text-[#0F172A]">Review Property</h1>

      <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-6 space-y-4">
        <h2 className="font-semibold text-[#0F172A] mb-4">Update Property Status</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            onClick={() => updateStatus("APPROVED")}
            disabled={loading !== null}
            className="gap-2 bg-[#10B981] text-white hover:bg-[#059669] rounded-xl border-0"
            size="lg"
          >
            {loading === "APPROVED" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve Property
          </Button>

          <Button
            onClick={() => updateStatus("REJECTED")}
            disabled={loading !== null}
            variant="destructive"
            size="lg"
            className="gap-2 bg-[#EF4444] text-white hover:bg-red-600 rounded-xl border-0"
          >
            {loading === "REJECTED" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Reject Property
          </Button>

          <Button
            onClick={() => updateStatus("SOLD")}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="gap-2 bg-white text-[#1E40AF] border border-[#DBEAFE] hover:bg-[#DBEAFE] rounded-xl"
          >
            {loading === "SOLD" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Mark as Sold
          </Button>

          <Button
            onClick={() => updateStatus("UNAVAILABLE")}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="gap-2 bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl"
          >
            Mark Unavailable
          </Button>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <h3 className="font-medium text-[#0F172A] mb-3">Featured Listing</h3>
          <div className="flex gap-3">
            <Button
              onClick={() => toggleFeatured(true)}
              disabled={loading !== null}
              variant="outline"
              className="gap-2 text-[#92400E] border-[#FDE68A] bg-[#FEF9C3] hover:bg-[#FEF9C3]/80 rounded-xl"
            >
              <Star className="h-4 w-4" />
              {loading === "featured" ? "Updating..." : "Set as Featured"}
            </Button>
            <Button
              onClick={() => toggleFeatured(false)}
              disabled={loading !== null}
              variant="outline"
              className="gap-2 bg-white text-[#64748B] border border-[#E2E8F0] hover:bg-[#F8FAFC] rounded-xl"
            >
              Remove Featured
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
