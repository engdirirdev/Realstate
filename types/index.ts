// types/index.ts — Core type exports and augmentations

// Prisma model re-exports
export type {
  User,
  Property,
  PropertyImage,
  Favorite,
  UserPreference,
  SearchHistory,
  Recommendation,
  PricePrediction,
  ChatSession,
  ChatMessage,
  ContactMessage,
  Notification,
} from "@prisma/client";

// Enums
export type PropertyType = "HOUSE" | "APARTMENT" | "VILLA" | "OFFICE" | "LAND" | "COMMERCIAL" | "TOWNHOUSE" | "STUDIO" | "SHOP" | "WAREHOUSE" | "OTHER";
export type PropertyStatus = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "PUBLISHED" | "SOLD" | "RENTED" | "INACTIVE" | "UNAVAILABLE";
export type Role = "USER" | "ADMIN" | "CUSTOMER";
export type ListingType = "FOR_SALE" | "FOR_RENT" | "SALE" | "RENT";

// Property with joined images
export interface PropertyWithImages {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  address: string | null;
  type: PropertyType;
  listingType?: ListingType;
  status: PropertyStatus;
  bedrooms: number;
  bathrooms: number;
  area: number;
  yearBuilt: number | null;
  features?: string[];
  isFurnished: boolean;
  isFeatured: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
  images: { id: string; url: string; altText: string | null; isPrimary: boolean; order: number }[];
}

// Search filters
export interface SearchFilters {
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  type?: PropertyType;
  bedrooms?: number;
  bathrooms?: number;
  minArea?: number;
  maxArea?: number;
  listingType?: ListingType;
  isFurnished?: boolean;
  page?: number;
  limit?: number;
}

// Recommendation
export interface RecommendationResult {
  property: PropertyWithImages;
  score: number;
  reasons: string[];
}

// Price prediction
export interface PricePredictionInput {
  city: string;
  propertyType: PropertyType;
  area: number;
  bedrooms: number;
  bathrooms: number;
  isFurnished?: boolean;
}

export interface PricePredictionOutput {
  predictedPrice: number;
  minPrice: number;
  maxPrice: number;
  confidence: number;
  insights: string[];
  comparables: number;
}

// Chat
export interface ChatIntent {
  type:
    | "SEARCH_PROPERTY"
    | "RECOMMEND_PROPERTY"
    | "PROPERTY_DETAILS"
    | "PRICE_PREDICTION"
    | "GENERAL_QUESTION"
    | "UNKNOWN";
  extractedData: {
    city?: string;
    propertyType?: PropertyType;
    bedrooms?: number;
    maxPrice?: number;
    query?: string;
  };
}

// Generic API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
