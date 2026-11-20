"use client";

import { useState, useEffect } from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface SaveSearchButtonProps {
  filters: {
    q?: string;
    location?: string;
    city?: string;
    type?: string;
    listingType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
}

export default function SaveSearchButton({ filters }: SaveSearchButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const filterKey = JSON.stringify(filters);
  useEffect(() => {
    setSaved(false);
  }, [filterKey]);

  const handleSaveSearch = async () => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please sign in to save custom property searches.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    setSaving(true);
    try {
      const targetLocation = filters.location || filters.city || "";
      const nameParts = [
        targetLocation || "All Cities",
        filters.type ? `${filters.type}` : "All Types",
        filters.listingType === "FOR_RENT" ? "For Rent" : filters.listingType === "FOR_SALE" ? "For Sale" : "",
        filters.q ? `"${filters.q}"` : "",
        filters.maxPrice ? `Under $${filters.maxPrice.toLocaleString()}` : "",
        filters.bedrooms ? `${filters.bedrooms}+ Beds` : "",
      ].filter(Boolean);

      const res = await fetch("/api/user/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Search: ${nameParts.join(" • ")}`,
          query: filters.q || null,
          location: targetLocation || null,
          propertyType: filters.type || null,
          minPrice: filters.minPrice || null,
          maxPrice: filters.maxPrice || null,
          bedrooms: filters.bedrooms || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaved(true);
        toast({
          title: "Search Saved! 🔔",
          description: "Saved to your Customer Portal under Saved Searches.",
        });
        router.refresh();
      } else {
        toast({ title: "Notice", description: data.error || "Could not save search", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to save search.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleSaveSearch}
      disabled={saving || saved}
      className="rounded-xl border-[#C89B3C]/40 bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA] text-xs font-bold gap-1.5 shadow-xs cursor-pointer"
    >
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C89B3C]" />
      ) : saved ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" />
      ) : (
        <Bookmark className="h-3.5 w-3.5 text-[#C89B3C]" />
      )}
      {saved ? "Search Saved" : "Save Search"}
    </Button>
  );
}
