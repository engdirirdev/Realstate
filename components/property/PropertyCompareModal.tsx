"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scale,
  X,
  Building2,
  Check,
  CheckCircle2,
  ExternalLink,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";

export interface ComparableItem {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking?: number | null;
  type: string;
  location?: string | null;
  city: string;
  status: string;
  amenities?: string | null;
  images?: { url: string }[];
}

interface PropertyCompareModalProps {
  currentProperty: ComparableItem;
  availableComps?: ComparableItem[];
}

export default function PropertyCompareModal({
  currentProperty,
  availableComps = [],
}: PropertyCompareModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([
    currentProperty.id,
    ...(availableComps.slice(0, 1).map((c) => c.id)),
  ]);

  const allProperties = [
    currentProperty,
    ...availableComps.filter((c) => c.id !== currentProperty.id),
  ];

  const comparedProperties = allProperties.filter((p) =>
    selectedIds.includes(p.id)
  );

  const toggleSelect = (id: string) => {
    if (id === currentProperty.id) return; // Keep current property pinned
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds((prev) => [...prev, id]);
      }
    }
  };

  const getAmenitiesList = (p: ComparableItem): string[] => {
    try {
      if (!p.amenities) return [];
      const parsed = JSON.parse(p.amenities);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const allDistinctFeatures = Array.from(
    new Set(comparedProperties.flatMap((p) => getAmenitiesList(p)))
  );

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="rounded-xl text-xs font-bold gap-1.5 border-[#E8E1D4] bg-[#FCFBF7] text-[#07111F] hover:bg-[#F7F3EA] cursor-pointer"
      >
        <Scale className="h-4 w-4 text-[#C89B3C]" /> Compare Side-by-Side
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl bg-[#FCFBF7] rounded-3xl p-6 sm:p-8 border border-[#E8E1D4] shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-[#E8E1D4] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="font-serif font-bold text-xl sm:text-2xl text-[#07111F] flex items-center gap-2">
                  <Scale className="h-6 w-6 text-[#C89B3C]" /> Property Comparison Table
                </DialogTitle>
                <DialogDescription className="text-xs text-[#6B7280] mt-1">
                  Side-by-side architectural and financial comparison of verified comps.
                </DialogDescription>
              </div>

              {/* View full page comparison link */}
              <Link
                href={`/properties/compare?ids=${selectedIds.join(",")}`}
                className="text-xs font-bold text-[#C89B3C] hover:text-[#A97918] inline-flex items-center gap-1 self-start sm:self-auto"
              >
                Open Full Screen View <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </DialogHeader>

          {/* Quick comp selector pills */}
          {allProperties.length > 2 && (
            <div className="flex items-center gap-2 pt-2 overflow-x-auto pb-1 text-xs">
              <span className="font-bold text-[#6B7280] uppercase tracking-wider text-[10px]">
                Compare With:
              </span>
              {allProperties.slice(1).map((comp) => {
                const isSelected = selectedIds.includes(comp.id);
                return (
                  <button
                    key={comp.id}
                    type="button"
                    onClick={() => toggleSelect(comp.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#07111F] text-[#D9B45B] border-[#C89B3C]/40"
                        : "bg-[#F7F3EA] text-[#6B7280] border-[#E8E1D4] hover:text-[#07111F]"
                    }`}
                  >
                    {isSelected ? "✓ " : "+ "}
                    {comp.title.slice(0, 20)}...
                  </button>
                );
              })}
            </div>
          )}

          {/* Comparison Table */}
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#E8E1D4] bg-white shadow-xs">
            <table className="w-full text-xs">
              <thead className="bg-[#07111F] text-white">
                <tr>
                  <th className="p-3.5 text-left text-xs font-bold uppercase tracking-wider text-[#D9B45B] w-40 sticky left-0 bg-[#07111F] z-10 border-r border-white/10">
                    Feature / Field
                  </th>
                  {comparedProperties.map((p) => (
                    <th key={p.id} className="p-3.5 text-left min-w-[210px] align-top bg-[#07111F]">
                      <div className="space-y-1.5">
                        <div className="h-28 rounded-xl overflow-hidden bg-black/40 relative border border-white/10">
                          {p.images && p.images[0] ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                              <Building2 className="h-6 w-6" />
                            </div>
                          )}
                          {p.id === currentProperty.id && (
                            <span className="absolute top-1.5 left-1.5 bg-[#C89B3C] text-[#07111F] text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                              This Property
                            </span>
                          )}
                        </div>
                        <p className="font-serif font-bold text-sm text-[#FCFBF7] truncate">
                          {p.title}
                        </p>
                        <p className="text-sm font-extrabold text-[#D9B45B]">
                          {formatPrice(p.price)}
                        </p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E1D4] text-[#07111F]">
                {/* 1. Price */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Price (USD)
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 font-bold text-[#07111F]">
                      {formatPrice(p.price)}
                    </td>
                  ))}
                </tr>

                {/* 2. Area */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Area (m²)
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">
                      {p.area} m²
                    </td>
                  ))}
                </tr>

                {/* 3. Bedrooms */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Bedrooms
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">
                      {p.bedrooms} Beds
                    </td>
                  ))}
                </tr>

                {/* 4. Bathrooms */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Bathrooms
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">
                      {p.bathrooms} Baths
                    </td>
                  ))}
                </tr>

                {/* 5. Parking */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Parking
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">
                      {p.parking ? `${p.parking} Spaces` : "Included / Street"}
                    </td>
                  ))}
                </tr>

                {/* 6. Property Type */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Property Type
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">
                      {getPropertyTypeLabel(p.type)}
                    </td>
                  ))}
                </tr>

                {/* 7. Location */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Location &amp; City
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3 font-semibold">
                      {p.location ? `${p.location}, ` : ""}
                      {p.city}
                    </td>
                  ))}
                </tr>

                {/* 8. Availability Status */}
                <tr className="hover:bg-[#F7F3EA]/60">
                  <td className="p-3 font-bold text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0">
                    Availability Status
                  </td>
                  {comparedProperties.map((p) => (
                    <td key={p.id} className="p-3">
                      <span className="inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        {p.status === "APPROVED" ? "Available" : p.status}
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 9. Key Features / Amenities */}
                {allDistinctFeatures.slice(0, 6).map((feat) => (
                  <tr key={feat} className="hover:bg-[#F7F3EA]/60">
                    <td className="p-3 font-medium text-[#6B7280] bg-[#F7F3EA]/30 border-r border-[#E8E1D4] sticky left-0 truncate max-w-[160px]">
                      {feat}
                    </td>
                    {comparedProperties.map((p) => {
                      const hasFeat = getAmenitiesList(p).includes(feat);
                      return (
                        <td key={p.id} className="p-3">
                          {hasFeat ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                              <Check className="h-4 w-4" /> Yes
                            </span>
                          ) : (
                            <span className="text-[#9CA3AF]">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
