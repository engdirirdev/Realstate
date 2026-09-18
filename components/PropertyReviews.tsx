"use client";

import { useState } from "react";
import { Star, MessageSquare, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    name: string | null;
    image: string | null;
  };
}

export default function PropertyReviews({
  propertyId,
  initialReviews = [],
}: {
  propertyId: string;
  initialReviews?: ReviewItem[];
}) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({ title: "Comment required", description: "Please enter a comment for your review.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/properties/${propertyId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Review Submitted! ⭐", description: "Thank you for rating this property." });
        setReviews((prev) => [data.review, ...prev]);
        setComment("");
        setRating(5);
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to submit review." });
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-card space-y-6">
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-4">
        <h2 className="font-bold text-[#0F172A] text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-[#EAB308] fill-[#EAB308]" /> Customer Ratings &amp; Reviews ({reviews.length})
        </h2>
        <span className="bg-[#FEF3C7] text-[#92400E] px-3 py-1 rounded-full text-xs font-bold border border-[#FDE68A]">
          ⭐ {avgRating} / 5.0
        </span>
      </div>

      {/* Review Submission Form */}
      <form onSubmit={handleSubmit} className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3">
        <p className="text-xs font-bold text-[#0F172A]">Leave a Customer Rating &amp; Review</p>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className="p-1 text-[#EAB308] hover:scale-110 transition-transform"
            >
              <Star className={`h-5 w-5 ${star <= rating ? "fill-[#EAB308]" : "text-[#CBD5E1]"}`} />
            </button>
          ))}
          <span className="text-xs font-semibold text-[#64748B] ml-2">{rating} Stars</span>
        </div>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience or thoughts regarding this property..."
          className="min-h-[80px] bg-white border-[#E2E8F0] rounded-xl text-xs"
          required
        />
        <Button type="submit" disabled={submitting} size="sm" className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl gap-2 font-semibold">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Submit Review
        </Button>
      </form>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-xs text-[#94A3B8] text-center py-4">No reviews yet for this property. Be the first to leave a rating!</p>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-4 rounded-xl border border-[#E2E8F0] bg-white space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#10B981] text-white flex items-center justify-center font-bold text-xs">
                    {rev.user?.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="font-bold text-[#0F172A]">{rev.user?.name || "Customer"}</span>
                </div>
                <div className="flex items-center gap-1 text-[#EAB308]">
                  {Array.from({ length: rev.rating }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-[#EAB308]" />
                  ))}
                </div>
              </div>
              <p className="text-[#334155] leading-relaxed pl-9">{rev.comment}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
