// ================================================================
// PAGE NAME  : Customer Portal — AI Recommendations
// ROUTE      : /customer/recommendations
// DESCRIPTION: AI-scored property recommendations for customer
//              Kiro-Maal Real Estate Master Design System
// ================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Building2, MapPin, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function CustomerRecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const fetchRecommendations = async () => {
    try {
      const res = await fetch("/api/user/recommendations");
      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations || []);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load AI recommendations.", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchRecommendations();
  };

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#C89B3C]" /> Kiro-Maal Match Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] tracking-tight">AI Tailored Property Matches</h1>
          <p className="text-[#6B7280] text-sm mt-1">Exclusive properties ranked algorithmically according to your budget and preferred locations.</p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2 bg-[#FCFBF7] border-[#E8E1D4] text-[#07111F] hover:bg-[#F7F3EA] rounded-xl text-xs font-bold shadow-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-[#C89B3C] ${refreshing ? "animate-spin" : ""}`} /> Refresh Matches
        </Button>
      </div>

      {loading ? (
        <div className="p-16 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] text-center flex flex-col items-center justify-center gap-3 max-w-lg mx-auto shadow-sm">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="font-serif font-bold text-[#07111F] text-base">Computing Algorithmic Matches...</p>
          <p className="text-[#6B7280] text-xs">Analyzing verified listings against your client profile</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Sparkles className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No matches found yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            Specify your budget range and favored city in Profile Settings to unlock automated recommendations.
          </p>
          <Link
            href="/customer/profile"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            Configure Matching Criteria →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((item: any) => {
            const property = item.property || item;
            if (!property || !property.id) return null;

            const score = item.score ?? 50;
            const matchPct = score <= 1 ? Math.round(score * 100) : Math.round(score);

            let parsedReasons: string[] = [];
            if (Array.isArray(item.reasons)) {
              parsedReasons = item.reasons;
            } else if (typeof item.reasons === "string") {
              try {
                parsedReasons = JSON.parse(item.reasons);
              } catch {
                parsedReasons = [];
              }
            }

            const imageUrl = property.images?.[0]?.url;

            return (
              <div key={property.id} className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-sm hover:border-[#C89B3C]/50 hover:shadow-md transition-all group flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] bg-[#07111F] overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={property.title || "Property"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                        <Building2 className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-[#07111F]/85 backdrop-blur-sm border border-[#C89B3C]/40 text-[#D9B45B] text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                      ★ {matchPct}% Match
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xl font-serif font-bold text-[#07111F] mb-1">{formatPrice(property.price || 0)}</p>
                    <h3 className="font-serif font-bold text-[#07111F] text-base mb-2 line-clamp-1 group-hover:text-[#A97918] transition-colors">
                      {property.title || "Untitled Property"}
                    </h3>
                    <p className="text-xs text-[#6B7280] flex items-center gap-1.5 mb-3">
                      <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {property.city || "Somalia"}
                    </p>

                    {/* Match Reasons */}
                    {parsedReasons.length > 0 && (
                      <div className="bg-[#F7F3EA] rounded-xl p-3 border border-[#E8E1D4] space-y-1 mb-4">
                        {parsedReasons.slice(0, 2).map((r: string, idx: number) => (
                          <p key={idx} className="text-[11px] text-[#07111F] font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C89B3C] flex-shrink-0" /> {r}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/properties/${property.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold hover:brightness-105 py-2.5 rounded-xl text-xs transition-all shadow-xs"
                  >
                    View Details <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
