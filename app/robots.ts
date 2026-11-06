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
          "/login?*",
          "/register?*",
        ],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/properties", "/about", "/services", "/price-prediction"],
        disallow: ["/admin/", "/dashboard/", "/customer/", "/api/", "/receipt/"],
      },
      {
        userAgent: "Google-Extended",
        allow: ["/", "/properties", "/about", "/services", "/price-prediction"],
        disallow: ["/admin/", "/dashboard/", "/customer/", "/api/", "/receipt/"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/properties", "/about", "/services", "/price-prediction"],
        disallow: ["/admin/", "/dashboard/", "/customer/", "/api/", "/receipt/"],
      },
      {
        userAgent: "Applebot",
        allow: ["/", "/properties", "/about", "/services", "/price-prediction"],
        disallow: ["/admin/", "/dashboard/", "/customer/", "/api/", "/receipt/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
