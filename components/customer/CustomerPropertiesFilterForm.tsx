"use client";

import { useState, useTransition, useEffect , memo } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, RotateCcw, Loader2 } from "lucide-react";

interface CityOption {
  city: string;
  region?: string | null;
}

interface TypeOption {
  value: string;
  label: string;
}

interface CustomerPropertiesFilterFormProps {
  availableCities: CityOption[];
  types: TypeOption[];
  initialFilters: {
    q?: string;
    city?: string;
    type?: string;
    listingType?: string;
    sort?: string;
  };
}

function CustomerPropertiesFilterForm({
  availableCities,
  types,
  initialFilters,
}: CustomerPropertiesFilterFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [q, setQ] = useState(initialFilters.q || "");
  const [city, setCity] = useState(initialFilters.city || "");
  const [type, setType] = useState(initialFilters.type || "");
  const [listingType, setListingType] = useState(initialFilters.listingType || "");
  const [sort, setSort] = useState(initialFilters.sort || "latest");

  useEffect(() => {
    setQ(initialFilters.q || "");
    setCity(initialFilters.city || "");
    setType(initialFilters.type || "");
    setListingType(initialFilters.listingType || "");
    setSort(initialFilters.sort || "latest");
  }, [initialFilters.q, initialFilters.city, initialFilters.type, initialFilters.listingType, initialFilters.sort]);

  const executeSearch = (overrides: Record<string, string> = {}) => {
    const qVal = "q" in overrides ? overrides.q : q;
    const cityVal = "city" in overrides ? overrides.city : city;
    const typeVal = "type" in overrides ? overrides.type : type;
    const listVal = "listingType" in overrides ? overrides.listingType : listingType;
    const sortVal = "sort" in overrides ? overrides.sort : sort;

    const params = new URLSearchParams();
    if (qVal && qVal.trim()) params.set("q", qVal.trim());
    if (cityVal && cityVal !== "All Cities") params.set("city", cityVal);
    if (typeVal) params.set("type", typeVal);
    if (listVal) params.set("listingType", listVal);
    if (sortVal && sortVal !== "latest") params.set("sort", sortVal);

    const qs = params.toString();
    const target = qs ? `/customer/properties?${qs}` : `/customer/properties`;

    startTransition(() => {
      router.push(target, { scroll: false });
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleReset = () => {
    setQ("");
    setCity("");
    setType("");
    setListingType("");
    setSort("latest");
    startTransition(() => {
      router.push("/customer/properties", { scroll: false });
    });
  };

  const hasActiveFilters = Boolean(
    q || (city && city !== "All Cities") || type || listingType || (sort && sort !== "latest")
  );

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 pt-4 border-t border-[#E8E1D4]">
      {/* Keyword Search */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
          Search Keywords
        </label>
        <div className="relative">
          <input
            type="text"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Title, area, street..."
            className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-semibold focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-none transition-all"
          />
        </div>
      </div>

      {/* Listing Type Filter */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
          Listing Type
        </label>
        <select
          name="listingType"
          value={listingType}
          onChange={(e) => {
            const val = e.target.value;
            setListingType(val);
            executeSearch({ listingType: val });
          }}
          className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-semibold focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-none transition-all cursor-pointer"
        >
          <option value="">All (Rent &amp; Sale)</option>
          <option value="FOR_RENT">For Rent</option>
          <option value="FOR_SALE">For Sale</option>
        </select>
      </div>

      {/* City Filter */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
          Location / City
        </label>
        <select
          name="city"
          value={city}
          onChange={(e) => {
            const val = e.target.value;
            setCity(val);
            executeSearch({ city: val });
          }}
          className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-none transition-all cursor-pointer"
        >
          <option value="">All Registered Cities</option>
          {availableCities.map((c) => (
            <option key={c.city} value={c.city}>
              {c.city} {c.region ? `(${c.region})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
          Property Type
        </label>
        <select
          name="type"
          value={type}
          onChange={(e) => {
            const val = e.target.value;
            setType(val);
            executeSearch({ type: val });
          }}
          className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-none transition-all cursor-pointer"
        >
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6B7280] mb-1">
          Sort By
        </label>
        <select
          name="sort"
          value={sort}
          onChange={(e) => {
            const val = e.target.value;
            setSort(val);
            executeSearch({ sort: val });
          }}
          className="w-full px-3 py-2 rounded-xl border border-[#E8E1D4] bg-white text-[#07111F] text-xs font-medium focus:ring-2 focus:ring-[#C89B3C]/20 focus:border-[#C89B3C] outline-none transition-all cursor-pointer"
        >
          <option value="latest">Newest Listings</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="area_desc">Largest Area</option>
        </select>
      </div>

      {/* Submit & Reset Actions */}
      <div className="flex items-end gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] text-xs font-bold hover:brightness-105 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-75 h-9 border-0"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Filter className="w-3.5 h-3.5" />
          )}
          <span>{isPending ? "Filtering..." : "Filter"}</span>
        </button>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="py-2 px-3 rounded-xl border border-[#E8E1D4] bg-[#F7F3EA] text-[#6B7280] hover:text-[#07111F] hover:bg-[#E8E1D4] text-xs font-medium transition-all flex items-center justify-center gap-1 cursor-pointer h-9"
            title="Reset Filters"
          >
            <RotateCcw className="w-3 h-3 text-[#A97918]" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
      </div>
    </form>
  );
}


export default memo(CustomerPropertiesFilterForm);
