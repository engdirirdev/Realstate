// ================================================================
// API ROUTE  : /api/upload
// DESCRIPTION: Upload media assets (images, floor plans, videos)
//              with strict MIME verification, extension whitelisting,
//              file size enforcement, and upload rate limiting.
//              Integrated with Enterprise Storage Provider (Local / S3).
// ROLE       : Authenticated Managers and Administrators
// ================================================================
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { requireRole } from "@/lib/auth-guards";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limiter";
import { getStorageProvider } from "@/lib/storage-provider";
import { optimizeUploadBuffer } from "@/lib/server/image-compression";

/**
 * Strict whitelist of allowed safe media extensions.
 * Explicitly EXCLUDES .svg, .html, .xml to prevent Stored XSS via embedded scripts.
 */
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
  ".mp4",
  ".webm",
  ".pdf",
]);

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);

/**
 * GET /api/upload?filename=...&contentType=...
 * Generates presigned upload parameters for direct browser-to-S3 uploads,
 * eliminating high memory usage on the Node.js server at 10,000+ users.
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "USER"]);
    if (authResult.response) {
      return authResult.response;
    }

    const { searchParams } = new URL(request.url);
    const filename = searchParams.get("filename") || "upload.jpg";
    const contentType = searchParams.get("contentType") || "image/jpeg";
    const folder = searchParams.get("folder") || "properties";

    const storage = getStorageProvider();
    const presigned = await storage.getPresignedUploadUrl(filename, contentType, folder);

    return NextResponse.json({
      success: true,
      data: presigned,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate presigned upload parameters." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireRole(["ADMIN", "USER"]);
    if (authResult.response) {
      return authResult.response;
    }
    const { user } = authResult;

    // Rate Limiting: Max 20 file uploads per minute per authenticated manager
    const rateCheck = checkRateLimit(`upload:${user.id}`, {
      limit: 20,
      windowSeconds: 60,
    });
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck);
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const singleFile = formData.get("file") as File | null;

    const filesToProcess: File[] = [];
    if (singleFile && singleFile instanceof File && singleFile.size > 0) {
      filesToProcess.push(singleFile);
    }
    if (files && files.length > 0) {
      for (const f of files) {
        if (f instanceof File && f.size > 0 && !filesToProcess.includes(f)) {
          filesToProcess.push(f);
        }
      }
    }

    if (filesToProcess.length === 0) {
      return NextResponse.json(
        { success: false, error: "No image or media files provided." },
        { status: 400 }
      );
    }

    if (filesToProcess.length > 10) {
      return NextResponse.json(
        { success: false, error: "Maximum 10 files can be uploaded per batch." },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();

    const uploadedUrls = await Promise.all(
      filesToProcess.map(async (file) => {
        const mime = (file.type || "").toLowerCase().trim();
        const rawExt = path.extname(file.name || "").toLowerCase().trim();

        // 1. Extension Whitelist Check
        if (!rawExt || !ALLOWED_EXTENSIONS.has(rawExt)) {
          throw new Error(
            `File "${file.name}" has an untrusted or unsupported file extension. Allowed formats: JPG, PNG, WEBP, AVIF, MP4, WEBM, PDF.`
          );
        }

        // 2. MIME Whitelist Check
        if (!ALLOWED_MIME_TYPES.has(mime)) {
          throw new Error(
            `File "${file.name}" has an invalid MIME type: ${mime || "unknown"}.`
          );
        }

        // 3. File Size Caps (100MB video, 25MB images/PDFs)
        const isVideo = mime.startsWith("video/");
        const maxLimit = isVideo ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
        if (file.size > maxLimit) {
          throw new Error(
            `File "${file.name}" exceeds the ${isVideo ? "100MB" : "25MB"} size limit.`
          );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Server-Side Compression: Auto-orient, downsample 8K to 2.5K, and compress to high-efficiency WebP
        const { buffer: processedBuffer, contentType: finalMime, ext: finalExt } = await optimizeUploadBuffer(
          buffer,
          mime,
          file.name
        );

        const baseName = path.basename(file.name, path.extname(file.name));
        const targetFilename = `${baseName}${finalExt}`;

        const result = await storage.upload(processedBuffer, targetFilename, {
          folder: "properties",
          contentType: finalMime,
        });

        return result.url;
      })
    );

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload media. Please try again." },
      { status: 400 }
    );
  }
}
