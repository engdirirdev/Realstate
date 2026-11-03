/**
 * ================================================================
 * MODULE     : API Caching & HTTP Cache-Control Utilities
 * PLATFORM   : Kiro-Maal Luxury Real Estate
 * PURPOSE    : Provides HTTP Cache-Control profiles, ETag calculation,
 *              and 304 Not Modified conditional responses.
 * ================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export interface CacheProfile {
  maxAge?: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  isPrivate?: boolean;
  immutable?: boolean;
}

export const CACHE_PROFILES = {
  // Public dynamic queries: 60s CDN cache with 5min stale-while-revalidate
  PUBLIC_SHORT: {
    sMaxAge: 60,
    staleWhileRevalidate: 300,
  } as CacheProfile,

  // Homepage featured / stats: 5min CDN cache with 10min stale-while-revalidate
  PUBLIC_MEDIUM: {
    sMaxAge: 300,
    staleWhileRevalidate: 600,
  } as CacheProfile,

  // Static reference data (Locations, Categories): 1h browser, 24h CDN, 7 days SWR
  PUBLIC_LONG: {
    maxAge: 3600,
    sMaxAge: 86400,
    staleWhileRevalidate: 604800,
  } as CacheProfile,

  // Immutable static assets: 1 year
  IMMUTABLE: {
    maxAge: 31536000,
    immutable: true,
  } as CacheProfile,

  // Authenticated, financial, or sensitive data: Zero cache
  PRIVATE_NO_CACHE: {
    isPrivate: true,
  } as CacheProfile,
};

/**
 * Builds standard Cache-Control header string from profile.
 */
export function buildCacheControlHeader(profile: CacheProfile): string {
  if (profile.isPrivate) {
    return "private, no-cache, no-store, must-revalidate";
  }

  const parts: string[] = ["public"];

  if (profile.maxAge !== undefined) {
    parts.push(`max-age=${profile.maxAge}`);
  }

  if (profile.sMaxAge !== undefined) {
    parts.push(`s-maxage=${profile.sMaxAge}`);
  }

  if (profile.staleWhileRevalidate !== undefined) {
    parts.push(`stale-while-revalidate=${profile.staleWhileRevalidate}`);
  }

  if (profile.immutable) {
    parts.push("immutable");
  }

  return parts.join(", ");
}

/**
 * Generates an ETag hash from any JSON-serializable object.
 */
export function generateEtag(data: any): string {
  try {
    const serialized = typeof data === "string" ? data : JSON.stringify(data);
    const hash = crypto.createHash("sha1").update(serialized).digest("base64url");
    return `"${hash.slice(0, 24)}"`;
  } catch {
    return `"${Date.now()}"`;
  }
}

export interface CachedResponseOptions {
  profile?: CacheProfile;
  status?: number;
  headers?: Record<string, string>;
}

/**
 * Returns a cached JSON response with ETag and 304 Not Modified support.
 */
export function cachedJsonResponse(
  req: NextRequest,
  data: any,
  options: CachedResponseOptions = {}
): NextResponse {
  const { profile = CACHE_PROFILES.PUBLIC_SHORT, status = 200, headers = {} } = options;

  const cacheControl = buildCacheControlHeader(profile);
  const etag = generateEtag(data);

  const clientEtag = req.headers.get("if-none-match");

  // If client already has latest version, return 304 Not Modified with no body
  if (clientEtag && clientEtag === etag && !profile.isPrivate) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        "Cache-Control": cacheControl,
        ETag: etag,
        Vary: "Accept-Encoding",
        ...headers,
      },
    });
  }

  // Full response with caching headers
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": cacheControl,
      ETag: etag,
      Vary: "Accept-Encoding",
      ...headers,
    },
  });
}
