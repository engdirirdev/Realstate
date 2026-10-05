// ================================================================
// PAGE NAME  : Admin Dashboard — Property Review (Dynamic)
// ROUTE      : /admin/properties/[id]/review
// DESCRIPTION: Dynamic review page for admin to inspect property-type-
//              specific fields, verify documents, and approve/reject
// ROLE       : ADMIN only
// ================================================================
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Star,
  Loader2,
  ArrowLeft,
  ShieldCheck,
  Tag,
  EyeOff,
  Building2,
  MapPin,
  Compass,
  ExternalLink,
  User,
  Calendar,
  Sparkles,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import PropertyDynamicSpecs from "@/components/property/PropertyDynamicSpecs";
import PropertyAvailabilityBadge from "@/components/property/PropertyAvailabilityBadge";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default function PropertyReviewPage({ params }: ReviewPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [property, setProperty] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);

  // Reject Dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    async function loadProperty() {
      try {
        const res = await fetch(`/api/admin/properties/${id}`);
        const data = await res.json();
        if (data.success && data.property) {
          setProperty(data.property);
        } else {
          toast({ title: "Error", description: data.error || "Property not found.", variant: "destructive" });
        }
      } catch {
        toast({ title: "Error", description: "Failed to load property details.", variant: "destructive" });
      } finally {
        setFetching(false);
      }
    }
    loadProperty();
  }, [id]);

  const updateStatus = async (status: string, reason?: string) => {
    setLoading(status);
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast({
          title: `Status Updated to ${status}`,
          description: `Listing is now marked as ${status}.`,
        });
        if (rejectOpen) setRejectOpen(false);
        router.push("/admin/properties");
        router.refresh();
      } else {
        toast({ title: "Action Failed", description: data.error || "Could not update status.", variant: "destructive" });
      }
    } finally {
      setLoading(null);
    }
  };

  const toggleFeatured = async (featured: boolean) => {
    setLoading("featured");
    try {
      const res = await fetch(`/api/admin/properties/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: featured }),
      });
      if (res.ok) {
        setProperty((prev: any) => ({ ...prev, isFeatured: featured }));
        toast({ title: featured ? "Featured Spotlight Added ⭐" : "Featured Spotlight Removed" });
      }
    } finally {
      setLoading(null);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#C89B3C] mx-auto" />
          <p className="text-xs font-bold text-[#07111F]">Loading dynamic property review...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="p-6 text-center space-y-4">
        <p className="text-sm font-bold text-red-600">Property could not be located.</p>
        <Link href="/admin/properties">
          <Button variant="outline" className="rounded-xl text-xs">Back to Properties</Button>
        </Link>
      </div>
    );
  }

  const primaryImage = property.images?.[0]?.url;

  return (
    <div className="space-y-6 max-w-4xl min-h-screen p-2 sm:p-6 bg-[#F7F3EA] pb-16">
      {/* Top Header & Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-bold text-[#C89B3C] hover:text-[#A97918] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Properties
        </button>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/properties/${property.id}/edit`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07111F] hover:text-[#C89B3C] transition-colors bg-[#FCFBF7] border border-[#C89B3C]/50 px-3 py-1.5 rounded-xl shadow-2xs"
          >
            <Pencil className="h-3.5 w-3.5 text-[#C89B3C]" /> Edit Listing
          </Link>
          <Link
            href={`/properties/${property.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07111F] hover:text-[#C89B3C] transition-colors bg-[#FCFBF7] border border-[#E8E1D4] px-3 py-1.5 rounded-xl shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#C89B3C]" /> View Public Page
          </Link>
        </div>
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#07111F] text-[#D9B45B] text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#C89B3C]/30">
          <ShieldCheck className="h-3.5 w-3.5 text-[#D9B45B]" /> Admin Property Verification
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-black text-[#07111F]">
          Review {getPropertyTypeLabel(property.type)} Listing
        </h1>
        <p className="text-xs text-[#6B7280] mt-1">
          Perform administrative review and inspect dynamic specifications for ID:{" "}
          <span className="font-mono text-[#07111F] font-semibold">{property.id}</span>
        </p>
      </div>

      {/* Property Overview Card */}
      <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] overflow-hidden">
        <div className="grid sm:grid-cols-3 gap-6 p-6">
          {/* Cover Image */}
          <div className="sm:col-span-1 aspect-4/3 rounded-2xl overflow-hidden bg-[#F7F3EA] border border-[#E8E1D4] relative">
            {primaryImage ? (
              <img src={primaryImage} alt={property.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#6B7280]">
                <Building2 className="h-10 w-10 text-[#6B7280]/40" />
              </div>
            )}
            <span className="absolute top-2 left-2 bg-[#07111F]/80 backdrop-blur-xs text-[#D9B45B] text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
              {getPropertyTypeLabel(property.type)}
            </span>
          </div>

          {/* Details Column */}
          <div className="sm:col-span-2 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <PropertyAvailabilityBadge status={property.status} />
                <span className="px-2 py-0.5 rounded-full bg-[#F7F3EA] text-[#A97918] border border-[#E8E1D4] text-[10px] font-bold">
                  {property.listingType === "FOR_RENT" ? "For Rent" : "For Sale"}
                </span>
                {property.isFeatured && (
                  <span className="px-2 py-0.5 rounded-full bg-[#C89B3C]/20 text-[#07111F] border border-[#C89B3C]/40 text-[10px] font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-[#C89B3C] text-[#C89B3C]" /> Featured
                  </span>
                )}
              </div>

              <h2 className="font-serif text-xl sm:text-2xl font-black text-[#07111F]">
                {property.title}
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1">
                <MapPin className="h-3.5 w-3.5 text-[#C89B3C] shrink-0" />
                {property.address ? `${property.address}, ` : ""}{property.location || "District"}, {property.city}
              </p>
              {(property.latitude || property.longitude) && (
                <p className="flex items-center gap-1.5 text-[11px] text-[#6B7280] mt-0.5 font-mono">
                  <Compass className="h-3 w-3 text-[#C89B3C] shrink-0" />
                  GPS: {property.latitude || "—"}, {property.longitude || "—"}
                </p>
              )}

              <div className="mt-3">
                <span className="text-2xl font-black text-[#07111F]">
                  <span className="text-[#C89B3C]">$</span>
                  {property.price?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submitter / Manager Metadata */}
            <div className="pt-3 border-t border-[#E8E1D4] grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-[#C89B3C]" />
                <span className="truncate text-[#6B7280]">
                  Manager: <strong className="text-[#07111F]">{property.manager?.name || "Direct / Admin"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-[#C89B3C]" />
                <span className="text-[#6B7280]">
                  Submitted: {new Date(property.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dynamic Type-Specific Specifications ── */}
      <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 sm:p-7 space-y-4">
        <PropertyDynamicSpecs
          type={property.type}
          typeDetails={property.typeDetails}
          bedrooms={property.bedrooms}
          bathrooms={property.bathrooms}
          area={property.area}
          parking={property.parking}
          isFurnished={property.isFurnished}
          lotSize={property.lotSize}
          yearBuilt={property.yearBuilt}
        />
      </div>

      {/* Description */}
      <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 space-y-2">
        <h3 className="font-serif font-bold text-sm text-[#07111F]">Listing Description</h3>
        <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed whitespace-pre-line">
          {property.description}
        </p>
      </div>

      {/* Amenities & Features */}
      {property.amenities && (
        <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 space-y-3">
          <h3 className="font-serif font-bold text-sm text-[#07111F]">Verified Amenities &amp; Features</h3>
          <div className="flex flex-wrap gap-2">
            {(() => {
              try {
                const items: string[] = JSON.parse(property.amenities);
                return items.map((f) => (
                  <span
                    key={f}
                    className="px-3 py-1 rounded-xl bg-[#F7F3EA] border border-[#E8E1D4] text-xs font-bold text-[#07111F]"
                  >
                    ✓ {f}
                  </span>
                ));
              } catch {
                return <p className="text-xs text-[#6B7280]">{property.amenities}</p>;
              }
            })()}
          </div>
        </div>
      )}

      {/* ── Administrative Status Actions ── */}
      <div className="bg-[#FCFBF7] rounded-3xl shadow-sm border border-[#E8E1D4] p-6 sm:p-7 space-y-6">
        <div>
          <h2 className="font-serif text-base font-bold text-[#07111F] mb-1">
            Update Administrative Publication Status
          </h2>
          <p className="text-xs text-[#6B7280]">
            Approving this listing publishes it live to the public portal and triggers notification to the listing manager.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <Button
            onClick={() => updateStatus("APPROVED")}
            disabled={loading !== null}
            className="gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] font-bold rounded-xl shadow-sm h-11 border-0 cursor-pointer"
            size="lg"
          >
            {loading === "APPROVED" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Approve &amp; Publish Listing
          </Button>

          <Button
            onClick={() => setRejectOpen(true)}
            disabled={loading !== null}
            variant="destructive"
            size="lg"
            className="gap-2 bg-[#991B1B] text-white hover:bg-[#7F1D1D] rounded-xl h-11 border-0 font-bold cursor-pointer"
          >
            {loading === "REJECTED" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Reject Listing
          </Button>

          <Button
            onClick={() => updateStatus("SOLD")}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="gap-2 bg-[#07111F] text-[#D9B45B] border border-[#C89B3C]/30 hover:bg-[#0B1728] rounded-xl h-11 font-bold cursor-pointer"
          >
            {loading === "SOLD" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Tag className="h-4 w-4 text-[#C89B3C]" />
            )}
            Mark as Sold
          </Button>

          <Button
            onClick={() => updateStatus("UNAVAILABLE")}
            disabled={loading !== null}
            variant="outline"
            size="lg"
            className="gap-2 bg-[#FCFBF7] text-[#6B7280] border border-[#E8E1D4] hover:bg-[#F7F3EA] rounded-xl h-11 font-medium cursor-pointer"
          >
            {loading === "UNAVAILABLE" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
            Mark Unavailable
          </Button>
        </div>

        {/* Featured Toggle */}
        <div className="border-t border-[#E8E1D4] pt-5 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-sm font-bold text-[#07111F] mb-0.5">Homepage Spotlight</h3>
            <p className="text-xs text-[#6B7280]">
              Toggle spotlight placement on Kiro-Maal featured properties.
            </p>
          </div>
          <Button
            onClick={() => toggleFeatured(!property.isFeatured)}
            disabled={loading !== null}
            variant="outline"
            className={`gap-2 rounded-xl text-xs font-bold ${
              property.isFeatured
                ? "bg-[#C89B3C]/20 border-[#C89B3C] text-[#07111F]"
                : "border-[#E8E1D4] text-[#6B7280] bg-[#FCFBF7]"
            }`}
          >
            <Star className={`h-4 w-4 ${property.isFeatured ? "text-[#C89B3C] fill-[#C89B3C]" : ""}`} />
            {property.isFeatured ? "Featured Active ★" : "Set as Featured"}
          </Button>
        </div>
      </div>

      {/* Reject Modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-md bg-[#FCFBF7] border border-[#E8E1D4] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-serif font-bold text-xl text-[#07111F]">
              Reject Property Listing
            </DialogTitle>
            <DialogDescription className="text-xs text-[#6B7280]">
              Please state the reason for rejecting this listing so the manager can correct and resubmit.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label className="text-xs font-bold text-[#07111F]">Rejection Reason</Label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Incomplete title deed documentation, image resolution too low, or incorrect zoning indicated..."
              className="min-h-[100px] border-[#E8E1D4] bg-[#FCFBF7] rounded-xl text-xs"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              className="rounded-xl text-xs border-[#E8E1D4]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => updateStatus("REJECTED", rejectionReason)}
              className="rounded-xl text-xs font-bold bg-[#991B1B]"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
