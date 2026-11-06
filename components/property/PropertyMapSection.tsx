"use client";

import { useState, useEffect, useCallback, useMemo , memo } from "react";
import {
  MapPin,
  Compass,
  School,
  Hospital,
  ShoppingBag,
  ExternalLink,
  Navigation,
  Utensils,
  Fuel,
  Landmark,
  Eye,
  Footprints,
  Car,
  CreditCard,
  Pill,
  Hotel,
  Store,
  Trees,
  Building2,
  ShieldCheck,
  ShoppingCart,
  Star,
  MapPinOff,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlaceItem } from "@/lib/google-places";

interface PropertyMapSectionProps {
  title: string;
  city: string;
  address?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

// Canonical city coordinates fallback
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  mogadishu: { lat: 2.0469, lng: 45.3182 },
  hargeisa: { lat: 9.5624, lng: 44.077 },
  bosaso: { lat: 11.2842, lng: 49.1816 },
  garowe: { lat: 8.4021, lng: 48.4845 },
  kismayo: { lat: -0.3582, lng: 42.5454 },
  berbera: { lat: 10.4396, lng: 45.0143 },
  baydhabo: { lat: 3.1138, lng: 43.6498 },
  abudwak: { lat: 6.2417, lng: 46.3986 },
};

// 15 Verification Categories with Icons
const CATEGORY_TABS = [
  { key: "ALL", label: "All Places", icon: Compass },
  { key: "SCHOOL", label: "Schools", icon: School },
  { key: "HOSPITAL", label: "Hospitals", icon: Hospital },
  { key: "MOSQUE", label: "Mosques", icon: Landmark },
  { key: "RESTAURANT", label: "Restaurants", icon: Utensils },
  { key: "MARKET", label: "Markets", icon: ShoppingBag },
  { key: "SUPERMARKET", label: "Supermarkets", icon: ShoppingCart },
  { key: "FUEL", label: "Fuel Stations", icon: Fuel },
  { key: "BANK", label: "Banks", icon: Landmark },
  { key: "ATM", label: "ATMs", icon: CreditCard },
  { key: "PHARMACY", label: "Pharmacies", icon: Pill },
  { key: "HOTEL", label: "Hotels", icon: Hotel },
  { key: "SHOPPING_MALL", label: "Shopping Centers", icon: Store },
  { key: "PARK", label: "Parks", icon: Trees },
  { key: "GOVERNMENT", label: "Government Offices", icon: Building2 },
  { key: "POLICE", label: "Police Stations", icon: ShieldCheck },
];

const RADIUS_OPTIONS = [
  { label: "1 km", value: 1000 },
  { label: "3 km", value: 3000 },
  { label: "5 km", value: 5000 },
  { label: "10 km", value: 10000 },
];

