// ================================================================
// PAGE NAME  : User Dashboard — AI Recommendations
// ROUTE      : /dashboard/recommendations
// DESCRIPTION: AI-scored property recommendations based on user
//              preferences — weighted scoring across 5 dimensions
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
    score >= 80 ? "text-green-700 bg-green-100" : score >= 60 ? "text-yellow-700 bg-yellow-100" : "text-blue-700 bg-blue-100";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" /> AI Recommendations
          </h1>
          <p className="text-gray-500 text-sm mt-1">Properties scored and ranked by our AI based on your preferences</p>
        </div>
        <Button onClick={fetchRecommendations} variant="outline" size="sm" className="gap-2" disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-3" />
          <p className="text-gray-600 font-medium">AI is analyzing properties for you...</p>
          <p className="text-gray-400 text-sm mt-1">Scoring across 5 dimensions</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <Sparkles className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-900 mb-2">No recommendations yet</h3>
          <p className="text-gray-500 text-sm">Set your preferences in Profile Settings to get personalized recommendations.</p>
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
              <div key={property.id} className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-hidden hover:shadow-card-hover transition-all">
                <div className="flex gap-4 p-4">
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0 text-primary-700 font-bold text-sm">
                    #{i + 1}
                  </div>
                  {/* Image */}
                  <div className="w-24 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {img ? (
                      <img src={img} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building2 className="h-8 w-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${scoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" /> {city} · {getPropertyTypeLabel(type)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span className="flex items-center gap-1"><BedDouble className="h-3 w-3" /> {bedrooms}</span>
                      <span>{area} m²</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-700 font-bold text-sm">{formatPrice(price)}</span>
                      <Link href={`/properties/${property.id}`} className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                        View <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>
                {/* Why recommended */}
                {reasons.length > 0 && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <p className="text-xs text-gray-400 font-medium mb-1.5">Why recommended:</p>
                    <div className="space-y-1">
                      {reasons.map((reason: string, ri: number) => (
                        <div key={ri} className="flex items-start gap-1.5 text-xs text-gray-600">
                          <div className="w-1 h-1 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />
                          {reason}
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
