"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useCallback, useEffect, memo } from "react";
import { Heart, MapPin, BedDouble, Bath, SquareStack, Sparkles } from "lucide-react";

import { getSession } from "next-auth/react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { PROPERTY_CARD_BLUR_DATA_URL, DEFAULT_PROPERTY_IMAGE } from "@/lib/image-utils";

export interface PropertyCardData {
  id: string;
  title: string;
  price: number;
  basePrice?: number | null;
  companyServiceFee?: number | null;
  legalTransferFee?: number | null;
  brokerCommission?: number | null;
  location: string;
  city: string;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  parking?: number;
  listingType?: string | null;
  status?: string | null;
  rentPeriod?: string | null;
  images?: { url: string; altText?: string | null }[];
  isFeatured?: boolean;
  score?: number; // AI Match Score if provided
  isFavorited?: boolean;
}

interface PropertyCardProps {
  property: PropertyCardData;
  className?: string;
  onFavoriteToggle?: (id: string, favorited: boolean) => void;
  href?: string;
  isFavorited?: boolean;
  priority?: boolean;
}

function PropertyCard({
  property,
  className,
  onFavoriteToggle,
  href,
  isFavorited,
  priority = false,
}: PropertyCardProps) {
  const { toast } = useToast();
  const [isFav, setIsFav] = useState(isFavorited ?? property.isFavorited ?? false);
  const [savingFav, setSavingFav] = useState(false);

  const isRent = property.listingType ? property.listingType === "FOR_RENT" : property.price < 5000;
  const baseRentalRate =
    typeof property.basePrice === "number" && property.basePrice > 0
      ? property.basePrice
      : property.price;
  const totalPurchasePrice =
    typeof property.basePrice === "number" && property.basePrice > 0
      ? property.basePrice + (property.companyServiceFee || 0) + (property.legalTransferFee || 0)
      : property.price;
  const displayPrice = isRent ? baseRentalRate : totalPurchasePrice;
  const isAvailable = !property.status || property.status === "APPROVED" || property.status === "PUBLISHED";
  const isLand = String(property.type).toUpperCase() === "LAND" || property.bedrooms === 0;
  const rentUnit = property.rentPeriod?.toLowerCase().replace("ly", "").replace("dai", "day") || "month";
  const imageUrl = property.images?.[0]?.url || DEFAULT_PROPERTY_IMAGE;
  const [imgSrc, setImgSrc] = useState(imageUrl);

  useEffect(() => {
    setImgSrc(imageUrl);
  }, [imageUrl]);

  const handleFavoriteClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const session = await getSession();
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
      await res.json();
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
  }, [isFav, property.id, property.title, onFavoriteToggle, toast]);

  return (
    <div
      suppressHydrationWarning
      className={cn(
        "group relative h-full bg-white rounded-2xl border border-[#E8E1D5] overflow-hidden shadow-[0_2px_12px_-3px_rgba(11,23,40,0.07)] hover:shadow-[0_16px_34px_-12px_rgba(11,23,40,0.16)] hover:border-[#D6A536]/65 hover:-translate-y-1 transition-all duration-300 flex flex-col",
        className
      )}
    >
      <Link href={href || `/properties/${property.id}`} prefetch={true} className="block relative aspect-[16/10] overflow-hidden bg-[#F5F1E8]">
        <Image
          src={imgSrc}
          alt={property.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1536px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          placeholder="blur"
          blurDataURL={PROPERTY_CARD_BLUR_DATA_URL}
          onError={() => setImgSrc(DEFAULT_PROPERTY_IMAGE)}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0B1728]/35 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 max-w-[80%]">
          <span
            className={cn(
              "px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-xs uppercase tracking-wider transition-all",
              isRent
                ? "bg-gradient-to-r from-[#D6A536] via-[#E2B952] to-[#C29124] text-[#0B1728] border border-[#E2B952]/80 shadow-md shadow-[#D6A536]/20"
                : "bg-[#0B1728]/90 text-[#D6A536] border border-[#D6A536]/50 backdrop-blur-xs"
            )}
          >
            {isRent ? "For Rent" : "For Sale"}
          </span>

          {!isAvailable && property.status && (
            <span
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-xs uppercase tracking-wider",
                property.status === "SOLD"
                  ? "bg-red-900/90 text-red-100 border border-red-500/50 backdrop-blur-xs"
                  : property.status === "RENTED"
                  ? "bg-blue-900/90 text-blue-100 border border-blue-500/50 backdrop-blur-xs"
                  : "bg-amber-900/90 text-amber-100 border border-amber-500/50 backdrop-blur-xs"
              )}
            >
              {property.status === "PAYMENT_PENDING" ? "Under Contract" : property.status}
            </span>
          )}

          {property.score !== undefined && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0B1728]/90 text-[#D6A536] border border-[#D6A536]/50 shadow-xs">
              <Sparkles className="w-3 h-3 text-[#D6A536]" />
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
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/95 backdrop-blur-xs flex items-center justify-center text-[#5F6C7B] hover:text-[#EF4444] hover:bg-white border border-[#E8E1D5] shadow-sm transition-all active:scale-90 cursor-pointer"
        >
          <Heart
            className={cn("w-4 h-4 transition-colors", isFav ? "fill-[#EF4444] text-[#EF4444]" : "")}
          />
        </button>
      </Link>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link href={href || `/properties/${property.id}`} prefetch={true}>
            <h3 className="font-bold text-[#0B1728] text-base group-hover:text-[#B88A24] font-serif transition-colors line-clamp-1">
              {property.title}
            </h3>
          </Link>

          <p className="flex items-center gap-1.5 text-xs text-[#5F6C7B] mt-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#D6A536] flex-shrink-0" />
            <span className="truncate">{property.location ? `${property.location}, ${property.city || "Abudwak"}` : `${property.city || "Abudwak"}, Somalia`}</span>
          </p>
        </div>

        <div className="mt-3.5 pt-3.5 border-t border-[#E8E1D5]">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <div className="text-lg font-extrabold text-[#0B1728]">
                <span className="text-[#D6A536]">$</span>
                <span>{displayPrice != null ? displayPrice.toLocaleString("en-US") : "0"}</span>
                {isRent && <span className="text-xs font-normal text-[#5F6C7B]">{` /${rentUnit}`}</span>}
              </div>
              <span className="text-[10px] font-bold text-[#5F6C7B] uppercase tracking-wider block mt-0.5">
                {isRent ? "Rental Rate" : "Total Purchase Price"}
              </span>
            </div>
            <span className="text-[10px] font-bold text-[#98721D] uppercase tracking-wider bg-[#F5F1E8] px-2.5 py-1 rounded-lg border border-[#E8E1D5]">
              {property.type}
            </span>
          </div>

          {/* Specs */}
          {isLand ? (
            <div className="flex items-center justify-center gap-2 text-xs text-[#0B1728] font-medium bg-[#F5F1E8] py-2 px-2.5 rounded-xl border border-[#E8E1D5]">
              <SquareStack className="w-3.5 h-3.5 text-[#D6A536]" />
              <span className="inline-flex items-center gap-1">
                <span>{String(property.type).toUpperCase() === "LAND" ? "Land Plot:" : "Total Area:"}</span>
                <strong className="font-bold">{`${property.area} m²`}</strong>
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 text-xs text-[#0B1728] font-medium bg-[#F5F1E8] py-2 px-2.5 rounded-xl border border-[#E8E1D5]">
              <div className="flex items-center gap-1.5 justify-center">
                <BedDouble className="w-3.5 h-3.5 text-[#5F6C7B]" />
                <span>{`${property.bedrooms} Beds`}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center border-x border-[#E8E1D5]">
                <Bath className="w-3.5 h-3.5 text-[#5F6C7B]" />
                <span>{`${property.bathrooms} Baths`}</span>
              </div>
              <div className="flex items-center gap-1.5 justify-center">
                <SquareStack className="w-3.5 h-3.5 text-[#5F6C7B]" />
                <span>{`${property.area} m²`}</span>
              </div>
            </div>
          )}

          {/* Action Buttons: State Aware */}
          <div className="mt-3.5 flex items-center gap-2">
            <Link
              href={href || `/properties/${property.id}`}
              prefetch={true}
              className="flex-1 py-2 px-3 text-center rounded-xl text-xs font-semibold bg-white text-[#0B1728] hover:bg-[#F5F1E8] border border-[#E8E1D5] hover:border-[#D6A536] transition-all shadow-2xs"
            >
              View Details
            </Link>

            {isAvailable ? (
              isRent ? (
                <Link
                  href={href || `/properties/${property.id}`}
                  prefetch={true}
                  className="flex-1 py-2 px-3 text-center rounded-xl text-xs font-bold bg-gradient-to-r from-[#D6A536] via-[#E2B952] to-[#C29124] hover:brightness-105 text-[#0B1728] transition-all shadow-xs"
                >
                  Book Now
                </Link>
              ) : (
                <Link
                  href={href || `/properties/${property.id}`}
                  prefetch={true}
                  className="flex-1 py-2 px-3 text-center rounded-xl text-xs font-bold bg-[#0B1728] hover:bg-[#13233A] text-[#D6A536] border border-[#D6A536]/50 transition-all shadow-xs"
                >
                  Buy Property
                </Link>
              )
            ) : (
              <span className="flex-1 py-2 px-3 text-center rounded-xl text-xs font-medium bg-[#E8E1D5]/70 text-[#5F6C7B] cursor-not-allowed">
                {property.status === "SOLD" ? "Sold" : property.status === "RENTED" ? "Rented" : "Unavailable"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(PropertyCard);