function PropertyMapSection({
  title,
  city,
  address,
  location,
  latitude,
  longitude,
}: PropertyMapSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [activeRadius, setActiveRadius] = useState<number>(3000);
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const normalizedCity = (city || "").toLowerCase().trim();
  const fallbackCoords = CITY_COORDS[normalizedCity] || CITY_COORDS.mogadishu;
  const lat = typeof latitude === "number" && !isNaN(latitude) ? latitude : fallbackCoords.lat;
  const lng = typeof longitude === "number" && !isNaN(longitude) ? longitude : fallbackCoords.lng;

  const fullLocationLabel = `${address ? `${address}, ` : ""}${location ? `${location}, ` : ""}${city}, Somalia`;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  // Fetch real nearby places whenever latitude, longitude, radius, or category changes
  const fetchPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL("/api/places/nearby", window.location.origin);
      url.searchParams.set("lat", lat.toString());
      url.searchParams.set("lng", lng.toString());
      url.searchParams.set("radius", activeRadius.toString());
      url.searchParams.set("category", activeCategory);
      if (city) url.searchParams.set("city", city);
      if (address) url.searchParams.set("address", address);

      const res = await fetch(url.toString(), {
        cache: "default",
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.places)) {
        setPlaces(data.places);
        setError(null);
      } else {
        setError(data.error || "Failed to load real nearby places.");
        setPlaces([]);
      }
    } catch (err: any) {
      console.error("[PropertyMapSection] Fetch error:", err);
      setError("Network error while connecting to places service.");
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, activeRadius, activeCategory, city, address]);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  // Icon lookup helper
  const getCategoryIcon = (catId: string) => {
    const found = CATEGORY_TABS.find((t) => t.key === catId);
    return found ? found.icon : Compass;
  };

  const activeCategoryMeta = useMemo(
    () => CATEGORY_TABS.find((t) => t.key === activeCategory) || CATEGORY_TABS[0],
    [activeCategory]
  );

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-7 shadow-sm space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E8E1D4] pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-1.5 border border-[#C89B3C]/30">
            <Navigation className="h-3 w-3 text-[#D9B45B]" /> Verified Geolocation
          </div>
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-[#07111F] flex items-center gap-2">
            <MapPin className="h-6 w-6 text-[#C89B3C]" /> Interactive Map &amp; Neighborhood
          </h2>
          <p className="text-xs text-[#6B7280] mt-0.5">{fullLocationLabel}</p>
        </div>

        {/* External Map & Street View buttons */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#07111F] text-xs font-bold hover:bg-[#EFE9DD] cursor-pointer"
          >
            <a href={streetViewUrl} target="_blank" rel="noreferrer">
              <Eye className="h-3.5 w-3.5 text-[#C89B3C] mr-1.5" /> Street View
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs hover:brightness-105 border-0 shadow-xs cursor-pointer"
          >
            <a href={googleMapsUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> Open in Google Maps
            </a>
          </Button>
        </div>
      </div>

      {/* ── Interactive Map Embed ── */}
      <div className="relative rounded-2xl overflow-hidden border border-[#E8E1D4] h-[320px] sm:h-[400px] bg-[#E8E1D4] shadow-inner">
        <iframe
          src={mapEmbedUrl}
          className="w-full h-full border-0"
          loading="lazy"
          title={`Map location of ${title}`}
          aria-label={`Interactive map of ${title}`}
        />
        {/* Floating Coordinates overlay */}
        <div className="absolute bottom-3 left-3 bg-[#07111F]/90 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-xl border border-white/20 font-mono shadow-md flex items-center gap-2 pointer-events-none">
          <MapPin className="h-3.5 w-3.5 text-[#D9B45B]" />
          <span>
            {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
          </span>
        </div>
      </div>

      {/* ── Nearby Places Directory ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-base text-[#07111F] flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#C89B3C]" /> Nearby Places &amp; Infrastructure
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              Real-world verified places with actual walking &amp; driving commute times
            </p>
          </div>

          {/* Configurable Radius Selector */}
          <div className="flex items-center gap-1.5 bg-[#F7F3EA] border border-[#E8E1D4] rounded-xl p-1 self-start sm:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] px-1.5">
              Radius:
            </span>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setActiveRadius(r.value)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  activeRadius === r.value
                    ? "bg-[#07111F] text-[#D9B45B] shadow-2xs"
                    : "text-[#6B7280] hover:text-[#07111F]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* 15 Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_TABS.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                  isActive
                    ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40 shadow-2xs"
                    : "bg-[#F7F3EA] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F] hover:bg-[#EFE9DD]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#D9B45B]" : "text-[#A97918]"}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Network Error Banner */}
        {error && !loading && (
          <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-4 text-center">
            <p className="text-xs text-[#6B7280]">{error}</p>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3.5 flex flex-col justify-between h-[120px] animate-pulse"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-11 h-11 rounded-xl bg-[#E8E1D4]/80 shrink-0" />
                  <div className="space-y-2 flex-1 pt-1">
                    <div className="h-3.5 bg-[#E8E1D4]/90 rounded-md w-3/4" />
                    <div className="h-2.5 bg-[#E8E1D4]/60 rounded-md w-1/3" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-[#E8E1D4]">
                  <div className="h-3 bg-[#E8E1D4]/80 rounded-md w-14" />
                  <div className="h-3 bg-[#E8E1D4]/80 rounded-md w-28" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State: Exactly "No nearby places found." */}
        {!loading && !error && places.length === 0 && (
          <div className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#07111F] text-[#D9B45B] flex items-center justify-center shadow-xs">
              <MapPinOff className="h-6 w-6" />
            </div>
            <p className="font-serif font-bold text-base text-[#07111F]">
              No nearby places found.
            </p>
            <p className="text-xs text-[#6B7280] max-w-sm">
              No {activeCategoryMeta.label.toLowerCase()} were located within {activeRadius / 1000} km of this property&apos;s coordinates. Try selecting another category or increasing the search radius above.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setActiveRadius(5000);
                setActiveCategory("ALL");
              }}
              className="mt-2 text-xs font-bold rounded-xl border-[#E8E1D4] bg-white text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" /> Expand Search to 5 km (All Places)
            </Button>
          </div>
        )}

        {/* Real Places Grid */}
        {!loading && !error && places.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {places.map((place) => {
              const CategoryIcon = getCategoryIcon(place.category);

              return (
                <div
                  key={place.id}
                  className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3.5 flex flex-col justify-between hover:bg-[#EFE9DD] transition-all group shadow-2xs"
                >
                  <div className="space-y-2">
                    {/* Top: Icon / Photo + Place Title & Category */}
                    <div className="flex items-start gap-2.5">
                      {place.photoUrl ? (
                        <div className="w-11 h-11 rounded-xl overflow-hidden border border-[#E8E1D4] bg-[#07111F] shrink-0 relative">
                          <img
                            src={place.photoUrl}
                            alt={place.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            loading="lazy"
                            onError={(e) => {
                              // If image fails, replace with icon
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#07111F] flex items-center justify-center shrink-0 text-[#D9B45B] shadow-2xs">
                          <CategoryIcon className="h-4 w-4" />
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <a
                          href={place.googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-[#07111F] text-xs truncate block hover:text-[#C89B3C] transition-colors"
                          title={place.name}
                        >
                          {place.name}
                        </a>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#C89B3C] uppercase tracking-wider">
                            {place.categoryLabel}
                          </span>
                          {place.isOpenNow !== null && (
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                                place.isOpenNow
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-stone-100 text-stone-600 border-stone-200"
                              }`}
                            >
                              {place.isOpenNow ? "Open now" : "Closed"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Rating / Review + Google Maps Link */}
                    <div className="flex items-center justify-between text-[11px] text-[#6B7280]">
                      {place.rating !== null ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          <span className="font-bold text-[#07111F]">{place.rating.toFixed(1)}</span>
                          {place.userRatingsTotal !== null && (
                            <span className="text-[#6B7280] text-[10px]">
                              ({place.userRatingsTotal})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#9CA3AF]">Google Verified</span>
                      )}

                      <a
                        href={place.googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#A97918] hover:underline"
                        title="View on Google Maps"
                      >
                        <span>Maps Link</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>

                  {/* Footer: Real Distance, Walking Time, Driving Time */}
                  <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 mt-2 border-t border-[#E8E1D4]">
                    <span className="font-bold text-[#07111F]">{place.distance}</span>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5 font-medium" title="Estimated walking time">
                        <Footprints className="h-3 w-3 text-[#C89B3C]" /> {place.walkTime}
                      </span>
                      <span className="flex items-center gap-0.5 font-medium" title="Estimated driving time">
                        <Car className="h-3 w-3 text-[#C89B3C]" /> {place.driveTime}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(PropertyMapSection);
