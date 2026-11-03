/**
 * Schema.org Structured Data Generator for Kiro-Maal Luxury Real Estate.
 *
 * Implements Google-compliant JSON-LD structured data for:
 * - RealEstateAgent & Organization
 * - WebSite & SearchAction (Sitelinks Searchbox)
 * - RealEstateListing / SingleFamilyResidence / Apartment
 * - BreadcrumbList
 */

export interface PropertySchemaInput {
  id: string;
  title: string;
  description?: string | null;
  price: number;
  type: string;
  city: string;
  address?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqFt?: number | null;
  images: { url: string }[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://kiromaal.com";

/**
 * Organization and RealEstateAgent Schema for Knowledge Graph and Local SEO.
 */
export function generateRealEstateAgentSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    "@id": `${BASE_URL}/#organization`,
    name: "Kiro-Maal Real Estate",
    alternateName: ["Kiro-Maal Luxury Properties", "Kiro-Maal Somalia"],
    url: BASE_URL,
    logo: `${BASE_URL}/images/logo.png`,
    image: `${BASE_URL}/images/og-main.jpg`,
    description:
      "Somalia's premier luxury real estate agency and AI property intelligence platform offering verified villas, modern apartments, and commercial investments.",
    telephone: "+252 61 200 0000",
    email: "concierge@kiromaal.com",
    priceRange: "$$$",
    currenciesAccepted: "USD",
    paymentAccepted: "Cash, Wire Transfer, Mobile Money (EVC Plus, Premier Wallet)",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Maka Al-Mukarama Avenue, Hodan District",
      addressLocality: "Mogadishu",
      addressRegion: "Banadir",
      postalCode: "25201",
      addressCountry: "SO",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "2.046934",
      longitude: "45.318162",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "08:30",
        closes: "18:00",
      },
    ],
    sameAs: [
      "https://twitter.com/kiromaal",
      "https://facebook.com/kiromaal",
      "https://linkedin.com/company/kiromaal",
      "https://instagram.com/kiromaal",
    ],
  };
}

/**
 * WebSite Schema with Sitelinks Searchbox action for SERP integration.
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${BASE_URL}/#website`,
    url: BASE_URL,
    name: "Kiro-Maal Real Estate",
    description: "Somalia's Premier Luxury Real Estate & AI Property Search Platform",
    publisher: {
      "@id": `${BASE_URL}/#organization`,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/properties?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    inLanguage: ["en-US", "so-SO"],
  };
}

/**
 * RealEstateListing & Residence Schema for Property Details Pages.
 */
export function generatePropertySchema(property: PropertySchemaInput) {
  const propertyUrl = `${BASE_URL}/properties/${property.id}`;
  const images = property.images?.length > 0
    ? property.images.map((img) => img.url)
    : [`${BASE_URL}/images/og-main.jpg`];

  // Map internal property type to Schema.org type
  const typeMap: Record<string, string> = {
    VILLA: "SingleFamilyResidence",
    HOUSE: "SingleFamilyResidence",
    APARTMENT: "Apartment",
    COMMERCIAL: "CommercialBuilding",
    LAND: "Landform",
    OFFICE: "OfficeBuilding",
  };

  const schemaType = typeMap[property.type?.toUpperCase()] || "SingleFamilyResidence";

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    "@id": `${propertyUrl}#listing`,
    url: propertyUrl,
    name: property.title,
    description: property.description || `${property.title} located in ${property.city}, Somalia.`,
    datePosted: typeof property.createdAt === "string" ? property.createdAt : property.createdAt.toISOString(),
    dateModified: typeof property.updatedAt === "string" ? property.updatedAt : property.updatedAt.toISOString(),
    image: images,
    mainEntity: {
      "@type": schemaType,
      "@id": `${propertyUrl}#property`,
      name: property.title,
      description: property.description,
      image: images,
      numberOfBedrooms: property.bedrooms || undefined,
      numberOfBathroomsTotal: property.bathrooms || undefined,
      floorSize: property.areaSqFt
        ? {
            "@type": "QuantitativeValue",
            value: property.areaSqFt,
            unitCode: "FTK",
          }
        : undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: property.address || undefined,
        addressLocality: property.city,
        addressRegion: "Somalia",
        addressCountry: "SO",
      },
      offers: {
        "@type": "Offer",
        price: property.price,
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        url: propertyUrl,
        validFrom: typeof property.createdAt === "string" ? property.createdAt : property.createdAt.toISOString(),
      },
    },
  };
}

/**
 * BreadcrumbList Schema for Google Search breadcrumb navigation.
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}
