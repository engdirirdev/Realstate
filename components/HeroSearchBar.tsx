"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSearchBarProps {
  className?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

function mapCategoryToPropertyType(name: string, slug?: string): string {
  const s = `${slug || ""} ${name}`.toLowerCase();
  if (s.includes("apartment") || s.includes("flat") || s.includes("condo") || s.includes("penthouse")) return "APARTMENT";
  if (s.includes("villa") || s.includes("estate") || s.includes("mansion")) return "VILLA";
  if (s.includes("land") || s.includes("plot") || s.includes("farm") || s.includes("acre")) return "LAND";
  if (s.includes("office")) return "OFFICE";
  if (s.includes("warehouse") || s.includes("depot") || s.includes("storage") || s.includes("industrial") || s.includes("logistics")) return "WAREHOUSE";
  if (s.includes("shop") || s.includes("retail") || s.includes("store") || s.includes("mall")) return "SHOP";
  if (s.includes("commercial") || s.includes("business") || s.includes("plaza")) return "COMMERCIAL";
  if (s.includes("townhouse")) return "TOWNHOUSE";
  if (s.includes("studio")) return "STUDIO";
  if (s.includes("house") || s.includes("home") || s.includes("residential")) return "HOUSE";
  return "OTHER";
}

export default function HeroSearchBar({ className }: HeroSearchBarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"BUY" | "RENT" | "SELL" | "COMMERCIAL">("BUY");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [locRes, catRes] = await Promise.all([
          fetch("/api/locations"),
          fetch("/api/categories"),
        ]);
        const locData = await locRes.json();
        const catData = await catRes.json();
        if (locData.success && Array.isArray(locData.cities)) {
          setCities(locData.cities);
        }
        if (catData.success && Array.isArray(catData.categories)) {
          setCategories(catData.categories);
        }
      } catch (err) {
        console.error("Failed to load search options", err);
      }
    }
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === "SELL") {
      router.push("/dashboard/properties/add");
      return;
    }

    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (propertyType && propertyType !== "ALL") params.set("type", propertyType);
    else if (activeTab === "COMMERCIAL") params.set("type", "COMMERCIAL");

    if (activeTab === "RENT") {
      params.set("maxPrice", "5000");
    } else if (priceRange === "under50k") {
      params.set("maxPrice", "50000");
    } else if (priceRange === "50k-100k") {
      params.set("minPrice", "50000");
      params.set("maxPrice", "100000");
    } else if (priceRange === "100k-250k") {
      params.set("minPrice", "100000");
      params.set("maxPrice", "250000");
    } else if (priceRange === "250k+") {
      params.set("minPrice", "250000");
    }

    router.push(`/properties?${params.toString()}`);
  };

  return (
    <div className={cn("bg-[#FCFBF7]/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl border border-[#E8E1D4] max-w-4xl mx-auto", className)}>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#E8E1D4] pb-3">
        {(["BUY", "RENT", "SELL", "COMMERCIAL"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 capitalize cursor-pointer",
                isActive
                  ? "bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] shadow-sm"
                  : "text-[#6B7280] hover:text-[#07111F] hover:bg-[#F7F3EA]"
              )}
            >
              {tab === "BUY" ? "Buy" : tab === "RENT" ? "Rent" : tab === "SELL" ? "Sell" : "Commercial"}
            </button>
          );
        })}
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        {/* Location */}
        <div className="text-left space-y-1">
          <label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C89B3C]" />
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] text-xs sm:text-sm text-[#07111F] focus:outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] transition-colors"
          >
            <option value="">Select location</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type */}
        <div className="text-left space-y-1">
          <label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#C89B3C]" />
            Property Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] text-xs sm:text-sm text-[#07111F] focus:outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] transition-colors"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={mapCategoryToPropertyType(cat.name, cat.slug)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="text-left space-y-1">
          <label className="text-xs font-bold text-[#07111F] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#C89B3C]" />
            Price Range
          </label>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#E8E1D4] bg-[#FCFBF7] text-xs sm:text-sm text-[#07111F] focus:outline-none focus:border-[#C89B3C] focus:ring-1 focus:ring-[#C89B3C] transition-colors"
          >
            <option value="">Any Price</option>
            <option value="under50k">Under $50,000</option>
            <option value="50k-100k">$50,000 - $100,000</option>
            <option value="100k-250k">$100,000 - $250,000</option>
            <option value="250k+">$250,000 and above</option>
          </select>
        </div>

        {/* Submit */}
        <div>
          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-md shadow-[#C89B3C]/20 border border-[#A97918]/30 transition-all active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
