import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // Revalidate sitemap every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kiromaal.com";

  // 1. Core Static Application Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/properties`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/price-prediction`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/ai-assistant`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Curated Market Hubs
    {
      url: `${baseUrl}/properties?city=Mogadishu`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/properties?city=Hargeisa`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/properties?city=Kismayo`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties?city=Bosaso`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties?city=Garowe`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/properties?listingType=FOR_SALE`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/properties?listingType=FOR_RENT`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
  ];

  // 2. Dynamic Property Listings
  try {
    const properties = await prisma.property.findMany({
      where: {
        status: "APPROVED",
      },
      select: {
        id: true,
        updatedAt: true,
      },
      take: 2000,
      orderBy: {
        updatedAt: "desc",
      },
    });

    const propertyRoutes: MetadataRoute.Sitemap = properties.map((p) => ({
      url: `${baseUrl}/properties/${p.id}`,
      lastModified: p.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));

    return [...staticRoutes, ...propertyRoutes];
  } catch (error) {
    console.error("[Sitemap Generation Error]", error);
    return staticRoutes;
  }
}
