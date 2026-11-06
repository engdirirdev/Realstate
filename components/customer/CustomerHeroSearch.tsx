"use client";

import { useState, useEffect , memo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface CustomerHeroSearchProps {
  initialCities?: string[];
}

function CustomerHeroSearch({ initialCities }: CustomerHeroSearchProps) {
  const router = useRouter();
  const [dealType, setDealType] = useState<"BUY" | "RENT">("BUY");
  const [keyword, setKeyword] = useState("");
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [availableCities, setAvailableCities] = useState<string[]>(
    initialCities && initialCities.length > 0
      ? initialCities
      : [
          "Abudwak",
          "Berbera",
          "Bosaso",
          "Burao",
          "Garowe",
          "Hargeisa",
          "Kismayo",
          "Mogadishu",
        ]
  );

  // If initialCities were not supplied via SSR, fetch from API with caching
  useEffect(() => {
    if (initialCities && initialCities.length > 0) return;

    fetch("/api/locations")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.cities) && data.cities.length > 0) {
          setAvailableCities(data.cities);
        }
      })
      .catch(() => {});
  }, [initialCities]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();

    // Strict listing type filter
    const effectiveListingType = propertyType === "LAND" ? "FOR_SALE" : (dealType === "RENT" ? "FOR_RENT" : "FOR_SALE");
    params.set("listingType", effectiveListingType);

    if (keyword.trim()) params.set("q", keyword.trim());
    if (city && city !== "All Cities") params.set("city", city);
    if (propertyType) params.set("type", propertyType);

    router.push(`/customer/properties?${params.toString()}`);
  };

  return (
    <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-4 sm:p-6 shadow-sm">
      {/* Tab toggle: Buy vs Rent */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setDealType("BUY")}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            dealType === "BUY"
              ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
              : "bg-white text-[#6B7280] hover:text-[#07111F] border border-[#E8E1D4]"
          }`}
        >
          Buy Properties
        </button>
        <button
          type="button"
          onClick={() => setDealType("RENT")}
          className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            dealType === "RENT"
              ? "bg-[#07111F] text-[#D9B45B] shadow-xs"
              : "bg-white text-[#6B7280] hover:text-[#07111F] border border-[#E8E1D4]"
          }`}
        >
          Rent Properties
        </button>
      </div>

      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Keyword Search */}
        <div className="lg:col-span-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
            Search Term
          </label>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. Modern Villa, Hodan, pool..."
            className="w-full h-11 px-3.5 rounded-xl border border-[#E8E1D4] bg-white text-sm text-[#07111F] placeholder-[#9CA3AF] focus:outline-hidden focus:border-[#C89B3C]"
          />
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
            City
          </label>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#E8E1D4] bg-white text-sm text-[#07111F] focus:outline-hidden focus:border-[#C89B3C]"
          >
            <option value="">All Cities</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Property Type Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
            Category
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-[#E8E1D4] bg-white text-sm text-[#07111F] focus:outline-hidden focus:border-[#C89B3C]"
          >
            <option value="">All Categories</option>
            <option value="VILLA">Villa</option>
            <option value="APARTMENT">Apartment</option>
            <option value="HOUSE">House</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="OFFICE">Office</option>
            <option value="LAND">Land Plot</option>
            <option value="TOWNHOUSE">Townhouse</option>
            <option value="STUDIO">Studio</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] font-bold text-sm rounded-xl hover:brightness-105 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" /> Find Listings
          </button>
        </div>
      </form>
    </div>
  );
}

export default memo(CustomerHeroSearch);
