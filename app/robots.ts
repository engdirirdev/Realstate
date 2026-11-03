import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kiromaal.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/customer/",
          "/api/",
          "/receipt/",
          "/_next/",
          "/scratch/",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/properties", "/about", "/services"],
        disallow: ["/admin/", "/dashboard/", "/customer/", "/api/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/properties", "/about", "/services"],
        disallow: ["/admin/", "/dashboard/", "/customer/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
