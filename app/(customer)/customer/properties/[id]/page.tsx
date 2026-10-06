// ================================================================
// PAGE NAME  : Customer Portal — Property Details View
// ROUTE      : /customer/properties/[id]
// DESCRIPTION: In-portal property detail view with specifications,
//              amenities, image gallery, inquiry & booking modals
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  BedDouble,
  Bath,
  SquareStack,
  Building2,
  ArrowLeft,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  Scale,
  ShieldCheck,
  Car,
  Sofa,
} from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import PropertyActions from "@/components/PropertyActions";
import PropertyReviews from "@/components/PropertyReviews";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const property = await prisma.property.findUnique({ where: { id } });
  if (!property) return { title: "Property Not Found – Customer Portal" };
  return {
    title: `${property.title} – Customer Portal | Kiro-Maal Real Estate`,
  };
}

export default async function CustomerPropertyDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      reviews: {
        include: { user: { select: { name: true, image: true } } },
        orderBy: { createdAt: "desc" },
      },
      manager: {
        select: { id: true, name: true, email: true, phone: true, image: true },
      },
    },
  });

  if (!property) notFound();

  let amenitiesList: string[] = [];
  try {
    amenitiesList = property.amenities ? JSON.parse(property.amenities) : [];
  } catch {
    amenitiesList = [];
  }

  const primaryImage =
    property.images[0]?.url ||
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800";

  return (
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
      {/* ─── Top Bar ─── */}
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/customer/properties"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#6B7280] hover:text-[#C89B3C] bg-[#FCFBF7] px-3.5 py-2 rounded-xl border border-[#E8E1D4] transition-colors shadow-2xs"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Properties</span>
        </Link>

        <Link
          href={`/customer/compare?ids=${property.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#07111F] hover:text-[#C89B3C] bg-[#FCFBF7] px-3.5 py-2 rounded-xl border border-[#E8E1D4] hover:border-[#C89B3C] transition-colors shadow-2xs"
        >
          <Scale className="h-4 w-4 text-[#C89B3C]" />
          <span>Compare this Property</span>
        </Link>
      </div>

      {/* ─── Hero Overview Card ─── */}
      <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Images (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-100 border border-[#E8E1D4] shadow-xs">
              <Image
                src={primaryImage}
                alt={property.title}
                fill
                priority
                className="object-cover"
              />
              <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#07111F]/85 text-[#D9B45B] text-xs font-bold uppercase tracking-wider backdrop-blur-xs border border-[#C89B3C]/40 shadow-xs">
                {getPropertyTypeLabel(property.type)}
              </span>
            </div>

            {property.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2.5">
                {property.images.slice(0, 4).map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="relative aspect-video rounded-xl overflow-hidden border border-[#E8E1D4] bg-slate-100"
                  >
                    <Image
                      src={img.url}
                      alt={img.altText || property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details & Actions (5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Listing
                </span>
                <span className="text-xs text-[#6B7280] font-medium">
                  ID: #{property.id.slice(-6).toUpperCase()}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#07111F] leading-snug">
                {property.title}
              </h1>

              <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium mt-2">
                <MapPin className="h-4 w-4 text-[#C89B3C] shrink-0" />
                <span>
                  {property.address ? `${property.address}, ` : ""}
                  {property.city}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-[#E8E1D4]">
                <p className="text-xs text-[#6B7280] font-semibold uppercase tracking-wider">
                  Asking Price
                </p>
                <p className="font-serif text-3xl font-black text-[#C89B3C] mt-1">
                  {formatPrice(Number(property.price))}
                </p>
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-3 gap-2.5 mt-5">
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E1D4] text-center">
                  <BedDouble className="w-4 h-4 text-[#C89B3C] mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#07111F]">
                    {property.bedrooms || 1} Beds
                  </span>
                </div>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E1D4] text-center">
                  <Bath className="w-4 h-4 text-[#C89B3C] mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#07111F]">
                    {property.bathrooms || 1} Baths
                  </span>
                </div>
                <div className="bg-[#FAF7F2] p-3 rounded-xl border border-[#E8E1D4] text-center">
                  <SquareStack className="w-4 h-4 text-[#C89B3C] mx-auto mb-1" />
                  <span className="text-xs font-bold text-[#07111F]">
                    {property.area ? `${property.area} m²` : "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Inquire & Book Buttons Component */}
            <div className="pt-4 border-t border-[#E8E1D4]">
              <PropertyActions
                propertyId={property.id}
                propertyTitle={property.title}
                propertyPrice={Number(property.price)}
                listingType={property.listingType}
                status={property.status}
                availabilityStatus={property.availabilityStatus}
                rentPeriod={property.rentPeriod}
                securityDeposit={property.securityDeposit}
                isNegotiable={property.isNegotiable}
                managerId={property.managerId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Description & Amenities ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Description (8 cols) */}
        <div className="lg:col-span-8 bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="font-serif text-lg font-bold text-[#07111F] mb-3">
              About This Property
            </h2>
            <p className="text-xs sm:text-sm text-[#475569] leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>

          {/* Features Checklist */}
          {amenitiesList.length > 0 && (
            <div className="pt-6 border-t border-[#E8E1D4]">
              <h3 className="font-serif text-base font-bold text-[#07111F] mb-3">
                Key Amenities & Features
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenitiesList.map((amenity, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8E1D4] text-xs font-semibold text-[#07111F]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C89B3C] shrink-0" />
                    <span className="truncate">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Additional Details */}
          <div className="pt-6 border-t border-[#E8E1D4] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#8C7A6B] block">Year Built</span>
              <span className="font-bold text-[#07111F]">{property.yearBuilt || 2023}</span>
            </div>
            <div>
              <span className="text-[#8C7A6B] block">Furnished</span>
              <span className="font-bold text-[#07111F]">
                {property.isFurnished ? "Yes (Furnished)" : "Unfurnished"}
              </span>
            </div>
            <div>
              <span className="text-[#8C7A6B] block">Parking</span>
              <span className="font-bold text-[#07111F]">
                {property.parking ? `${property.parking} Slots` : "Street Parking"}
              </span>
            </div>
            <div>
              <span className="text-[#8C7A6B] block">Status</span>
              <span className={`font-bold ${property.availabilityStatus === "AVAILABLE" ? "text-emerald-600" : "text-amber-600"}`}>
                {property.availabilityStatus?.replace(/_/g, " ") || "Available"}
              </span>
            </div>
          </div>
        </div>

        {/* Manager & Reviews (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assigned Agent Card */}
          {property.manager && (
            <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-xs">
              <h3 className="text-xs font-bold text-[#8C7A6B] uppercase tracking-wider mb-4">
                Assigned Agent
              </h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#C99126] to-[#E8B849] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {property.manager.name?.charAt(0).toUpperCase() || "M"}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#07111F]">
                    {property.manager.name}
                  </h4>
                  <p className="text-xs text-[#6B7280]">Licensed Property Manager</p>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="bg-[#FCFBF7] rounded-3xl border border-[#E8E1D4] p-6 shadow-xs">
            <PropertyReviews
              propertyId={property.id}
              initialReviews={property.reviews as any}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
