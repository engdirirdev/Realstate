import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cachedDbQuery } from "@/lib/cache";
import { cachedJsonResponse, CACHE_PROFILES } from "@/lib/api-cache";

export async function GET(request: NextRequest) {
  try {
    const data = await cachedDbQuery(
      ["categories", "all"],
      async () => {
        const categories = await prisma.category.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
          },
        });
        return { success: true, categories };
      },
      {
        tags: ["categories"],
        revalidate: 86400, // 24 hours
      }
    );

    return cachedJsonResponse(request, data, {
      profile: CACHE_PROFILES.PUBLIC_LONG,
    });
  } catch (error) {
    console.error("[GET /api/categories]", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
