// ================================================================
// PAGE NAME  : Customer Portal — Saved Favorites
// ROUTE      : /customer/favorites
// DESCRIPTION: List of properties favorited by the customer
//              Kiro-Maal Real Estate Master Design System
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Heart, Building2, MapPin, BedDouble, Bath, SquareStack, ArrowRight, Sparkles } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Saved Favorites – Customer Portal | Kiro-Maal Real Estate" };

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
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-6 sm:p-8">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FCFBF7] border border-[#C89B3C]/30 text-[#A97918] text-xs font-semibold uppercase tracking-wider mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#C89B3C]" /> Curated Portfolio
        </div>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#07111F] flex items-center gap-2.5">
          <Heart className="h-7 w-7 text-[#C89B3C] fill-[#C89B3C]" /> Saved Favorite Properties
        </h1>
        <p className="text-[#6B7280] text-sm mt-1">
          {favorites.length} exclusive properties shortlisted in your private portfolio
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#07111F] flex items-center justify-center mx-auto text-[#D9B45B] mb-4 shadow-inner">
            <Heart className="h-7 w-7 opacity-80" />
          </div>
          <h2 className="text-lg font-serif font-bold text-[#07111F]">No saved properties yet</h2>
          <p className="text-[#6B7280] text-xs mt-1.5 max-w-sm mx-auto mb-6 leading-relaxed">
            Browse our verified luxury collection across Somalia and bookmark properties to easily revisit them here.
          </p>
          <Link
            href="/customer/properties"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] text-[#07111F] px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm hover:brightness-105"
          >
            <Building2 className="h-4 w-4" /> Browse Verified Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map(({ property }) => (
            <div key={property.id} className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] overflow-hidden shadow-sm hover:border-[#C89B3C]/50 hover:shadow-md transition-all group">
              <div className="relative aspect-[16/10] bg-[#07111F] overflow-hidden">
                {property.images[0] ? (
                  <img
                    src={property.images[0].url}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#D9B45B]/60">
                    <Building2 className="h-10 w-10" />
                  </div>
                )}
                <div className="absolute top-3 right-3 bg-[#07111F]/80 backdrop-blur-sm text-[#D9B45B] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#C89B3C]/40">
                  {getPropertyTypeLabel(property.type)}
                </div>
              </div>

              <div className="p-5">
                <p className="text-xl font-serif font-bold text-[#07111F] mb-1">{formatPrice(property.price)}</p>
                <h3 className="font-serif font-bold text-[#07111F] text-base mb-2 line-clamp-1 group-hover:text-[#A97918] transition-colors">
                  {property.title}
                </h3>
                <p className="text-xs text-[#6B7280] flex items-center gap-1 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-[#C89B3C]" /> {property.address || property.city}
                </p>

                <div className="flex items-center gap-4 text-xs text-[#6B7280] pt-3 border-t border-[#E8E1D4] mb-4">
                  {property.bedrooms > 0 && (
                    <span className="flex items-center gap-1"><BedDouble className="h-3.5 w-3.5 text-[#C89B3C]" /> {property.bedrooms} Beds</span>
                  )}
                  {property.bathrooms > 0 && (
                    <span className="flex items-center gap-1"><Bath className="h-3.5 w-3.5 text-[#C89B3C]" /> {property.bathrooms} Baths</span>
                  )}
                  <span className="flex items-center gap-1"><SquareStack className="h-3.5 w-3.5 text-[#C89B3C]" /> {property.area} m²</span>
                </div>

                <Link
                  href={`/customer/properties/${property.id}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#F7F3EA] hover:bg-gradient-to-r hover:from-[#C89B3C] hover:via-[#D9B45B] hover:to-[#C89B3C] hover:text-[#07111F] border border-[#E8E1D4] hover:border-transparent text-[#07111F] font-bold py-2.5 rounded-xl text-xs transition-all shadow-xs"
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
