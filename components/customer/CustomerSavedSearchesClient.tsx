"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Trash2,
  ArrowRight,
  Clock,
  MapPin,
  Building2,
  DollarSign,
  BedDouble,
  Loader2,
  Sparkles,
  Plus,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export interface SavedSearchItem {
  id: string;
  name: string | null;
  query?: string | null;
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

export default function CustomerSavedSearchesClient({
  initialSearches = [],
}: CustomerSavedSearchesClientProps) {
  const [searches, setSearches] = useState<SavedSearchItem[]>(initialSearches);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formName, setFormName] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formType, setFormType] = useState("");
  const [formQuery, setFormQuery] = useState("");
  const [formMinPrice, setFormMinPrice] = useState("");
  const [formMaxPrice, setFormMaxPrice] = useState("");
  const [formBedrooms, setFormBedrooms] = useState("");

  const handleCreateSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/user/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim() || undefined,
          location: formLocation.trim() || null,
          propertyType: formType || null,
          query: formQuery.trim() || null,
          minPrice: formMinPrice ? Number(formMinPrice) : null,
          maxPrice: formMaxPrice ? Number(formMaxPrice) : null,
          bedrooms: formBedrooms ? Number(formBedrooms) : null,
        }),
      });
      const data = await res.json();
      if (data.success && data.search) {
        setSearches((prev) => [data.search, ...prev]);
        setCreateOpen(false);
        setFormName("");
        setFormLocation("");
        setFormType("");
        setFormQuery("");
        setFormMinPrice("");
        setFormMaxPrice("");
        setFormBedrooms("");
        toast({
          title: "Search Saved! 🔔",
          description: "Your custom search filter has been added.",
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Could not save search",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to save search",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/saved-searches?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setSearches((prev) => prev.filter((s) => s.id !== id));
        toast({ title: "Saved search removed" });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete saved search",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Search Alerts &amp; Criteria
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
            <Search className="h-7 w-7 text-[#C89B3C]" /> Saved Searches
          </h1>
          <p className="text-[#6B7280] text-sm mt-1">
            Re-run your favorite property filters or create custom search alerts
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 shadow-sm border-0 cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Create Saved Search
        </Button>
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
            Click &quot;Create Saved Search&quot; above or click &quot;Save Search&quot; when browsing properties to keep your favorite filters handy.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#07111F] text-[#D9B45B] text-xs font-bold border border-[#C89B3C]/40 hover:bg-[#0B1728] cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Search
            </Button>
            <Link
              href="/customer/properties"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold shadow-md shadow-[#C89B3C]/15 hover:brightness-105 transition-all"
            >
              Browse Properties <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {searches.map((s) => {
            const query = new URLSearchParams();
            if (s.location) query.set("city", s.location);
            if (s.propertyType) query.set("type", s.propertyType);
            if (s.query) query.set("q", s.query);
            if (s.minPrice) query.set("minPrice", String(s.minPrice));
            if (s.maxPrice) query.set("maxPrice", String(s.maxPrice));
            if (s.bedrooms) query.set("bedrooms", String(s.bedrooms));

            return (
              <div
                key={s.id}
                className="bg-[#FCFBF7] rounded-2xl p-6 shadow-xs border border-[#E8E1D4] flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#C89B3C]/50 transition-all"
              >
                <div className="space-y-2">
                  <h3 className="font-serif font-bold text-[#07111F] text-base">
                    {s.name || "Custom Property Search"}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2.5 text-xs text-[#6B7280]">
                    {s.location && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4] font-medium text-[#07111F]">
                        <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {s.location}
                      </span>
                    )}
                    {s.propertyType && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4] font-medium text-[#07111F]">
                        <Building2 className="h-3.5 w-3.5 text-[#C89B3C]" /> {s.propertyType}
                      </span>
                    )}
                    {s.query && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4] font-medium text-[#07111F]">
                        <Search className="h-3.5 w-3.5 text-[#C89B3C]" /> &ldquo;{s.query}&rdquo;
                      </span>
                    )}
                    {(s.minPrice || s.maxPrice) && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4] font-medium text-[#07111F]">
                        <DollarSign className="h-3.5 w-3.5 text-[#C89B3C]" />
                        {s.minPrice ? formatPrice(s.minPrice) : "$0"} –{" "}
                        {s.maxPrice ? formatPrice(s.maxPrice) : "Any"}
                      </span>
                    )}
                    {s.bedrooms && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4] font-medium text-[#07111F]">
                        <BedDouble className="h-3.5 w-3.5 text-[#C89B3C]" /> {s.bedrooms}+ Beds
                      </span>
                    )}
                    {!s.location && !s.propertyType && !s.query && !s.minPrice && !s.maxPrice && !s.bedrooms && (
                      <span className="flex items-center gap-1 bg-[#F7F3EA] px-2.5 py-1 rounded-lg border border-[#E8E1D4]">
                        All Verified Properties
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#A97918] flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3" /> Saved on{" "}
                    {new Date(s.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/customer/properties${query.toString() ? `?${query.toString()}` : ""}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] rounded-xl text-xs font-bold hover:brightness-105 shadow-xs transition-all"
                  >
                    Run Search <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s.id)}
                    className="h-8 border-[#E8E1D4] text-[#DC2626] hover:bg-red-50 hover:border-red-200 rounded-xl cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Saved Search Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] rounded-2xl p-6 shadow-xl border border-[#E8E1D4]">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif font-bold text-[#07111F] flex items-center gap-2">
              <Bookmark className="h-5 w-5 text-[#C89B3C]" /> Create Saved Search
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Save your preferred city, property type, and budget criteria to quickly run this search anytime.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSearch} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Search Label (Optional)</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g., Hargeisa Family Villas"
                className="h-9 border-[#E8E1D4] rounded-xl text-xs bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">City / Location</Label>
                <select
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium outline-none"
                >
                  <option value="">Any City</option>
                  <option value="Mogadishu">Mogadishu</option>
                  <option value="Hargeisa">Hargeisa</option>
                  <option value="Garowe">Garowe</option>
                  <option value="Kismayo">Kismayo</option>
                  <option value="Bosaso">Bosaso</option>
                  <option value="Baidoa">Baidoa</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Property Type</Label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium outline-none"
                >
                  <option value="">All Types</option>
                  <option value="VILLA">Villa</option>
                  <option value="APARTMENT">Apartment</option>
                  <option value="HOUSE">House</option>
                  <option value="TOWNHOUSE">Townhouse</option>
                  <option value="OFFICE">Office</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="LAND">Land</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Min Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formMinPrice}
                  onChange={(e) => setFormMinPrice(e.target.value)}
                  placeholder="0"
                  className="h-9 border-[#E8E1D4] rounded-xl text-xs bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Max Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  value={formMaxPrice}
                  onChange={(e) => setFormMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="h-9 border-[#E8E1D4] rounded-xl text-xs bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-[#07111F]">Min Beds</Label>
                <Input
                  type="number"
                  min={0}
                  value={formBedrooms}
                  onChange={(e) => setFormBedrooms(e.target.value)}
                  placeholder="Any"
                  className="h-9 border-[#E8E1D4] rounded-xl text-xs bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#07111F]">Keywords (Optional)</Label>
              <Input
                value={formQuery}
                onChange={(e) => setFormQuery(e.target.value)}
                placeholder="e.g., Luxury, Hodan, Jigjiga Yar..."
                className="h-9 border-[#E8E1D4] rounded-xl text-xs bg-white"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                className="rounded-xl border-[#E8E1D4] text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating}
                className="bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] hover:brightness-105 rounded-xl text-xs font-bold gap-1.5 border-0"
              >
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bookmark className="h-3.5 w-3.5" />}
                Save Search
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
