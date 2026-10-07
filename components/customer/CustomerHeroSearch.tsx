"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function CustomerHeroSearch() {
  const router = useRouter();
  const [dealType, setDealType] = useState<"BUY" | "RENT">("BUY");
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [priceRange, setPriceRange] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    // Strict listing type filter
    params.set("listingType", dealType === "RENT" ? "FOR_RENT" : "FOR_SALE");

    if (keyword.trim()) params.set("q", keyword.trim());
    if (city && city !== "All Cities") params.set("city", city);
    if (propertyType) params.set("type", propertyType);
    if (priceRange) params.set("maxPrice", priceRange);

    router.push(`/customer/properties?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSearch}
      className="bg-[#FCFBF7] p-2 sm:p-2.5 rounded-2xl shadow-xl border border-[#E8E1D4] flex flex-col md:flex-row items-stretch md:items-center gap-2 max-w-4xl"
    >
      {/* Deal Type Switch (Buy / Rent) */}
      <div className="flex bg-[#F7F3EA] p-1 rounded-xl flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            setDealType("BUY");
            setPriceRange("");
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            dealType === "BUY"
              ? "bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] shadow-xs"
              : "text-[#6B7280] hover:text-[#07111F]"
          }`}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => {
            setDealType("RENT");
            setPriceRange("");
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            dealType === "RENT"
              ? "bg-gradient-to-r from-[#C89B3C] to-[#D9B45B] text-[#07111F] shadow-xs"
              : "text-[#6B7280] hover:text-[#07111F]"
          }`}
        >
          Rent
        </button>
      </div>

      {/* Keyword Search */}
      <div className="flex-1 px-3 py-1 border-y md:border-y-0 md:border-l border-[#E8E1D4]">
        <label className="block text-[9px] font-bold uppercase tracking-wider text-[#A97918]">
          Keyword / Location
        </label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search properties, areas..."
          className="w-full bg-transparent text-xs font-semibold text-[#07111F] placeholder:text-[#94A3B8] focus:outline-hidden"
        />
      </div>

      {/* City Dropdown */}
      <div className="w-full md:w-36 px-3 py-1 border-y md:border-y-0 md:border-l border-[#E8E1D4]">
        <label className="block text-[9px] font-bold uppercase tracking-wider text-[#A97918]">
          City
        </label>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-transparent text-xs font-semibold text-[#07111F] focus:outline-hidden cursor-pointer"
        >
          <option value="">All Cities</option>
          <option value="Mogadishu">Mogadishu</option>
          <option value="Hargeisa">Hargeisa</option>
          <option value="Garowe">Garowe</option>
          <option value="Bosaso">Bosaso</option>
          <option value="Kismayo">Kismayo</option>
        </select>
      </div>

      {/* Property Type Dropdown */}
      <div className="w-full md:w-32 px-3 py-1 border-y md:border-y-0 md:border-l border-[#E8E1D4]">
        <label className="block text-[9px] font-bold uppercase tracking-wider text-[#A97918]">
          Type
        </label>
        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="w-full bg-transparent text-xs font-semibold text-[#07111F] focus:outline-hidden cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="VILLA">Villa</option>
          <option value="APARTMENT">Apartment</option>
          <option value="HOUSE">House</option>
          <option value="COMMERCIAL">Commercial</option>
          <option value="LAND">Land</option>
        </select>
      </div>

      {/* Price Range Dropdown (Context-aware for Rent vs Buy) */}
      <div className="w-full md:w-32 px-3 py-1 border-y md:border-y-0 md:border-l border-[#E8E1D4]">
        <label className="block text-[9px] font-bold uppercase tracking-wider text-[#A97918]">
          Price Range
        </label>
        <select
          value={priceRange}
          onChange={(e) => setPriceRange(e.target.value)}
          className="w-full bg-transparent text-xs font-semibold text-[#07111F] focus:outline-hidden cursor-pointer"
        >
          <option value="">Any Price</option>
          {dealType === "RENT" ? (
            <>
              <option value="300">Under $300/mo</option>
              <option value="600">Under $600/mo</option>
              <option value="1200">Under $1,200/mo</option>
              <option value="2500">Under $2,500/mo</option>
            </>
          ) : (
            <>
              <option value="50000">Under $50,000</option>
              <option value="100000">Under $100,000</option>
              <option value="250000">Under $250,000</option>
              <option value="500000">Under $500,000</option>
            </>
          )}
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
