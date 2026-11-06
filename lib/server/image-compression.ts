/**
 * ================================================================
 * SERVER-SIDE IMAGE COMPRESSION ENGINE (SHARP)
 * ================================================================
 * Isolated to Node.js server runtime only to prevent bundling native
 * C++ bindings into browser/client chunks.
 */

import sharp from "sharp";

export async function optimizeUploadBuffer(
  buffer: Buffer,
  mime: string,
  filename: string
): Promise<{
  buffer: Buffer;
  contentType: string;
  ext: string;
  isOptimized: boolean;
  savingsPercent?: number;
}> {
  const normalizedMime = (mime || "").toLowerCase().trim();

  // Only compress raster images
  const compressible =
    normalizedMime === "image/jpeg" ||
    normalizedMime === "image/jpg" ||
    normalizedMime === "image/png" ||
    normalizedMime === "image/webp" ||
    normalizedMime === "image/avif";

  if (!compressible) {
    return {
      buffer,
      contentType: normalizedMime || "application/octet-stream",
      ext: filename.includes(".") ? `.${filename.split(".").pop()}` : "",
      isOptimized: false,
    };
  }

  try {
    const originalSize = buffer.length;

    // Sharp pipeline: Auto-orient + Max 2560px + WebP conversion (q=82, effort=4)
    const pipeline = sharp(buffer)
      .rotate() // auto-orient EXIF
      .resize({
        width: 2560,
        height: 2560,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 82,
        effort: 4,
        smartSubsample: true,
      });

    const optimizedBuffer = await pipeline.toBuffer();
    const newSize = optimizedBuffer.length;
    const savingsPercent = Math.max(0, Math.round(((originalSize - newSize) / originalSize) * 100));

    // If optimized buffer is smaller, use it; otherwise preserve original
    if (newSize < originalSize) {
      return {
        buffer: optimizedBuffer,
        contentType: "image/webp",
        ext: ".webp",
        isOptimized: true,
        savingsPercent,
      };
    }

    return {
      buffer,
      contentType: normalizedMime,
      ext: filename.includes(".") ? `.${filename.split(".").pop()}` : ".jpg",
      isOptimized: false,
      savingsPercent: 0,
    };
  } catch (error) {
    console.warn(`[optimizeUploadBuffer] Failed to compress image (${filename}):`, error);
    return {
      buffer,
      contentType: normalizedMime,
      ext: filename.includes(".") ? `.${filename.split(".").pop()}` : ".jpg",
      isOptimized: false,
    };
  }
}

