// ================================================================
// PAGE NAME  : Customer Portal — Saved Favorites
// ROUTE      : /customer/favorites
// DESCRIPTION: List of properties favorited by the customer
//              Kiro-Maal Real Estate Master Design System
// ROLE       : CUSTOMER
// ================================================================
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Heart, Building2, Sparkles } from "lucide-react";
import PropertyCard from "@/components/PropertyCard";
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
    <div className="space-y-6 bg-[#F7F3EA] min-h-screen p-5 sm:p-7">
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
          {favorites.map(({ property }) => {
            const isAvailable =
              property.status === "APPROVED" ||
              property.status === "PUBLISHED" ||
              property.availabilityStatus === "AVAILABLE";

            return (
              <div key={property.id} className="relative flex flex-col">
                <PropertyCard
                  property={{
                    ...property,
                    price: Number(property.price),
                    area: property.area ?? undefined,
                    bedrooms: property.bedrooms ?? undefined,
                    bathrooms: property.bathrooms ?? undefined,
                    parking: property.parking ?? undefined,
                    status: !isAvailable ? (property.status === "SOLD" ? "SOLD" : "RENTED") : property.status,
                    images: property.images.map((img) => ({
                      url: img.url,
                      altText: img.altText ?? undefined,
                    })),
                  }}
                  isFavorited={true}
                  href={`/customer/properties/${property.id}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
