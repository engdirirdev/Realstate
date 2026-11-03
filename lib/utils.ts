import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind and conditional class strings cleanly.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats price in USD with commas and without decimals.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

/**
 * Standard human-readable labels for property categories.
 */
export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HOUSE: "House",
    APARTMENT: "Apartment",
    VILLA: "Villa",
    OFFICE: "Office",
    LAND: "Land",
    COMMERCIAL: "Commercial Property",
    TOWNHOUSE: "Townhouse",
    STUDIO: "Studio",
    SHOP: "Shop",
    WAREHOUSE: "Warehouse",
    OTHER: "Other",
  };
  return labels[type] || type;
}
