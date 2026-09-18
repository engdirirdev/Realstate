"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Trash2, ArrowRight, Clock, MapPin, Building2, DollarSign, BedDouble, Loader2 } from "lucide-react";
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
    return `/properties?${params.toString()}`;
  };

  return (
    <div className="space-y-6 max-w-4xl bg-[#F8FAFC]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
            <Search className="h-6 w-6 text-[#10B981]" /> Saved Searches
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            Quickly re-run your frequent property search criteria with one click.
          </p>
        </div>

        <Button asChild className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl shadow-sm text-xs font-semibold">
          <Link href="/properties">Create New Search</Link>
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#10B981] mb-2" />
          <p className="text-xs text-[#64748B]">Loading your saved searches...</p>
        </div>
      ) : searches.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-[#ECFDF5] text-[#10B981] flex items-center justify-center mx-auto">
            <Search className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-[#0F172A]">No Saved Searches Yet</h2>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto mb-4">
            When browsing properties, save your search criteria to get fast updates and rerun queries anytime.
          </p>
          <Button asChild className="bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-xs font-semibold">
            <Link href="/properties">Browse &amp; Save a Search</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {searches.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl p-5 shadow-card border border-[#E2E8F0] flex flex-col justify-between hover:shadow-card-hover transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-[#0F172A] text-base">{s.name || "Custom Filter"}</h3>
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="text-[#94A3B8] hover:text-[#EF4444] transition-colors p-1"
                    title="Delete Saved Search"
                  >
                    {deletingId === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-[#64748B]">
                  {s.location && (
                    <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                      <MapPin className="h-3 w-3 text-[#10B981]" /> {s.location}
                    </span>
                  )}
                  {s.propertyType && (
                    <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                      <Building2 className="h-3 w-3 text-[#3B82F6]" /> {s.propertyType}
                    </span>
                  )}
                  {s.bedrooms && (
                    <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                      <BedDouble className="h-3 w-3 text-[#8B5CF6]" /> {s.bedrooms}+ Beds
                    </span>
                  )}
                  {(s.minPrice || s.maxPrice) && (
                    <span className="inline-flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] px-2.5 py-1 rounded-lg">
                      <DollarSign className="h-3 w-3 text-[#059669]" />
                      {s.minPrice ? formatPrice(s.minPrice) : "$0"} - {s.maxPrice ? formatPrice(s.maxPrice) : "Any"}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Saved {new Date(s.createdAt).toLocaleDateString()}
                </span>
                <Link
                  href={buildSearchUrl(s)}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#10B981] hover:text-[#059669]"
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
