"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Trash2, ArrowRight, Clock, MapPin, Building2, DollarSign, BedDouble, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

export interface SavedSearchItem {
  id: string;
  name: string | null;
  location: string | null;
  propertyType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  createdAt: string;
}

interface CustomerSavedSearchesClientProps {
  initialSearches?: SavedSearchItem[];
}

export default function CustomerSavedSearchesClient({ initialSearches = [] }: CustomerSavedSearchesClientProps) {
  const [searches, setSearches] = useState<SavedSearchItem[]>(initialSearches);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSearches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/saved-searches");
      const data = await res.json();
      if (data.success) {
        setSearches(data.savedSearches);
      }
    } catch {
      toast({ title: "Error", description: "Failed to load saved searches.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/saved-searches?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setSearches((prev) => prev.filter((s) => s.id !== id));
        toast({ title: "Saved search removed" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete saved search", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Search Alerts &amp; Criteria
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Search className="h-7 w-7 text-[#C89B3C]" /> Saved Searches
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">Re-run your favorite filters or get notified of matching new listings</p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#6B7280] flex flex-col items-center justify-center gap-3 bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4]">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C]" />
          <p className="text-sm font-medium">Loading saved searches...</p>
        </div>
      ) : searches.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-xs border border-[#E8E1D4] p-12 text-center max-w-md mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Search className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No saved searches yet</h2>
          <p className="text-[#6B7280] text-xs mt-1 max-w-xs mx-auto mb-6 leading-relaxed">
            When browsing properties, click &quot;Save Search&quot; to keep your filters handy and receive instant price updates.
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
          {searches.map((s) => {
            const query = new URLSearchParams();
            if (s.location) query.set("location", s.location);
            if (s.propertyType) query.set("type", s.propertyType);
            if (s.minPrice) query.set("minPrice", String(s.minPrice));
            if (s.maxPrice) query.set("maxPrice", String(s.maxPrice));
            if (s.bedrooms) query.set("bedrooms", String(s.bedrooms));

            return (
              <div
                key={s.id}
                className="bg-[#FCFBF7] rounded-2xl p-6 shadow-xs border border-[#E8E1D4] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#C89B3C]/50 transition-all"
              >
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-[#07111F] text-base">{s.name || "Custom Filter"}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280]">
                    {s.location && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4]">
                        <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {s.location}
                      </span>
                    )}
                    {s.propertyType && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4]">
                        <Building2 className="h-3.5 w-3.5 text-[#C89B3C]" /> {s.propertyType}
                      </span>
                    )}
                    {(s.minPrice || s.maxPrice) && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4]">
                        <DollarSign className="h-3.5 w-3.5 text-[#C89B3C]" />
                        {s.minPrice ? formatPrice(s.minPrice) : "$0"} - {s.maxPrice ? formatPrice(s.maxPrice) : "Any"}
                      </span>
                    )}
                    {s.bedrooms && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4]">
                        <BedDouble className="h-3.5 w-3.5 text-[#C89B3C]" /> {s.bedrooms}+ Beds
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A97918] flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" /> Saved on {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/properties?${query.toString()}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] rounded-xl text-xs font-bold hover:brightness-105 shadow-xs transition-all"
                  >
                    Run Search <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
                    className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

