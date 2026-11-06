import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const [
      user,
      favoritesCount,
      searchHistoryCount,
      recommendationsCount,
      predictionsCount,
      recentFavorites,
      recentSearches,
      recommendations,
      recentPredictions,
      notifications,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true, name: true, email: true, phone: true, image: true,
          role: true, isActive: true, createdAt: true,
          preferences: true,
        },
      }),
      prisma.favorite.count({ where: { userId } }),
      prisma.searchHistory.count({ where: { userId } }),
      prisma.recommendation.count({ where: { userId } }),
      prisma.pricePrediction.count({ where: { userId } }),
      prisma.favorite.findMany({
        where: { userId },
        take: 4,
        orderBy: { createdAt: "desc" },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              city: true,
              location: true,
              type: true,
              listingType: true,
              bedrooms: true,
              bathrooms: true,
              area: true,
              images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      }),
      prisma.searchHistory.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
      prisma.recommendation.findMany({
        where: { userId },
        take: 4,
        orderBy: { score: "desc" },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              city: true,
              location: true,
              type: true,
              listingType: true,
              bedrooms: true,
              bathrooms: true,
              area: true,
              images: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
            },
          },
        },
      }),
      prisma.pricePrediction.findMany({
        where: { userId },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          user,
          stats: {
            favorites: favoritesCount,
            searches: searchHistoryCount,
            recommendations: recommendationsCount,
            predictions: predictionsCount,
          },
          recentFavorites: recentFavorites.map((f) => f.property),
          recentSearches,
          recommendations: recommendations.map((r) => {
            let reasons: string[] = [];
            try {
              reasons = typeof r.reasons === "string" ? JSON.parse(r.reasons) : r.reasons;
            } catch {
              reasons = [];
            }
            return {
              property: r.property,
              score: r.score,
              reasons,
            };
          }),
          recentPredictions,
          notifications,
        },
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("[GET /api/user/dashboard]", error);
    return NextResponse.json({ success: false, error: "Failed to load dashboard." }, { status: 500 });
  }
}
