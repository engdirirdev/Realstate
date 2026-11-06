"use client";

import { useState, useRef, useTransition, useEffect , memo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  MapPin,
  KeyRound,
  Building2,
  BedDouble,
  DollarSign,
  ArrowUpDown,
  ChevronDown,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface CityItem {
  city: string;
  region?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  code: string;
}

interface PropertiesSearchFilterFormProps {
  keywordQuery?: string;
  searchLocation?: string;
  listingType?: string;
  selectedType?: string;
  bedrooms?: string;
  maxPrice?: string;
  sort?: string;
  availableCities: CityItem[];
  categories: CategoryItem[];
  totalCount: number;
  hasActiveFilters: boolean;
}

function PropertiesSearchFilterForm({
  keywordQuery = "",
  searchLocation = "",
  listingType = "",
  selectedType = "",
  bedrooms = "",
  maxPrice = "",
  sort = "",
  availableCities,
  categories,
  totalCount,
  hasActiveFilters,
}: PropertiesSearchFilterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [currentType, setCurrentType] = useState<string>(selectedType || "");
  const [currentLocation, setCurrentLocation] = useState<string>(searchLocation || "");
  const [currentListingType, setCurrentListingType] = useState<string>(
    selectedType === "LAND" ? "FOR_SALE" : (listingType || "")
  );
  const [currentBedrooms, setCurrentBedrooms] = useState<string>(bedrooms || "");
  const [currentMaxPrice, setCurrentMaxPrice] = useState<string>(maxPrice || "");
  const [currentSort, setCurrentSort] = useState<string>(sort || "");
  const [currentQuery, setCurrentQuery] = useState<string>(keywordQuery || "");

  // Sync state if props change from outside (e.g. browser back/forward)
  useEffect(() => {
    setCurrentType(selectedType || "");
    setCurrentLocation(searchLocation || "");
    setCurrentListingType(selectedType === "LAND" ? "FOR_SALE" : (listingType || ""));
    setCurrentBedrooms(bedrooms || "");
    setCurrentMaxPrice(maxPrice || "");
    setCurrentSort(sort || "");
    setCurrentQuery(keywordQuery || "");
  }, [selectedType, searchLocation, listingType, bedrooms, maxPrice, sort, keywordQuery]);

  const isLand = currentType === "LAND";

  // Build URL parameters and navigate seamlessly without browser reload
  const executeSearch = (overrides: Record<string, string> = {}) => {
    const qVal = "q" in overrides ? overrides.q : currentQuery;
    const typeVal = "type" in overrides ? overrides.type : currentType;
    const locVal = "location" in overrides ? overrides.location : currentLocation;
    const listVal = "listingType" in overrides ? overrides.listingType : currentListingType;
    const bedVal = "bedrooms" in overrides ? overrides.bedrooms : currentBedrooms;
    const maxVal = "maxPrice" in overrides ? overrides.maxPrice : currentMaxPrice;
    const sortVal = "sort" in overrides ? overrides.sort : currentSort;

    const params = new URLSearchParams();

    if (qVal && qVal.trim()) params.set("q", qVal.trim());
    if (typeVal) params.set("type", typeVal);
    if (locVal) params.set("location", locVal);
    if (listVal) params.set("listingType", listVal);
    if (bedVal && typeVal !== "LAND") params.set("bedrooms", bedVal);
    if (maxVal) params.set("maxPrice", maxVal);
    if (sortVal) params.set("sort", sortVal);

    const queryStr = params.toString();
    const targetUrl = queryStr ? `/properties?${queryStr}` : `/properties`;

    startTransition(() => {
      router.push(targetUrl, { scroll: false });
    });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value;
    setCurrentType(newType);
    let nextListType = currentListingType;
    let nextBeds = currentBedrooms;
    if (newType === "LAND") {
      nextBeds = "";
      nextListType = "FOR_SALE";
      setCurrentBedrooms("");
      setCurrentListingType("FOR_SALE");
    }
    executeSearch({ type: newType, listingType: nextListType, bedrooms: nextBeds });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLoc = e.target.value;
    setCurrentLocation(newLoc);
    executeSearch({ location: newLoc });
  };

  const handleListingTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newListType = e.target.value;
    setCurrentListingType(newListType);
    let nextMaxPrice = currentMaxPrice;
    if (newListType === "FOR_RENT" && Number(currentMaxPrice) > 10000) {
      nextMaxPrice = "";
      setCurrentMaxPrice("");
    } else if (newListType === "FOR_SALE" && Number(currentMaxPrice) > 0 && Number(currentMaxPrice) < 5000) {
      nextMaxPrice = "";
      setCurrentMaxPrice("");
    }
    executeSearch({ listingType: newListType, maxPrice: nextMaxPrice });
  };

  const handleBedroomsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newBeds = e.target.value;
    setCurrentBedrooms(newBeds);
    executeSearch({ bedrooms: newBeds });
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrice = e.target.value;
    setCurrentMaxPrice(newPrice);
    executeSearch({ maxPrice: newPrice });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    setCurrentSort(newSort);
    executeSearch({ sort: newSort });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeSearch();
  };

  const handleReset = () => {
    setCurrentType("");
    setCurrentLocation("");
    setCurrentListingType("");
    setCurrentBedrooms("");
    setCurrentMaxPrice("");
    setCurrentSort("");
    setCurrentQuery("");
    startTransition(() => {
      router.push("/properties", { scroll: false });
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Top Row: Direct Fast Search Input */}
      <div className="relative">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
          <Search className="w-3 h-3 text-[#C89B3C]" />
          <span>Search Keywords / District / Property</span>
        </label>
        <div className="relative">
          <input
            type="text"
            name="q"
            value={currentQuery}
            onChange={(e) => setCurrentQuery(e.target.value)}
            placeholder="Search by neighborhood (e.g. Hodan, Wadajir, Jigjiga Yar), title, or amenities (pool, garden)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all placeholder:text-[#9CA3AF] shadow-2xs"
          />
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918]" />
        </div>
      </div>

      {/* Responsive Filter Grid: 1. Property Type -> 2. City / Location -> 3. Listing Type -> 4. Bedrooms -> 5. Max Budget -> 6. Sort */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${
          isLand ? "xl:grid-cols-5" : "xl:grid-cols-6"
        } gap-3.5 transition-all duration-300`}
      >
        {/* 1. Property Type (First) */}
        <div className="relative group">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
            <Building2 className="w-3 h-3 text-[#C89B3C]" />
            <span>Property Type</span>
          </label>
          <div className="relative">
            <select
              name="type"
              value={currentType}
              onChange={handleTypeChange}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.code}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
          </div>
        </div>

        {/* 2. Destination / City Selector (Second) */}
        <div className="relative group">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
            <MapPin className="w-3 h-3 text-[#C89B3C]" />
            <span>City / Location</span>
          </label>
          <div className="relative">
            <select
              name="location"
              value={currentLocation}
              onChange={handleLocationChange}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">All Registered Cities</option>
              {availableCities.map((c) => (
                <option key={c.city} value={c.city}>
                  {c.city} {c.region ? `(${c.region})` : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
          </div>
        </div>

        {/* 3. Listing Purpose (Rent / Sale) - Locked to For Sale if Land is chosen (Third) */}
        <div className="relative group">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
            <KeyRound className="w-3 h-3 text-[#C89B3C]" />
            <span>Listing Type</span>
          </label>
          <div className="relative">
            {isLand ? (
              <>
                <select
                  disabled
                  value="FOR_SALE"
                  className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#C89B3C]/50 bg-[#C89B3C]/10 text-[#07111F] text-xs font-bold h-11 transition-all cursor-not-allowed shadow-2xs"
                >
                  <option value="FOR_SALE">For Sale Only</option>
                </select>
                <input type="hidden" name="listingType" value="FOR_SALE" />
              </>
            ) : (
              <select
                name="listingType"
                value={currentListingType}
                onChange={handleListingTypeChange}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
              >
                <option value="">All (Rent &amp; Sale)</option>
                <option value="FOR_RENT">For Rent</option>
                <option value="FOR_SALE">For Sale</option>
              </select>
            )}
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
          </div>
        </div>

        {/* 4. Bedrooms - Disappears when Land is chosen */}
        {!isLand && (
          <div className="relative group transition-opacity duration-200">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
              <BedDouble className="w-3 h-3 text-[#C89B3C]" />
              <span>Bedrooms</span>
            </label>
            <div className="relative">
              <select
                name="bedrooms"
                value={currentBedrooms}
                onChange={handleBedroomsChange}
                className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
              >
                <option value="">Any Bedrooms</option>
                <option value="0">Studio (0 Beds)</option>
                <option value="1">1+ Bedrooms</option>
                <option value="2">2+ Bedrooms</option>
                <option value="3">3+ Bedrooms</option>
                <option value="4">4+ Bedrooms</option>
                <option value="5">5+ Bedrooms</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
            </div>
          </div>
        )}

        {/* 5. Max Price / Budget */}
        <div className="relative group">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
            <DollarSign className="w-3 h-3 text-[#C89B3C]" />
            <span>Max Budget</span>
          </label>
          <div className="relative">
            <select
              name="maxPrice"
              value={currentMaxPrice}
              onChange={handleMaxPriceChange}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
            >
              {currentListingType === "FOR_RENT" ? (
                <>
                  <option value="">Any Monthly Rent</option>
                  <option value="250">Under $250 / mo</option>
                  <option value="500">Under $500 / mo</option>
                  <option value="1000">Under $1,000 / mo</option>
                  <option value="2500">Under $2,500 / mo</option>
                  <option value="5000">Under $5,000 / mo</option>
                </>
              ) : (
                <>
                  <option value="">Any Price</option>
                  <option value="50000">Under $50,000</option>
                  <option value="100000">Under $100,000</option>
                  <option value="200000">Under $200,000</option>
                  <option value="500000">Under $500,000</option>
                  <option value="1000000">Under $1,000,000</option>
                </>
              )}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
          </div>
        </div>

        {/* 6. Sort Order */}
        <div className="relative group">
          <label className="text-[10px] font-bold uppercase tracking-wider text-[#A97918] mb-1.5 flex items-center gap-1 font-mono">
            <ArrowUpDown className="w-3 h-3 text-[#C89B3C]" />
            <span>Sort Order</span>
          </label>
          <div className="relative">
            <select
              name="sort"
              value={currentSort}
              onChange={handleSortChange}
              className="w-full appearance-none pl-3.5 pr-8 py-2.5 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA]/70 hover:bg-white focus:bg-white focus:border-[#C89B3C] focus:ring-2 focus:ring-[#C89B3C]/20 text-[#07111F] text-xs font-semibold h-11 transition-all cursor-pointer shadow-2xs"
            >
              <option value="">Sort: Featured &amp; Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="area_desc">Size: Largest Area</option>
              <option value="newest">Newest First</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A97918] transition-transform group-hover:text-[#07111F]" />
          </div>
        </div>
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E8E1D4]">
        <div className="flex items-center gap-2 text-xs text-[#6B7280]">
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 text-[#C89B3C] animate-spin" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <span>
            {isPending ? (
              <span className="text-[#A97918] font-semibold">Updating verified listings...</span>
            ) : (
              <>
                Showing <strong className="text-[#07111F]">{totalCount}</strong> verified properties
              </>
            )}
          </span>
          {hasActiveFilters && (
            <span className="text-[10px] font-bold uppercase text-[#A97918] bg-[#C89B3C]/10 border border-[#C89B3C]/30 px-2 py-0.5 rounded-full ml-1">
              Filters Active
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center px-5 py-2.5 border border-[#E8E1D4] bg-[#FCFBF7] hover:bg-[#F7F3EA] text-[#07111F] hover:text-[#A97918] rounded-xl text-xs font-bold h-11 transition-all gap-2 cursor-pointer shadow-2xs hover:border-[#C89B3C]/50"
            title="Reset all search filters"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[#A97918]" />
            <span>Reset</span>
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold shadow-md shadow-[#C89B3C]/15 hover:opacity-95 active:scale-95 transition-all cursor-pointer h-11 border-0 disabled:opacity-75"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 text-[#07111F] animate-spin" />
            ) : (
              <Search className="w-3.5 h-3.5 text-[#07111F]" />
            )}
            <span>{isPending ? "Filtering..." : "Apply Filters"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default memo(PropertiesSearchFilterForm);
