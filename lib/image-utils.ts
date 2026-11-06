/**
 * ================================================================
 * ENTERPRISE IMAGE UTILITIES & PLACEHOLDERS (UNIVERSAL / CLIENT-SAFE)
 * ================================================================
 * High-performance, zero-CLS image placeholder utilities for Kiro-Maal:
 * - Ultra-lightweight inline SVG shimmer blur placeholders
 * - Responsive sizes calculator for multi-device viewports
 * - Safe fallback images with brand aesthetic
 *
 * NOTE: For server-side image compression with Sharp, see
 *       @/lib/server/image-compression.ts
 */

/**
 * Creates an inline SVG shimmer string for Next/Image blurDataURL.
 * Matches Kiro-Maal luxury palette (#07111F, #F7F3EA, #C89B3C).
 */
export function createShimmerSvg(width: number, height: number): string {
  return `
<svg width="${width}" height="${height}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#F7F3EA" offset="20%" />
      <stop stop-color="#EFE9DD" offset="50%" />
      <stop stop-color="#F7F3EA" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="#F7F3EA" />
  <rect id="r" width="${width}" height="${height}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${width}" to="${width}" dur="1.2s" repeatCount="indefinite" />
</svg>`;
}

/**
 * Converts a string to base64 safely across both Node.js and Edge/Browser environments.
 */
export function toBase64(str: string): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(str).toString("base64");
  }
  return typeof btoa !== "undefined" ? btoa(str) : "";
}

/**
 * Pre-computed base64 SVG shimmer for 16:10 and 4:3 property card aspect ratios.
 */
export const PROPERTY_CARD_BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(createShimmerSvg(800, 500))}`;

/**
 * Pre-computed square shimmer for thumbnails and avatars.
 */
export const THUMBNAIL_BLUR_DATA_URL = `data:image/svg+xml;base64,${toBase64(createShimmerSvg(200, 200))}`;

/**
 * Fallback verified property cover image URL (high availability Unsplash CDN).
 */
export const DEFAULT_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80";
