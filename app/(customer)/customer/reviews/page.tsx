"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Trash2, Building2, MapPin, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  property: {
    id: string;
    title: string;
    city: string;
    price: number;
    images: { url: string }[];
  };
}

export default function CustomerReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/user/reviews");
      const data = await res.json();
      if (data.success) {
        setReviews(data.reviews);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load reviews.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/reviews?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast({ title: "Review deleted successfully" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <Star className="h-6 w-6 text-[#F59E0B]" /> My Property Reviews &amp; Ratings
        </h1>
        <p className="text-[#64748B] text-sm mt-1">
          Manage all reviews and feedback you have posted on Somali property listings.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981] mb-2" />
          <p className="text-xs text-[#64748B]">Loading your reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#F59E0B] flex items-center justify-center mx-auto">
            <Star className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A]">No Reviews Written Yet</h2>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-4">
            Share your experiences on visited properties to help other buyers and tenants in Somalia.
          </p>
          <Button asChild className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-semibold">
            <Link href="/properties">Browse Properties to Review</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl bg-[#E2E8F0] overflow-hidden flex-shrink-0">
                  {r.property.images[0] ? (
                    <img src={r.property.images[0].url} alt={r.property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < r.rating ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#E2E8F0]"}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#0F172A] ml-1.5">{r.rating}/5</span>
                  </div>
                  <Link
                    href={`/properties/${r.property.id}`}
                    className="font-bold text-[#0F172A] text-sm hover:text-[#10B981] transition-colors block"
                  >
                    {r.property.title}
                  </Link>
                  <p className="text-xs text-[#64748B] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#94A3B8]" /> {r.property.city} • {formatPrice(r.property.price)}
                  </p>
                  <p className="text-xs text-[#334155] italic bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-xl mt-2">
                    "{r.comment}"
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold border-[#E2E8F0]">
                  <Link href={`/properties/${r.property.id}`}>
                    View Listing <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="rounded-xl text-xs font-semibold text-[#EF4444] hover:bg-[#FEE2E2] border-[#FCA5A5]"
                >
                  {deletingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
