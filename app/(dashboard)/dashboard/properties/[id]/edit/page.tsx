// ================================================================
// PAGE NAME  : Manager Dashboard — Edit Property Listing
// ROUTE      : /dashboard/properties/[id]/edit
// DESCRIPTION: Manager property editor adapted to property type
//              specs, spatial parameters, and verified media assets
// ROLE       : USER / Manager / Admin
// ================================================================
"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles, Building2, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import DynamicPropertyForm from "@/components/property/DynamicPropertyForm";

interface ManagerEditPropertyPageProps {
  params: Promise<{ id: string }>;
}

export default function ManagerEditPropertyPage({ params }: ManagerEditPropertyPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperty() {
      try {
        const res = await fetch(`/api/properties/${id}`);
        const data = await res.json();
        if (data.success && (data.data || data.property)) {
          setProperty(data.data || data.property);
        } else {
          setError(data.error || "Property listing not found.");
        }
      } catch (err) {
        setError("Failed to load property details. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] p-8 space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#C89B3C]" />
        <p className="text-sm font-medium text-[#07111F]">Retrieving listing details...</p>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-[#FCFBF7] rounded-3xl p-8 border border-[#E8E1D4] shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-serif font-bold text-[#07111F]">Property Not Found</h2>
        <p className="text-xs text-[#6B7280]">{error || "Could not retrieve listing details."}</p>
        <Link href="/dashboard/properties">
          <Button variant="outline" className="rounded-xl border-[#E8E1D4] text-xs font-bold text-[#07111F] mt-2">
            Back to My Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl bg-[#F7F3EA] min-h-screen pb-16">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-2xl bg-[#FCFBF7] border border-[#E8E1D4] flex items-center justify-center hover:bg-[#F7F3EA] text-[#07111F] transition-colors cursor-pointer shadow-2xs"
            title="Go Back"
          >
            <ArrowLeft className="h-4 w-4 text-[#07111F]" />
          </button>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C89B3C]/15 border border-[#C89B3C]/30 text-[#A97918] text-[11px] font-bold uppercase tracking-wider mb-1">
              <Sparkles className="h-3 w-3 text-[#C89B3C]" />
              <span>Property Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-serif text-[#07111F] tracking-tight">
              Edit Property Listing
            </h1>
            <p className="text-[#6B7280] text-xs sm:text-sm mt-0.5">
              Editing <span className="font-semibold text-[#07111F]">&ldquo;{property.title}&rdquo;</span> ({property.city})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/properties/${property.id}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07111F] hover:text-[#C89B3C] transition-colors bg-[#FCFBF7] border border-[#E8E1D4] px-3.5 py-2 rounded-xl shadow-2xs"
          >
            <ExternalLink className="h-3.5 w-3.5 text-[#C89B3C]" /> View Public Listing
          </Link>
        </div>
      </div>

      {/* Dynamic Multi-Step Property Form initialized with property data */}
      <DynamicPropertyForm
        initialData={property}
        onSuccessRedirect="/dashboard/properties"
      />
    </div>
  );
}
