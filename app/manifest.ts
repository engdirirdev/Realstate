import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kiro-Maal Luxury Real Estate Somalia",
    short_name: "Kiro-Maal",
    description: "Somalia's premier luxury real estate platform and AI property valuation engine.",
    start_url: "/",
    display: "standalone",
    background_color: "#07111F",
    theme_color: "#07111F",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}

