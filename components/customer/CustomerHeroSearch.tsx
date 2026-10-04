"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function CustomerHeroSearch() {
  const router = useRouter();
  const [dealType, setDealType] = useState<"BUY" | "RENT">("BUY");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (dealType === "RENT") params.set("type", "APARTMENT");
    if (city) params.set("city", city);
    if (propertyType) params.set("type", propertyType);
    if (priceRange) params.set("maxPrice", priceRange);
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="bg-[#FCFBF7]/95 backdrop-blur-md p-2.5 rounded-2xl shadow-xl border border-[#E8E1D4] flex flex-col md:flex-row items-center gap-2 max-w-2xl">
      {/* Deal Type Switch */}
      <div className="flex bg-[#F7F3EA] p-1 rounded-xl w-full md:w-auto">
        <button
          type="button"
          onClick={() => setDealType("BUY")}
          className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            dealType === "BUY"
              ? "bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] shadow-xs"
              : "text-[#6B7280] hover:text-[#07111F]"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => setDealType("RENT")}
          className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            dealType === "RENT"
              ? "bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] shadow-xs"
              : "text-[#6B7280] hover:text-[#07111F]"
          }`}
        >
          Rent
        </button>
      </div>

      {/* Location */}
      <div className="w-full md:flex-1 px-2 border-y md:border-y-0 md:border-l border-[#E8E1D4] py-1 md:py-0">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A97918]">Location</label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-transparent text-xs font-bold text-[#07111F] focus:outline-hidden cursor-pointer"
        >
          <option value="">Select location</option>
          <option value="Mogadishu">Mogadishu</option>
          <option value="Hargeisa">Hargeisa</option>
          <option value="Bosaso">Bosaso</option>
          <option value="Garowe">Garowe</option>
          <option value="Kismayo">Kismayo</option>
        </select>
      </div>

      {/* Property Type */}
      <div className="w-full md:flex-1 px-2 border-y md:border-y-0 md:border-l border-[#E8E1D4] py-1 md:py-0">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A97918]">Property Type</label>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="w-full bg-transparent text-xs font-bold text-[#07111F] focus:outline-hidden cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="HOUSE">House</option>
          <option value="APARTMENT">Apartment</option>
          <option value="VILLA">Villa</option>
          <option value="LAND">Land</option>
          <option value="COMMERCIAL">Commercial</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="w-full md:flex-1 px-2 border-y md:border-y-0 md:border-l border-[#E8E1D4] py-1 md:py-0">
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A97918]">Price Range</label>
        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="w-full bg-transparent text-xs font-bold text-[#07111F] focus:outline-hidden cursor-pointer"
        >
          <option value="">Any Price</option>
          <option value="50000">Under $50k</option>
          <option value="150000">Under $150k</option>
          <option value="300000">Under $300k</option>
          <option value="500000">Under $500k</option>
        </select>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full md:w-auto bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:brightness-105 text-[#07111F] px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#C89B3C]/20 border border-[#A97918]/30 flex-shrink-0 cursor-pointer"
      >
        <Search className="h-4 w-4" />
        <span>Search</span>
      </button>
    </form>
  );
}
