"use client";

import {
  Building2,
  Home,
  MapPin,
  SquareStack,
  BedDouble,
  Bath,
  Car,
  Sofa,
  Layers,
  Compass,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Maximize2,
  Sparkles,
  Zap,
  Droplets,
  Anchor,
  Truck,
  Store,
  Briefcase,
  Trees,
  Warehouse,
} from "lucide-react";
import { getTypeSpecificSpecsList } from "@/lib/property-type-specs";
import { getPropertyTypeLabel } from "@/lib/utils";

interface PropertyDynamicSpecsProps {
  type: string;
  typeDetails?: string | Record<string, any> | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  area: number;
  parking?: number | null;
  isFurnished?: boolean | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  className?: string;
}

export default function PropertyDynamicSpecs({
  type,
  typeDetails,
  bedrooms,
  bathrooms,
  area,
  parking,
  isFurnished,
  lotSize,
  yearBuilt,
  className = "",
}: PropertyDynamicSpecsProps) {
  let parsedDetails: Record<string, any> = {};
  if (typeof typeDetails === "string") {
    try {
      parsedDetails = JSON.parse(typeDetails);
    } catch {
      parsedDetails = {};
    }
  } else if (typeDetails && typeof typeDetails === "object") {
    parsedDetails = typeDetails;
  }

  const specs = getTypeSpecificSpecsList(type, parsedDetails, {
    bedrooms: bedrooms ?? undefined,
    bathrooms: bathrooms ?? undefined,
    area,
    parking: parking ?? undefined,
    isFurnished: isFurnished ?? undefined,
    lotSize: lotSize ?? undefined,
    yearBuilt: yearBuilt ?? undefined,
  });

  const getIconForLabel = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes("bed")) return BedDouble;
    if (l.includes("bath") || l.includes("restroom")) return Bath;
    if (l.includes("area") || l.includes("size")) return SquareStack;
    if (l.includes("parking") || l.includes("garage")) return Car;
    if (l.includes("furnish") || l.includes("majlis") || l.includes("salon")) return Sofa;
    if (l.includes("floor") || l.includes("level")) return Layers;
    if (l.includes("road") || l.includes("truck")) return Truck;
    if (l.includes("title") || l.includes("ownership") || l.includes("deed")) return FileText;
    if (l.includes("water")) return Droplets;
    if (l.includes("electric") || l.includes("power")) return Zap;
    if (l.includes("pool") || l.includes("garden")) return Trees;
    if (l.includes("shop") || l.includes("retail")) return Store;
    if (l.includes("office") || l.includes("commercial")) return Briefcase;
    if (l.includes("warehouse") || l.includes("storage")) return Warehouse;
    if (l.includes("boundary") || l.includes("fence") || l.includes("zoning")) return ShieldCheck;
    return Compass;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="font-serif font-bold text-base text-[#07111F] flex items-center gap-2">
          <Building2 className="h-4 w-4 text-[#C89B3C]" />
          <span>{getPropertyTypeLabel(type)} Specifications</span>
        </h3>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F7F3EA] text-[#A97918] border border-[#E8E1D4]">
          Type-Specific Data
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {specs.map((item) => {
          const Icon = getIconForLabel(item.label);
          return (
            <div
              key={item.label}
              className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                item.isHighlight
                  ? "bg-[#FCFBF7] border-[#C89B3C]/40 shadow-xs ring-1 ring-[#C89B3C]/10"
                  : "bg-[#FCFBF7] border-[#E8E1D4]"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  item.isHighlight
                    ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/30"
                    : "bg-[#F7F3EA] text-[#C89B3C] border-[#E8E1D4]"
                }`}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] text-[#6B7280] font-medium truncate">{item.label}</p>
                <p className="font-bold text-[#07111F] text-xs sm:text-sm mt-0.5 line-clamp-1" title={item.value}>
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
