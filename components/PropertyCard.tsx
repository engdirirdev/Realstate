"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MapPin, BedDouble, Bath, SquareStack, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface PropertyCardData {
  id: string;
  title: string;
  price: number;
  location: string;
  city: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  images?: { url: string; altText?: string | null }[];
  isFeatured?: boolean;
  score?: number; // AI Match Score if provided
  isFavorited?: boolean;
}

interface PropertyCardProps {
  property: PropertyCardData;
  className?: string;
  onFavoriteToggle?: (id: string, favorited: boolean) => void;
}

export default function PropertyCard({
  property,
  className,
  onFavoriteToggle,
}: PropertyCardProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [isFav, setIsFav] = useState(property.isFavorited || false);
  const [savingFav, setSavingFav] = useState(false);

  const isRent = property.price < 5000;
  const imageUrl =
    property.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      toast({
        title: "Please sign in",
        description: "Sign in to save properties to your favorites list.",
        variant: "destructive",
      });
      return;
    }

    setSavingFav(true);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id }),
      });
      const data = await res.json();
      if (res.ok) {
        const nextState = !isFav;
        setIsFav(nextState);
        toast({
          title: nextState ? "Added to Favorites ❤️" : "Removed from Favorites",
          description: property.title,
        });
        if (onFavoriteToggle) onFavoriteToggle(property.id, nextState);
      }
    } catch {
      toast({
        title: "Error",
        description: "Could not update favorites.",
        variant: "destructive",
      });
    } finally {
      setSavingFav(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative bg-white rounded-2xl border border-[#DCE6F2] overflow-hidden shadow-xs hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 flex flex-col",
        className
      )}
    >
      <Link href={`/properties/${property.id}`} className="block relative aspect-[16/10] overflow-hidden bg-[#F1F5F9]">
        <img
          src={imageUrl}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-semibold shadow-xs",
              isRent
                ? "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                : "bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]"
            )}
          >
            {isRent ? "For Rent" : "For Sale"}
          </span>

          {property.score !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FAF5FF] text-[#7E22CE] border border-[#E9D5FF] shadow-xs">
              <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
              {Math.round(property.score)}% Match
            </span>
          )}
        </div>

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          disabled={savingFav}
          aria-label="Save to favorites"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#64748B] hover:text-[#EF4444] hover:bg-white shadow-xs transition-all active:scale-90"
        >
          <Heart
            className={cn("w-4 h-4 transition-colors", isFav ? "fill-[#EF4444] text-[#EF4444]" : "")}
          />
        </button>
      </Link>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <Link href={`/properties/${property.id}`}>
            <h3 className="font-bold text-[#0F172A] text-base group-hover:text-[#1677FF] transition-colors line-clamp-1">
              {property.title}
            </h3>
          </Link>

          <p className="flex items-center gap-1.5 text-xs text-[#64748B] mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1677FF] flex-shrink-0" />
            <span className="truncate">{property.city ? `${property.city}, Somalia` : property.location}</span>
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-[#EDF3FA]">
          <div className="flex items-baseline justify-between mb-3">
            <div className="text-lg font-extrabold text-[#1677FF]">
              {formatPrice(property.price)}
              {isRent && <span className="text-xs font-normal text-[#64748B]"> /month</span>}
            </div>
            <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider bg-[#F5F8FC] px-2 py-0.5 rounded-md border border-[#DCE6F2]">
              {property.type}
            </span>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-3 gap-2 text-xs text-[#475569] font-medium bg-[#F8FAFC] py-2 px-2.5 rounded-xl border border-[#EDF3FA]">
            <div className="flex items-center gap-1.5 justify-center">
              <BedDouble className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center border-x border-[#DCE6F2]">
              <Bath className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1.5 justify-center">
              <SquareStack className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{property.area} m²</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
