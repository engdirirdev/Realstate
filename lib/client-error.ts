/**
 * ================================================================
 * MODULE     : Client-Side Error Translation & Friendly Messaging
 * PLATFORM   : Kiro-Maal Luxury Real Estate
 * PURPOSE    : Extracts human-readable, bilingual (EN & SO) error
 *              messages from HTTP responses, Network exceptions,
 *              and AppError payloads with offline detection.
 * ================================================================
 */

export interface FriendlyErrorMessage {
  title: string;
  titleSo: string;
  description: string;
  descriptionSo: string;
  isOffline?: boolean;
  status?: number;
}

/**
 * Standard client-facing error catalog with cultural English and Somali translations.
 */
export const CLIENT_ERROR_CATALOG: Record<string, FriendlyErrorMessage> = {
  OFFLINE: {
    title: "Connection Lost",
    titleSo: "Khadka Internet-ka ayaa Go'ay",
    description: "You appear to be offline. Please check your internet connection.",
    descriptionSo: "Waxaad u muuqataa inaad ka go'an tahay khadka. Fadlan hubi xiriirka internet-kaaga.",
    isOffline: true,
  },
  TIMEOUT: {
    title: "Request Timed Out",
    titleSo: "Waqtigii Coddigu wuu Dhacay",
    description: "The server took too long to respond. Please try again in a few moments.",
    descriptionSo: "Server-ku wuxuu qaatay waqti aad u dheer. Fadlan mar kale isku day wax yar ka dib.",
    status: 504,
  },
  UNAUTHORIZED: {
    title: "Authentication Required",
    titleSo: "Fadlan Soo Gal Akoonkaada",
    description: "Your session has expired. Please sign in again to continue.",
    descriptionSo: "Fadhigaagu wuu dhacay. Fadlan mar kale soo gal si aad u sii wadato.",
    status: 401,
  },
  FORBIDDEN: {
    title: "Access Restricted",
    titleSo: "Ogolaansho La'aan",
    description: "You do not have permission to view or manage this luxury property record.",
    descriptionSo: "Uma haysatid ogolaansho inaad aragto ama bedesho xogtan.",
    status: 403,
  },
  NOT_FOUND: {
    title: "Property or Page Not Found",
    titleSo: "Xogtii Lama Helin",
    description: "The requested listing, customer profile, or page does not exist or has been archived.",
    descriptionSo: "Guriga ama bogga aad raadinaysay ma jiro ama kaydka ayaa laga saaray.",
    status: 404,
  },
  RATE_LIMITED: {
    title: "Too Many Requests",
    titleSo: "Codsiyo Aad u Badan",
    description: "Our system is protecting against traffic surges. Please wait 30 seconds before retrying.",
    descriptionSo: "Nidaamka ayaa xadidan. Fadlan sug 30 ilbiriqsi ka hor inta aadan mar kale riixin.",
    status: 429,
  },
  SERVER_ERROR: {
    title: "Service Interruption",
    titleSo: "Cilad Nidaamka Ah",
    description: "Our services are experiencing high demand. Our engineering team has been notified.",
    descriptionSo: "Adeegga wuxuu la kulmayaa mashquul sare. Fadlan mar kale isku day wax yar ka dib.",
    status: 500,
  },
  UNKNOWN: {
    title: "Action Incomplete",
    titleSo: "Hawshu Ma Dhameystirmin",
    description: "Something went wrong while completing your request. Please try again.",
    descriptionSo: "Cilad kooban ayaa dhacday inta howsha la guda-galayey. Fadlan mar kale isku day.",
    status: 500,
  },
};

/**
 * Parses any thrown client error, Response object, or raw error string into
 * bilingual friendly messages.
 */
export function getFriendlyErrorMessage(
  error: unknown,
  fallbackMessage?: string
): FriendlyErrorMessage {
  // 1. Browser offline detection
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return CLIENT_ERROR_CATALOG.OFFLINE;
  }

  if (!error) {
    return {
      ...CLIENT_ERROR_CATALOG.UNKNOWN,
      description: fallbackMessage || CLIENT_ERROR_CATALOG.UNKNOWN.description,
    };
  }

  // 2. Extracted string message
  const rawMsg =
    typeof error === "string"
      ? error
      : (error as any)?.message || (error as any)?.error || String(error);

  const lower = rawMsg.toLowerCase();

  if (lower.includes("offline") || lower.includes("failed to fetch") || lower.includes("network error")) {
    return CLIENT_ERROR_CATALOG.OFFLINE;
  }
  if (lower.includes("timeout") || lower.includes("aborted") || lower.includes("504")) {
    return CLIENT_ERROR_CATALOG.TIMEOUT;
  }
  if (lower.includes("401") || lower.includes("unauthorized") || lower.includes("sign in")) {
    return CLIENT_ERROR_CATALOG.UNAUTHORIZED;
  }
  if (lower.includes("403") || lower.includes("forbidden") || lower.includes("permission")) {
    return CLIENT_ERROR_CATALOG.FORBIDDEN;
  }
  if (lower.includes("404") || lower.includes("not found")) {
    return CLIENT_ERROR_CATALOG.NOT_FOUND;
  }
  if (lower.includes("429") || lower.includes("rate limit") || lower.includes("too many requests")) {
    return CLIENT_ERROR_CATALOG.RATE_LIMITED;
  }
  if (lower.includes("500") || lower.includes("502") || lower.includes("503") || lower.includes("internal")) {
    return CLIENT_ERROR_CATALOG.SERVER_ERROR;
  }

  // If a custom specific message was supplied, return it wrapped in the friendly envelope
  if (fallbackMessage || (rawMsg && rawMsg !== "Error" && rawMsg.length < 120)) {
    return {
      title: "Notice",
      titleSo: "Ogeysiis",
      description: fallbackMessage || rawMsg,
      descriptionSo: (error as any)?.messageSo || "Fadlan hubi xogta aad gelisay oo mar kale isku day.",
      status: 400,
    };
  }

  return CLIENT_ERROR_CATALOG.UNKNOWN;
}

