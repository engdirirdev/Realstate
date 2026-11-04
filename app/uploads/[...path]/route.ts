import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { stat, readFile } from "fs/promises";
import { createReadStream } from "fs";
import { Readable } from "stream";

// Map extensions to safe MIME types
const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    if (!pathSegments || !Array.isArray(pathSegments) || pathSegments.length === 0) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const uploadsBaseDir = path.resolve(process.cwd(), "public", "uploads");
    const safePath = path.resolve(uploadsBaseDir, ...pathSegments);

    // Path traversal security check: must remain inside uploads directory
    if (!safePath.startsWith(uploadsBaseDir)) {
      return new NextResponse("Access Denied", { status: 403 });
    }

    let fileStats;
    try {
      fileStats = await stat(safePath);
      if (!fileStats.isFile()) {
        return new NextResponse("Not Found", { status: 404 });
      }
    } catch {
      return new NextResponse("Not Found", { status: 404 });
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    // For images and PDFs under 15MB, serve buffer directly with caching
    if (fileStats.size <= 15 * 1024 * 1024) {
      const buffer = await readFile(safePath);
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Content-Length": fileStats.size.toString(),
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    // For larger files (e.g. video files), stream via Web ReadableStream
    const nodeStream = createReadStream(safePath);
    const webStream = Readable.toWeb(nodeStream) as ReadableStream;

    return new NextResponse(webStream, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileStats.size.toString(),
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[GET /uploads] Error serving file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
