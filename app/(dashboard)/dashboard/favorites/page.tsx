// ================================================================
// PAGE NAME  : User Dashboard — Saved Properties (Favorites)
// ROUTE      : /dashboard/favorites
// DESCRIPTION: Grid of properties the user has saved/favorited,
//              with remove button for each
// ROLE       : USER only
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Heart, Building2, BedDouble, MapPin } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Saved Properties – Kiro-Maal Real Estate" };

export default async function FavoritesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        include: { images: { take: 1, orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#07111F] flex items-center gap-2">
            <Heart className="h-6 w-6 text-[#C89B3C] fill-[#C89B3C]" /> Saved Properties
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            {favorites.length} saved {favorites.length === 1 ? "property" : "properties"} in your personal portfolio
          </p>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-[#FCFBF7] rounded-2xl shadow-sm border border-[#E8E1D4] p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#F7F3EA] text-[#C89B3C] flex items-center justify-center mx-auto mb-4 border border-[#E8E1D4]">
            <Heart className="h-8 w-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#07111F] mb-2">No saved properties yet</h3>
          <p className="text-[#6B7280] text-sm mb-6 max-w-md mx-auto">
            Browse our curated Somali residences and commercial investments and save your favorite opportunities.
          </p>
          <Link
            href="/properties"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-[#C89B3C] via-[#D9B45B] to-[#C89B3C] hover:opacity-95 text-[#07111F] shadow-md shadow-[#C89B3C]/20 transition-all"
          >
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            const p = fav.property;
            const img = p.images[0]?.url;
            return (
              <div
                key={fav.id}
                className="bg-[#FCFBF7] rounded-2xl border border-[#E8E1D4] shadow-sm overflow-hidden group hover:border-[#C89B3C]/60 hover:shadow-md transition-all duration-300"
              >
                <Link href={`/properties/${p.id}`}>
                  <div className="relative h-48 overflow-hidden bg-[#07111F]/5">
                    {img ? (
                      <img
                        src={img}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#07111F] to-[#0B1728]">
                        <Building2 className="h-16 w-16 text-[#C89B3C]/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-[#07111F]/90 text-[#D9B45B] border border-[#C89B3C]/30 backdrop-blur-xs">
                        {getPropertyTypeLabel(p.type)}
                      </span>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-[#6B7280] flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-[#C89B3C]" /> {p.city}
                    </p>
                    <h3 className="font-bold text-[#07111F] text-sm line-clamp-1 group-hover:text-[#C89B3C] transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex items-center justify-between pt-2 border-t border-[#E8E1D4]/60">
                      <span className="text-[#C89B3C] font-black text-base font-serif">
                        {formatPrice(p.price)}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-[#6B7280]">
                        {p.bedrooms > 0 && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3 text-[#C89B3C]" /> {p.bedrooms}
                          </span>
                        )}
                        <span>{p.area} m²</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
