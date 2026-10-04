"use client";

import { useState } from "react";
import { Bookmark, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useSession } from "next-auth/react";

interface SaveSearchButtonProps {
  filters: {
    location?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
  };
}

export default function SaveSearchButton({ filters }: SaveSearchButtonProps) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasFilter =
    filters.location ||
    filters.type ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.bedrooms ||
    filters.bathrooms;

  if (!hasFilter) return null;

  const handleSaveSearch = async () => {
    if (!session) {
      toast({
        title: "Login Required",
        description: "Please sign in as a customer to save custom search alerts.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const name = [
        filters.location || "Any City",
        filters.type ? `${filters.type}` : "All Types",
        filters.maxPrice ? `Under $${filters.maxPrice.toLocaleString()}` : "",
      ]
        .filter(Boolean)
        .join(" • ");

      const res = await fetch("/api/user/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Search: ${name}`,
          location: filters.location || null,
          propertyType: filters.type || null,
          minPrice: filters.minPrice || null,
          maxPrice: filters.maxPrice || null,
          bedrooms: filters.bedrooms || null,
          bathrooms: filters.bathrooms || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSaved(true);
        toast({
          title: "Search Saved! 🔔",
          description: "You will find this in your Customer Dashboard under Saved Searches.",
        });
      } else {
        toast({ title: "Notice", description: data.error, variant: "destructive" });
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
      className="rounded-xl border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA] text-xs font-semibold gap-1.5 shadow-sm"
    >
      {saving ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#C89B3C]" />
      ) : saved ? (
        <Check className="h-3.5 w-3.5 text-[#C89B3C]" />
      ) : (
        <Bookmark className="h-3.5 w-3.5 text-[#C89B3C]" />
      )}
      {saved ? "Search Saved" : "Save Search Alert"}
    </Button>
  );
}
