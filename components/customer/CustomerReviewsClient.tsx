"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Trash2, Building2, MapPin, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

export interface ReviewItem {
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

interface CustomerReviewsClientProps {
  initialReviews?: ReviewItem[];
}

export default function CustomerReviewsClient({ initialReviews = [] }: CustomerReviewsClientProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
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

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/reviews?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast({ title: "Review deleted successfully" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete review.", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Verified Testimonials
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Star className="h-7 w-7 text-[#C89B3C]" /> My Property Reviews
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Manage feedback and ratings you submitted for properties</p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="text-sm font-medium">Loading your reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-xs border border-[#E8E1D4] p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Star className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No reviews yet</h2>
          <p className="text-[#6B7280] text-xs mt-1 max-w-xs mx-auto mb-6 leading-relaxed">
            When you tour or acquire verified listings, you can share reviews with other buyers.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold shadow-md shadow-[#C89B3C]/15 hover:brightness-105 transition-all"
          >
            Explore Properties <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-[#FCFBF7] rounded-2xl p-6 shadow-xs border border-[#E8E1D4] space-y-4 hover:border-[#C89B3C]/50 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#07111F] flex items-center justify-center text-[#D9B45B]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <Link
                      href={`/properties/${review.property.id}`}
                      className="font-serif font-bold text-[#07111F] hover:text-[#A97918] transition-colors"
                    >
                      {review.property.title}
                    </Link>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#C89B3C]" /> {review.property.city} • {formatPrice(review.property.price)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-[#F7F3EA] px-3 py-1 rounded-full border border-[#E8E1D4]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating ? "text-[#C89B3C] fill-[#C89B3C]" : "text-[#E8E1D4]"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#07111F] ml-1">{review.rating}/5</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === review.id}
                    onClick={() => handleDelete(review.id)}
                    className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl text-xs gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>

              <p className="text-sm text-[#07111F] leading-relaxed italic bg-[#F7F3EA]/70 p-4 rounded-xl border border-[#E8E1D4]">
                &ldquo;{review.comment}&rdquo;
              </p>
              <p className="text-[11px] text-[#A97918] font-mono">
                Reviewed on {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

