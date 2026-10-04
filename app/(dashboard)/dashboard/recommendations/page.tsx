// ================================================================
// PAGE NAME  : User Dashboard — AI Recommendations
// ROUTE      : /dashboard/recommendations
// DESCRIPTION: AI-scored property recommendations based on user
//              preferences — weighted scoring across 5 dimensions
//              Kiro-Maal Real Estate Master Design System
// ROLE       : USER only
// ================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Building2, MapPin, BedDouble, RefreshCw, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";

interface Recommendation {
  id: string;
  title: string;
  type: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images: { url: string }[];
  score: number;
  reasons: string[];
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/recommendations");
      const data = await res.json();
      if (data.success) setRecommendations(data.recommendations);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecommendations(); }, []);

  const scoreColor = (score: number) =>
    score >= 80 ? "text-[#07111F] bg-[#C89B3C]/20 border border-[#C89B3C]/40" : score >= 60 ? "text-amber-800 bg-amber-50 border border-amber-200" : "text-[#6B7280] bg-[#F7F3EA] border border-[#E8E1D4]";

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Algorithmic Matching
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] flex items-center gap-2.5">
            <Sparkles className="h-7 w-7 text-[#C89B3C]" /> AI Property Recommendations
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">Properties evaluated, scored, and ranked by Kiro-Maal AI based on portfolio criteria</p>
        </div>
        <Button
          onClick={fetchRecommendations}
          variant="outline"
          size="sm"
          className="gap-2 rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA] self-start sm:self-auto shadow-xs font-semibold"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 text-[#C89B3C] ${loading ? "animate-spin" : ""}`} />
          Refresh Matches
        </Button>
      </div>

      {loading ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-16 text-center max-w-lg mx-auto">
          <Loader2 className="h-12 w-12 text-[#C89B3C] animate-spin mx-auto mb-3" />
          <p className="font-serif font-bold text-[#07111F] text-base">Evaluating Real Estate Portfolio...</p>
          <p className="text-[#6B7280] text-xs mt-1">Cross-referencing parameters across 5 market dimensions</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-16 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Sparkles className="h-7 w-7 opacity-80" />
          </div>
          <h3 className="font-serif font-bold text-[#07111F] text-base mb-1">No recommendations yet</h3>
          <p className="text-[#6B7280] text-xs">Set your property criteria in Profile Settings to unlock personalized algorithmic rankings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {recommendations.map((item: any, i) => {
            const property = item.property || item;
            if (!property || !property.id) return null;
            const img = property.images?.[0]?.url;
            const title = property.title || "Untitled Property";
            const price = property.price || 0;
            const city = property.city || "";
            const type = property.type || "HOUSE";
            const bedrooms = property.bedrooms || 0;
            const area = property.area || 0;
            const score = item.score ?? 50;
            const reasons = Array.isArray(item.reasons) ? item.reasons : [];

            return (
              <div key={property.id} className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] overflow-hidden hover:border-[#C89B3C]/50 hover:shadow-md transition-all">
                <div className="flex gap-4 p-5">
                  {/* Rank */}
                  <div className="w-9 h-9 rounded-xl bg-[#07111F] border border-[#C89B3C]/30 flex items-center justify-center flex-shrink-0 text-[#D9B45B] font-bold text-xs shadow-inner">
                    #{i + 1}
                  </div>
                  {/* Image */}
                  <div className="w-24 h-22 rounded-xl overflow-hidden bg-[#07111F] flex-shrink-0 border border-[#E8E1D4]">
                    {img ? (
                      <img src={img} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                        <Building2 className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-serif font-bold text-[#07111F] text-sm truncate">{title}</h3>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex-shrink-0 ${scoreColor(score)}`}>
                        {score}% Match
                      </span>
                    </div>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3 text-[#C89B3C]" /> {city} · <span className="text-[#A97918] font-semibold">{getPropertyTypeLabel(type)}</span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-[#6B7280] mb-2 font-medium">
                      <span className="flex items-center gap-1"><BedDouble className="h-3 w-3 text-[#C89B3C]" /> {bedrooms} Beds</span>
                      <span>{area} m²</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-[#07111F] text-base">{formatPrice(price)}</span>
                      <Link href={`/properties/${property.id}`} className="text-xs font-bold text-[#A97918] hover:text-[#07111F] flex items-center gap-1 transition-colors">
                        View Details <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Why recommended */}
                {reasons.length > 0 && (
                  <div className="px-5 pb-4 border-t border-[#E8E1D4] pt-3 bg-[#F7F3EA]/30">
                    <p className="text-[11px] text-[#6B7280] font-bold uppercase tracking-wider mb-1.5">Algorithmic Rationale:</p>
                    <div className="space-y-1">
                      {reasons.map((reason: string, ri: number) => (
                        <div key={ri} className="flex items-start gap-2 text-xs text-[#07111F]">
                          <div className="w-1.5 h-1.5 bg-[#C89B3C] rounded-full mt-1.5 flex-shrink-0" />
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
