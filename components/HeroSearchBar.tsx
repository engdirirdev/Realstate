"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSearchBarProps {
  className?: string;
}

export default function HeroSearchBar({ className }: HeroSearchBarProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"BUY" | "RENT" | "SELL" | "COMMERCIAL">("BUY");
  const [location, setLocation] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

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
    <div className={cn("bg-white/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl shadow-2xl border border-[#DCE6F2] max-w-4xl mx-auto", className)}>
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-4 border-b border-[#EDF3FA] pb-3">
        {(["BUY", "RENT", "SELL", "COMMERCIAL"] as const).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 capitalize",
                isActive
                  ? "bg-[#1677FF] text-white shadow-xs"
                  : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F5F8FC]"
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
          <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#1677FF]" />
            Location
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#DCE6F2] bg-[#F8FAFC] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#1677FF] focus:bg-white transition-colors"
          >
            <option value="">Select location</option>
            <option value="Mogadishu">Mogadishu, Somalia</option>
            <option value="Hargeisa">Hargeisa, Somaliland</option>
            <option value="Bosaso">Bosaso, Puntland</option>
            <option value="Garowe">Garowe, Puntland</option>
            <option value="Kismayo">Kismayo, Jubaland</option>
            <option value="Berbera">Berbera, Somaliland</option>
            <option value="Baydhabo">Baydhabo, Southwest</option>
          </select>
        </div>

        {/* Property Type */}
        <div className="text-left space-y-1">
          <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#1677FF]" />
            Property Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#DCE6F2] bg-[#F8FAFC] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#1677FF] focus:bg-white transition-colors"
          >
            <option value="ALL">All Types</option>
            <option value="VILLA">Luxury Villa</option>
            <option value="APARTMENT">Modern Apartment</option>
            <option value="HOUSE">Family House</option>
            <option value="OFFICE">Office Space</option>
            <option value="LAND">Land Plot</option>
            <option value="COMMERCIAL">Commercial Building</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="text-left space-y-1">
          <label className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#1677FF]" />
            Price Range
          </label>
          <select
            value={priceRange}
            onChange={(e) => setPriceRange(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#DCE6F2] bg-[#F8FAFC] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#1677FF] focus:bg-white transition-colors"
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
            className="w-full h-11 bg-[#1677FF] hover:bg-[#0F5ED7] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </form>
    </div>
  );
}
