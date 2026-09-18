// ================================================================
// PAGE NAME  : Customer Portal — Saved Favorites
// ROUTE      : /customer/favorites
// DESCRIPTION: List of properties favorited by the customer
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Heart, Building2, MapPin, BedDouble, Bath, SquareStack, ArrowRight } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Saved Favorites – Customer Portal" };

export default async function CustomerFavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        include: { images: { orderBy: { order: "asc" }, take: 1 } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6 bg-[#F8FAFC]">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2 tracking-tight">
          <Heart className="h-6 w-6 text-[#DC2626]" /> Saved Favorites
        </h1>
        <p className="text-[#64748B] text-sm mt-1">
          {favorites.length} properties saved in your customer account
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-[#E2E8F0] p-12 text-center">
          <Heart className="h-12 w-12 text-[#94A3B8] mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F172A]">No saved properties yet</h2>
          <p className="text-[#64748B] text-sm mt-1 max-w-sm mx-auto mb-6">
            Browse our properties and click the heart icon to save listings here.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 bg-[#10B981] hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(({ property }) => (
            <div key={property.id} className="property-card group">
              <div className="relative aspect-[16/10] bg-[#E2E8F0] overflow-hidden">
                {property.images[0] ? (
                  <img
                    src={property.images[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#94A3B8]">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#DCFCE7] text-[#166534] text-xs font-semibold px-2.5 py-1 rounded-full">
                  {getPropertyTypeLabel(property.type)}
                </div>
              </div>

              <div className="p-5">
                <p className="text-xl font-bold text-[#059669] mb-1">{formatPrice(property.price)}</p>
                <h3 className="font-bold text-[#0F172A] text-base mb-2 line-clamp-1 group-hover:text-[#10B981] transition-colors">
                  {property.title}
                </h3>
                <p className="text-xs text-[#64748B] flex items-center gap-1 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-[#94A3B8]" /> {property.address || property.city}
                </p>

                <div className="flex items-center gap-4 text-xs text-[#64748B] pt-3 border-t border-[#E2E8F0] mb-4">
                  {property.bedrooms > 0 && (
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-[#94A3B8]" /> {property.bedrooms} Beds</span>
                  )}
                  {property.bathrooms > 0 && (
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-[#94A3B8]" /> {property.bathrooms} Baths</span>
                  )}
                  <span className="flex items-center gap-1"><SquareStack className="h-3.5 w-3.5 text-[#94A3B8]" /> {property.area} m²</span>
                </div>

                <Link
                  href={`/properties/${property.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#F8FAFC] hover:bg-[#10B981] hover:text-white border border-[#E2E8F0] hover:border-transparent text-[#0F172A] font-semibold py-2.5 rounded-xl text-xs transition-all"
                >
                  View Details <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
