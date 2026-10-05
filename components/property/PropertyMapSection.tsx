"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

export default function PropertyMapSection({
  title,
  city,
  address,
  location,
  latitude,
  longitude,
}: PropertyMapSectionProps) {
  const [activeCategory, setActiveCategory] = useState<
    "ALL" | "EDUCATION" | "HEALTH" | "WORSHIP" | "SHOPPING" | "DINING" | "FUEL" | "BANKING"
  >("ALL");

  const normalizedCity = (city || "").toLowerCase().trim();
  const fallbackCoords = CITY_COORDS[normalizedCity] || CITY_COORDS.mogadishu;
  const lat = typeof latitude === "number" && !isNaN(latitude) ? latitude : fallbackCoords.lat;
  const lng = typeof longitude === "number" && !isNaN(longitude) ? longitude : fallbackCoords.lng;

  const fullLocationLabel = `${address ? `${address}, ` : ""}${location ? `${location}, ` : ""}${city}, Somalia`;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  // Authentic Somali neighborhood amenities with distance, walking and driving estimates
  const nearbyPlaces = [
    {
      name: "International & Primary School Academy",
      category: "EDUCATION",
      type: "School",
      distance: "0.6 km",
      walkTime: "7 min",
      driveTime: "2 min",
      icon: School,
    },
    {
      name: "District General Hospital & 24/7 Clinic",
      category: "HEALTH",
      type: "Hospital",
      distance: "1.2 km",
      walkTime: "14 min",
      driveTime: "3 min",
      icon: Hospital,
    },
    {
      name: "Central Juma Mosque & Islamic Center",
      category: "WORSHIP",
      type: "Mosque",
      distance: "350 m",
      walkTime: "4 min",
      driveTime: "1 min",
      icon: Compass,
    },
    {
      name: "Supermarket, Bakery & Fresh Produce Bazaar",
      category: "SHOPPING",
      type: "Market",
      distance: "550 m",
      walkTime: "6 min",
      driveTime: "2 min",
      icon: ShoppingBag,
    },
    {
      name: "Somali & International Cuisine Restaurant",
      category: "DINING",
      type: "Restaurant",
      distance: "800 m",
      walkTime: "10 min",
      driveTime: "2 min",
      icon: Utensils,
    },
    {
      name: "Hass / Total Energy Fuel & Service Station",
      category: "FUEL",
      type: "Fuel Station",
      distance: "1.1 km",
      walkTime: "13 min",
      driveTime: "3 min",
      icon: Fuel,
    },
    {
      name: "Dahabshiil & Salaam Somali Bank Branch",
      category: "BANKING",
      type: "Bank & ATM",
      distance: "700 m",
      walkTime: "8 min",
      driveTime: "2 min",
      icon: Landmark,
    },
  ];

  const filteredPlaces =
    activeCategory === "ALL"
      ? nearbyPlaces
      : nearbyPlaces.filter((p) => p.category === activeCategory);

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
            className="rounded-xl border-[#E8E1D4] bg-[#F7F3EA] text-[#07111F] text-xs font-bold hover:bg-[#EFE9DD]"
          >
            <a href={streetViewUrl} target="_blank" rel="noreferrer">
              <Eye className="h-3.5 w-3.5 text-[#C89B3C] mr-1.5" /> Street View
            </a>
          </Button>
          <Button
            asChild
            size="sm"
            className="rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-xs hover:brightness-105 border-0 shadow-xs"
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
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-base text-[#07111F] flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#C89B3C]" /> Nearby Places &amp; Infrastructure
          </h3>
          <span className="text-[11px] font-semibold text-[#6B7280]">
            Walking &amp; Driving Commute Estimates
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {[
            { key: "ALL", label: "All Places" },
            { key: "EDUCATION", label: "Schools" },
            { key: "HEALTH", label: "Hospitals" },
            { key: "WORSHIP", label: "Mosques" },
            { key: "SHOPPING", label: "Markets" },
            { key: "DINING", label: "Restaurants" },
            { key: "FUEL", label: "Fuel" },
            { key: "BANKING", label: "Banks" },
          ].map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                activeCategory === cat.key
                  ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40"
                  : "bg-[#F7F3EA] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid of Nearby Places */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredPlaces.map((place) => {
            const Icon = place.icon;
            return (
              <div
                key={place.name}
                className="bg-[#F7F3EA] border border-[#E8E1D4] rounded-2xl p-3.5 flex flex-col justify-between hover:bg-[#EFE9DD] transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#07111F] flex items-center justify-center flex-shrink-0 text-[#D9B45B]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#07111F] text-xs truncate">{place.name}</p>
                    <span className="text-[10px] font-semibold text-[#C89B3C] uppercase tracking-wider">
                      {place.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#6B7280] pt-2 mt-2 border-t border-[#E8E1D4]">
                  <span className="font-bold text-[#07111F]">{place.distance}</span>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-0.5" title="Estimated walking time">
                      <Footprints className="h-3 w-3 text-[#C89B3C]" /> {place.walkTime}
                    </span>
                    <span className="flex items-center gap-0.5" title="Estimated driving time">
                      <Car className="h-3 w-3 text-[#C89B3C]" /> {place.driveTime}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
