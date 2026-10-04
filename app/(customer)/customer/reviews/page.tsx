// ================================================================
// PAGE NAME  : Customer Portal — My Reviews
// ROUTE      : /customer/reviews
// DESCRIPTION: View and manage customer property reviews & ratings
//              Kiro-Maal Real Estate Master Design System
// ================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Trash2, Building2, MapPin, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-[#C89B3C]" /> Client Community Feedback
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] tracking-tight">
          My Property Ratings &amp; Testimonials
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          Manage your verified reviews and architectural feedback submitted across Kiro-Maal properties.
        </p>
      </div>

      {loading ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C] mb-2" />
          <p className="text-xs text-[#6B7280]">Loading your submitted reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center mx-auto shadow-inner">
            <Star className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No Reviews Written Yet</h2>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto mb-4 leading-relaxed">
            Share your verified experience on toured properties to guide fellow buyers and tenants.
          </p>
          <Button asChild className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold border-0 shadow-sm">
            <Link href="/properties">Browse Properties to Review</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-[#C89B3C]/50 transition-all"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className="w-16 h-16 rounded-xl bg-[#07111F] overflow-hidden flex-shrink-0 border border-[#E8E1D4]">
                  {r.property.images[0] ? (
                    <img src={r.property.images[0].url} alt={r.property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                      <Building2 className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${i < r.rating ? "text-[#C89B3C] fill-[#C89B3C]" : "text-[#E8E1D4]"}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#07111F] ml-1.5">{r.rating}/5</span>
                  </div>
                  <Link
                    href={`/properties/${r.property.id}`}
                    className="font-serif font-bold text-[#07111F] text-base hover:text-[#A97918] transition-colors block"
                  >
                    {r.property.title}
                  </Link>
                  <p className="text-xs text-[#6B7280] flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-[#C89B3C]" /> {r.property.city} • <span className="font-serif font-bold text-[#07111F]">{formatPrice(r.property.price)}</span>
                  </p>
                  <p className="text-xs text-[#4B5563] italic bg-[#F7F3EA] border border-[#E8E1D4] p-3 rounded-xl mt-2 leading-relaxed">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-bold border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA]">
                  <Link href={`/properties/${r.property.id}`}>
                    View Listing <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(r.id)}
                  disabled={deletingId === r.id}
                  className="rounded-xl text-xs font-semibold text-[#DC2626] hover:bg-red-50 border-[#E8E1D4]"
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
