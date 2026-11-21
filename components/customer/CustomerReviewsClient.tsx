"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Star,
  Trash2,
  Building2,
  MapPin,
  ArrowRight,
  Loader2,
  Sparkles,
  Plus,
  Pencil,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";
import { usePortalLanguage } from "@/lib/customer-i18n";

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

export interface ReviewPropertyOption {
  id: string;
  title: string;
  city: string;
  price: number;
}

interface CustomerReviewsClientProps {
  initialReviews?: ReviewItem[];
  properties?: ReviewPropertyOption[];
}

export default function CustomerReviewsClient({
  initialReviews = [],
  properties = [],
}: CustomerReviewsClientProps) {
  const [lang] = usePortalLanguage();
  const isSo = lang === "so";

  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Write / Edit Review Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(properties[0]?.id || "");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return "5.0";
    return (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
  }, [reviews]);

  const openCreateModal = () => {
    setEditingReview(null);
    setSelectedPropertyId(properties[0]?.id || "");
    setRating(5);
    setComment("");
    setModalOpen(true);
  };

  const openEditModal = (rev: ReviewItem) => {
    setEditingReview(rev);
    setSelectedPropertyId(rev.property.id);
    setRating(rev.rating);
    setComment(rev.comment);
    setModalOpen(true);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast({
        title: isSo ? "Fadlan qor faalladaada" : "Comment required",
        description: isSo
          ? "Fadlan qor faallo ku saabsan guriga."
          : "Please write a short comment for your review.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingReview) {
        const res = await fetch("/api/user/reviews", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingReview.id,
            rating,
            comment: comment.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.review) {
          setReviews((prev) =>
            prev.map((item) => (item.id === editingReview.id ? data.review : item))
          );
          setModalOpen(false);
          toast({
            title: isSo ? "Qiimeynta Waa La Cusboonaysiiyay! ⭐" : "Review Updated! ⭐",
          });
        } else {
          toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      } else {
        const res = await fetch("/api/user/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            propertyId: selectedPropertyId,
            rating,
            comment: comment.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.review) {
          setReviews((prev) => [data.review, ...prev]);
          setModalOpen(false);
          setComment("");
          setRating(5);
          toast({
            title: isSo ? "Qiimeyntaada Waa La Diray! ⭐" : "Review Submitted! ⭐",
            description: isSo
              ? "Waad ku mahadsan tahay qiimeyntaada."
              : "Thank you for sharing your property review.",
          });
        } else {
          toast({ title: "Error", description: data.error, variant: "destructive" });
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save review.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/reviews?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        toast({
          title: isSo ? "Qiimeynta waa la tirtiray" : "Review deleted successfully",
        });
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
    <div className="space-y-6 max-w-4xl mx-auto bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" />{" "}
            {isSo ? "Aragtida Macaamiisha" : "Verified Testimonials"}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Star className="h-7 w-7 text-[#C89B3C] fill-[#C89B3C]" />{" "}
            {isSo ? "Qiimeyntayda Guryaha (My Reviews)" : "My Property Reviews"}
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            {isSo
              ? "Qor, wax ka beddel, ama maamul qiimeynta iyo faallooyinka aad ka bixisay guryaha."
              : "Write, edit, and manage ratings and testimonials you submitted for properties."}
          </p>
        </div>

        <Button
          onClick={openCreateModal}
          className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 shadow-sm border-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" />{" "}
          {isSo ? "Qor Qiimeyn Cusub" : "Write a Review"}
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#FCFBF7] rounded-2xl p-5 border border-[#E8E1D4] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              {isSo ? "Wadarta Qiimeyntaada" : "Total Submitted Reviews"}
            </p>
            <p className="text-2xl font-serif font-black text-[#07111F] mt-1">
              {reviews.length}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center border border-[#C89B3C]/40">
            <Star className="h-5 w-5 fill-[#D9B45B]" />
          </div>
        </div>

        <div className="bg-[#FCFBF7] rounded-2xl p-5 border border-[#E8E1D4] flex items-center justify-between shadow-2xs">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
              {isSo ? "Celceliska Xiddigaha" : "Average Star Rating"}
            </p>
            <p className="text-2xl font-serif font-black text-[#C89B3C] mt-1">
              ⭐ {avgRating} / 5.0
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-[#C89B3C]/15 text-[#A97918] flex items-center justify-center border border-[#C89B3C]/30 font-bold text-sm">
            5★
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-xs border border-[#E8E1D4] p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Star className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">
            {isSo ? "Weli wax qiimeyn ah ma aadan qorin" : "No reviews submitted yet"}
          </h2>
          <p className="text-[#6B7280] text-xs mt-1 max-w-xs mx-auto mb-6 leading-relaxed">
            {isSo
              ? "Guji badhanka hoose si aad u qiimeyso guryaha aad booqatay ama aad ka heshay."
              : "Click the button below to rate and review any verified property listing."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold shadow-md border-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> {isSo ? "Qor Qiimeyn" : "Write a Review"}
            </Button>
            <Link
              href="/customer/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/40 text-xs font-bold hover:bg-[#0B1728] transition-all"
            >
              {isSo ? "Raadi Guryaha" : "Browse Properties"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
                  <div className="w-10 h-10 rounded-xl bg-[#07111F] flex items-center justify-center text-[#D9B45B] shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <Link
                      href={`/customer/properties/${review.property.id}`}
                      className="font-serif font-bold text-[#07111F] hover:text-[#A97918] transition-colors"
                    >
                      {review.property.title}
                    </Link>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-[#C89B3C]" /> {review.property.city} •{" "}
                      <span className="font-serif font-bold text-[#07111F]">
                        {formatPrice(review.property.price)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 bg-[#F7F3EA] px-3 py-1 rounded-full border border-[#E8E1D4]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-[#C89B3C] fill-[#C89B3C]"
                            : "text-[#E8E1D4]"
                        }`}
                      />
                    ))}
                    <span className="text-xs font-bold text-[#07111F] ml-1">
                      {review.rating}/5
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(review)}
                    className="h-8 border-[#C89B3C]/40 text-[#07111F] hover:bg-[#F7F3EA] rounded-xl text-xs gap-1 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5 text-[#C89B3C]" />{" "}
                    {isSo ? "Beddel" : "Edit"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === review.id}
                    onClick={() => handleDelete(review.id)}
                    className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl text-xs gap-1 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> {isSo ? "Tirtir" : "Delete"}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-[#07111F] leading-relaxed bg-[#F7F3EA]/70 p-4 rounded-xl border border-[#E8E1D4]">
                &ldquo;{review.comment}&rdquo;
              </p>
              <p className="text-[11px] text-[#A97918] font-mono">
                {isSo ? "La qoray" : "Reviewed on"}{" "}
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Write / Edit Review Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Star className="h-5 w-5 text-[#C89B3C] fill-[#C89B3C]" />{" "}
              {editingReview
                ? isSo
                  ? "Wax Ka Beddel Qiimeynta"
                  : "Edit Your Property Review"
                : isSo
                ? "Qor Qiimeyn Guri"
                : "Write a Property Review"}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              {isSo
                ? "Dooro guriga, xiddigaha (1 ilaa 5), iyo faalladaada."
                : "Select a property, choose your star rating (1 to 5), and share your feedback."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitReview} className="space-y-4 mt-2">
            {!editingReview && properties.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">
                  {isSo ? "Dooro Guriga" : "Select Property"}
                </Label>
                <select
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-semibold outline-none"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.city} • {formatPrice(p.price)})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">
                {isSo ? "Qiimeynta Xiddigaha (Star Rating)" : "Star Rating"}
              </Label>
              <div className="flex items-center gap-1.5 bg-[#F7F3EA] p-3 rounded-xl border border-[#E8E1D4]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? "fill-[#C89B3C] text-[#C89B3C]"
                          : "text-[#D1D5DB]"
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-[#07111F] ml-2">
                  {rating} / 5 {isSo ? "Xiddigood" : "Stars"}
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">
                {isSo ? "Faalladaada (Your Review)" : "Your Review Comment"}
              </Label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={
                  isSo
                    ? "Qor aragtidaada ku saabsan gurigan..."
                    : "Share your honest experience and thoughts about this property..."
                }
                className="min-h-[110px] border-[#E8E1D4] rounded-xl text-xs bg-white"
                required
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-xs"
              >
                {isSo ? "Jooji" : "Cancel"}
              </Button>
              <Button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 border-0 cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {editingReview
                  ? isSo
                    ? "Kaydi Isbeddelka"
                    : "Update Review"
                  : isSo
                  ? "Dir Qiimeynta"
                  : "Submit Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
