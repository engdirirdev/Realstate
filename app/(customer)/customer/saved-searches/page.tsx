// ================================================================
// PAGE NAME  : Customer Portal — Saved Searches
// ROUTE      : /customer/saved-searches
// DESCRIPTION: Re-run customer frequent search criteria
//              Kiro-Maal Real Estate Master Design System
// ================================================================
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Trash2, ArrowRight, Clock, MapPin, Building2, DollarSign, BedDouble, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatPrice } from "@/lib/utils";

interface SavedSearch {
  id: string;
  name: string | null;
  location: string | null;
  propertyType: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  bedrooms: number | null;
  createdAt: string;
}

export default function CustomerSavedSearchesPage() {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchSearches = async () => {
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

  useEffect(() => {
    fetchSearches();
  }, []);

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

  const buildSearchUrl = (s: SavedSearch) => {
    const params = new URLSearchParams();
    if (s.location) params.set("location", s.location);
    if (s.propertyType) params.set("type", s.propertyType);
    if (s.minPrice) params.set("minPrice", String(s.minPrice));
    if (s.maxPrice) params.set("maxPrice", String(s.maxPrice));
    if (s.bedrooms) params.set("bedrooms", String(s.bedrooms));
    return `/customer/properties?${params.toString()}`;
  };

  return (
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="h-3.5 w-3.5 text-[#C89B3C]" /> Search Automations
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] tracking-tight">Saved Property Filters</h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Quickly re-run your frequent property search parameters with instant real-time results.
          </p>
        </div>

        <Button asChild className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl shadow-sm text-xs font-bold border-0">
          <Link href="/customer/properties">Create New Search</Link>
        </Button>
      </div>

      {loading ? (
        <div className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C] mb-2" />
          <p className="text-xs text-[#6B7280]">Loading your saved searches...</p>
        </div>
      ) : searches.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center mx-auto shadow-inner">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No Saved Searches Yet</h2>
          <p className="text-xs text-[#6B7280] max-w-sm mx-auto mb-4 leading-relaxed">
            When browsing properties, save your search criteria to get instant inventory alerts and rerun queries anytime.
          </p>
          <Button asChild className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold border-0 shadow-sm">
            <Link href="/customer/properties">Browse &amp; Save a Search</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {searches.map((s) => (
            <div
              key={s.id}
              className="bg-[#FCFBF7] rounded-2xl p-5 shadow-sm border border-[#E8E1D4] flex flex-col justify-between hover:border-[#C89B3C]/50 hover:shadow-md transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-serif font-bold text-[#07111F] text-base">{s.name || "Custom Filter"}</h3>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="text-[#9CA3AF] hover:text-[#DC2626] transition-colors p-1"
                    title="Delete Saved Search"
                  >
                    {deletingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[#6B7280]">
                  {s.location && (
                    <span className="inline-flex items-center gap-1 bg-[#F7F3EA] border border-[#E8E1D4] px-2.5 py-1 rounded-lg font-medium text-[#07111F]">
                      <MapPin className="h-3 w-3 text-[#C89B3C]" /> {s.location}
                    </span>
                  )}
                  {s.propertyType && (
                    <span className="inline-flex items-center gap-1 bg-[#F7F3EA] border border-[#E8E1D4] px-2.5 py-1 rounded-lg font-medium text-[#07111F]">
                      <Building2 className="h-3 w-3 text-[#C89B3C]" /> {s.propertyType}
                    </span>
                  )}
                  {s.bedrooms && (
                    <span className="inline-flex items-center gap-1 bg-[#F7F3EA] border border-[#E8E1D4] px-2.5 py-1 rounded-lg font-medium text-[#07111F]">
                      <BedDouble className="h-3 w-3 text-[#C89B3C]" /> {s.bedrooms}+ Beds
                    </span>
                  )}
                  {(s.minPrice || s.maxPrice) && (
                    <span className="inline-flex items-center gap-1 bg-[#F7F3EA] border border-[#E8E1D4] px-2.5 py-1 rounded-lg font-medium text-[#07111F]">
                      <DollarSign className="h-3 w-3 text-[#C89B3C]" />
                      {s.minPrice ? formatPrice(s.minPrice) : "$0"} - {s.maxPrice ? formatPrice(s.maxPrice) : "Any"}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E8E1D4] flex items-center justify-between">
                <span className="text-[11px] text-[#6B7280] flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#C89B3C]" />
                  Saved {new Date(s.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={buildSearchUrl(s)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#A97918] hover:text-[#07111F] transition-colors"
                >
                  Run Search <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
