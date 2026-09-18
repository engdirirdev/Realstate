import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatArea(area: number): string {
  return `${area.toLocaleString()} m²`;
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    HOUSE: "House",
    APARTMENT: "Apartment",
    VILLA: "Villa",
    OFFICE: "Office",
    LAND: "Land",
    COMMERCIAL: "Commercial",
    TOWNHOUSE: "Townhouse",
    STUDIO: "Studio",
  };
  return labels[type] || type;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    APPROVED: "text-green-700 bg-green-100",
    PENDING: "text-yellow-700 bg-yellow-100",
    REJECTED: "text-red-700 bg-red-100",
    SOLD: "text-blue-700 bg-blue-100",
    UNAVAILABLE: "text-gray-700 bg-gray-100",
  };
  return colors[status] || "text-gray-700 bg-gray-100";
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
