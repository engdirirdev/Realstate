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
import { Heart, Building2, BedDouble, MapPin, Trash2 } from "lucide-react";
import { formatPrice, getPropertyTypeLabel } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Saved Properties – Dashboard" };

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
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Heart className="h-6 w-6 text-red-500" /> Saved Properties
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {favorites.length} saved {favorites.length === 1 ? "property" : "properties"}
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-16 text-center">
          <Heart className="h-16 w-16 text-gray-200 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">No saved properties yet</h3>
          <p className="text-gray-500 text-sm mb-6">Browse properties and click the heart icon to save them here.</p>
          <Link href="/properties" className="btn-gradient inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm">
            <Building2 className="h-4 w-4" /> Browse Properties
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {favorites.map((fav) => {
            const p = fav.property;
            const img = p.images[0]?.url;
            return (
              <div key={fav.id} className="property-card relative group">
                <Link href={`/properties/${p.id}`}>
                  <div className="relative h-48 overflow-hidden bg-gray-100">
                    {img ? (
                      <img src={img} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                        <Building2 className="h-16 w-16 text-primary-300" />
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <span className="badge-primary">{getPropertyTypeLabel(p.type)}</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-gray-400 flex items-center gap-1 mb-1">
                      <MapPin className="h-3 w-3" /> {p.city}
                    </p>
                    <h3 className="font-semibold text-gray-900 text-sm mb-2 line-clamp-1 group-hover:text-primary-700 transition-colors">
                      {p.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-700 font-bold">{formatPrice(p.price)}</span>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        {p.bedrooms > 0 && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3 w-3" /> {p.bedrooms}
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
