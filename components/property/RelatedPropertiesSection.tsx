"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Building2,
  BedDouble,
  Bath,
  SquareStack,
  MapPin,
  Compass,
  ArrowRight,
} from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import PropertyAvailabilityBadge from "./PropertyAvailabilityBadge";

export interface RelatedPropertyItem {
  id: string;
  title: string;
  price: number;
  type: string;
  city: string;
  address?: string | null;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: string;
  images?: { url: string; altText?: string | null }[];
  matchScore?: number;
}

interface RelatedPropertiesSectionProps {
  currentCity: string;
  currentType: string;
  similarProperties: RelatedPropertyItem[];
  nearbyProperties: RelatedPropertyItem[];
  aiRecommendedProperties: RelatedPropertyItem[];
}

export default function RelatedPropertiesSection({
  currentCity,
  currentType,
  similarProperties = [],
  nearbyProperties = [],
  aiRecommendedProperties = [],
}: RelatedPropertiesSectionProps) {
  const [activeTab, setActiveTab] = useState<"AI" | "SIMILAR" | "NEARBY">("AI");

  // Determine active list
  let activeList: RelatedPropertyItem[] = [];
  if (activeTab === "AI") {
    activeList = aiRecommendedProperties.length > 0 ? aiRecommendedProperties : similarProperties;
  } else if (activeTab === "SIMILAR") {
    activeList = similarProperties.length > 0 ? similarProperties : nearbyProperties;
  } else {
    activeList = nearbyProperties.length > 0 ? nearbyProperties : similarProperties;
  }

  // Limit to 6-8 properties
  const displayList = activeList.slice(0, 8);

  const tabs = [
    {
      id: "AI" as const,
      label: "AI Recommended",
      count: aiRecommendedProperties.length || displayList.length,
      icon: Sparkles,
      desc: "Ranked by AI matching engine (city, budget, bedrooms, size)",
    },
    {
      id: "SIMILAR" as const,
      label: `Similar ${getPropertyTypeLabel(currentType)}s`,
      count: similarProperties.length,
      icon: Building2,
      desc: `Properties with comparable specs and architectural style`,
    },
    {
      id: "NEARBY" as const,
      label: `Nearby in ${currentCity}`,
      count: nearbyProperties.length,
      icon: MapPin,
      desc: `High-demand listings in the same district and municipality`,
    },
  ];

  return (
    <section className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header & Category Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E1D4] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#A97918] uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4 text-[#C89B3C]" />
            Enterprise Comp Engine
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#07111F]">
            Related &amp; Recommended Properties
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            Carefully curated comps based on real market data, spatial proximity, and algorithmic similarity.
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#F7F3EA] rounded-2xl border border-[#E8E1D4]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#07111F] text-[#FCFBF7] shadow-xs"
                    : "text-[#6B7280] hover:text-[#07111F] hover:bg-[#E8E1D4]/40"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#D9B45B]" : "text-[#A97918]"}`} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? "bg-[#C89B3C]/30 text-[#D9B45B]" : "bg-[#E8E1D4] text-[#6B7280]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of 6 to 8 Properties */}
      {displayList.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {displayList.map((item) => {
            const mainImg = item.images?.[0]?.url;
            return (
              <Link
                key={item.id}
                href={`/properties/${item.id}`}
                className="group flex flex-col bg-[#FCFBF7] border border-[#E8E1D4] hover:border-[#C89B3C]/50 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300"
              >
                {/* Image & Badges */}
                <div className="relative aspect-4/3 w-full bg-[#F7F3EA] overflow-hidden">
                  {mainImg ? (
                    <img
                      src={mainImg}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
                      <Building2 className="h-10 w-10 text-[#6B7280]/40" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1 pointer-events-none">
                    <span className="bg-[#07111F]/80 backdrop-blur-xs text-[#D9B45B] border border-[#C89B3C]/30 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      {getPropertyTypeLabel(item.type)}
                    </span>
                    <PropertyAvailabilityBadge status={item.status} className="scale-90 origin-right shadow-sm" />
                  </div>

                  {/* AI Match Score Badge if applicable */}
                  {item.matchScore && (
                    <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-[#07111F]/90 backdrop-blur-xs border border-[#C89B3C]/40 text-[#D9B45B] text-[10px] font-bold px-2 py-0.5 rounded-lg shadow-xs">
                      <Sparkles className="h-3 w-3 text-[#D9B45B]" />
                      <span>{item.matchScore}% Match</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1">
                      <p className="text-base font-extrabold text-[#07111F]">
                        <span className="text-[#C89B3C]">$</span>
                        {item.price?.toLocaleString()}
                      </p>
                      <span className="text-[10px] text-[#6B7280] font-medium">
                        {item.area ? `$${Math.round(item.price / item.area).toLocaleString()}/m²` : ""}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-xs sm:text-sm text-[#07111F] line-clamp-1 group-hover:text-[#C89B3C] transition-colors">
                      {item.title}
                    </h3>

                    <p className="flex items-center gap-1 text-[11px] text-[#6B7280] mt-1">
                      <MapPin className="h-3 w-3 text-[#C89B3C] flex-shrink-0" />
                      <span className="truncate">{item.city}</span>
                    </p>
                  </div>

                  {/* Specs */}
                  <div className="pt-2 border-t border-[#E8E1D4] grid grid-cols-3 gap-1 text-[10px] text-[#6B7280]">
                    <div className="flex items-center gap-1 truncate" title={`${item.bedrooms} Bedrooms`}>
                      <BedDouble className="h-3 w-3 text-[#C89B3C]" />
                      <span>{item.bedrooms} Bed</span>
                    </div>
                    <div className="flex items-center gap-1 truncate" title={`${item.bathrooms} Bathrooms`}>
                      <Bath className="h-3 w-3 text-[#C89B3C]" />
                      <span>{item.bathrooms} Bath</span>
                    </div>
                    <div className="flex items-center gap-1 truncate" title={`${item.area} m²`}>
                      <SquareStack className="h-3 w-3 text-[#C89B3C]" />
                      <span>{item.area} m²</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 bg-[#F7F3EA] rounded-2xl border border-[#E8E1D4]">
          <Compass className="h-8 w-8 text-[#A97918] mx-auto mb-2 opacity-50" />
          <p className="text-xs font-bold text-[#07111F]">No comparative properties available right now</p>
          <p className="text-[11px] text-[#6B7280] mt-0.5">Explore our complete catalog of verified properties</p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-[#07111F] text-[#FCFBF7] text-xs font-bold rounded-xl hover:bg-[#07111F]/90 transition-colors"
          >
            Browse All Properties <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Footer Explore Link */}
      <div className="pt-2 flex items-center justify-between text-xs">
        <span className="text-[#6B7280]">
          Showing {displayList.length} of {activeList.length} matching properties
        </span>
        <Link
          href={`/properties?location=${encodeURIComponent(currentCity)}`}
          className="inline-flex items-center gap-1 font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors"
        >
          View all properties in {currentCity} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
