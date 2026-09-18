// ================================================================
// PAGE NAME  : Customer Portal — AI Recommendations
// ROUTE      : /customer/recommendations
// DESCRIPTION: AI-scored property recommendations for customer
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
    <div className="space-y-6 bg-[#F8FAFC]">
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] text-xs font-semibold mb-2">
            <Sparkles className="h-3.5 w-3.5" /> AI Recommendation Engine
          </div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight">AI Property Matches</h1>
          <p className="text-[#64748B] text-sm mt-1">Properties matched based on your budget, location, and criteria.</p>
        </div>

        <Button
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="gap-2 bg-white border-[#E2E8F0] rounded-xl text-xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-[#10B981]" : ""}`} /> Refresh Matches
        </Button>
      </div>

      {loading ? (
        <div className="p-12 bg-white rounded-2xl border border-[#E2E8F0] text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981]" />
          <p className="text-sm font-semibold text-[#0F172A]">Calculating AI recommendations...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <Sparkles className="h-12 w-12 text-[#0891B2] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No matches found yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto mb-6">
            Set your budget and preferred city in AI Preferences to start generating tailored matches.
          </p>
          <Link
            href="/customer/profile"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            Set AI Preferences →
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
              <div key={property.id} className="property-card group flex flex-col justify-between">
                <div>
                  <div className="relative aspect-[16/10] bg-[#E2E8F0] overflow-hidden">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={property.title || "Property"}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                        <Building2 className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-[#ECFEFF] border border-[#A5F3FC] text-[#0891B2] text-xs font-bold px-2.5 py-1 rounded-full shadow-xs">
                      {matchPct}% Match
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-xl font-bold text-[#059669] mb-1">{formatPrice(property.price || 0)}</p>
                    <h3 className="font-bold text-[#0F172A] text-base mb-2 line-clamp-1 group-hover:text-[#10B981] transition-colors">
                      {property.title || "Untitled Property"}
                    </h3>
                    <p className="text-xs text-[#64748B] flex items-center gap-1 mb-3">
                      <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" /> {property.city || "Somalia"}
                    </p>

                    {/* Match Reasons */}
                    {parsedReasons.length > 0 && (
                      <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] space-y-1 mb-4">
                        {parsedReasons.slice(0, 2).map((r: string, idx: number) => (
                          <p key={idx} className="text-[11px] text-[#0891B2] font-medium flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" /> {r}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    href={`/properties/${property.id}`}
                    className="w-full inline-flex items-center justify-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white font-semibold py-2.5 rounded-xl text-xs transition-all shadow-xs"
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
