// ================================================================
// API ROUTE  : /api/upload
// DESCRIPTION: Upload media assets (images, floor plans) to local public/uploads
// ROLE       : Authenticated users (Managers & Admins)
// ================================================================
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
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
      return NextResponse.json({ success: false, error: "No image files provided." }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const uploadedUrls: string[] = [];

    for (const file of filesToProcess) {
      const mime = file.type || "";
      const isVideo = mime.startsWith("video/");
      const isImage = mime.startsWith("image/");
      const isPdf = mime === "application/pdf";
      const isAllowed = isImage || isVideo || isPdf;
      if (!isAllowed) {
        return NextResponse.json({ success: false, error: `Unsupported file format: ${mime || "unknown"}. Please upload an image, video, or PDF.` }, { status: 400 });
      }

      // 100MB limit for video, 25MB for images/PDFs
      const maxLimit = isVideo ? 100 * 1024 * 1024 : 25 * 1024 * 1024;
      if (file.size > maxLimit) {
        return NextResponse.json({ success: false, error: `File "${file.name}" exceeds the ${isVideo ? "100MB" : "25MB"} limit.` }, { status: 400 });
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const ext = path.extname(file.name) || (mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg");
      const cleanExt = ext.startsWith(".") ? ext : `.${ext}`;
      const uniqueName = `prop_${Date.now()}_${Math.random().toString(36).substring(2, 9)}${cleanExt}`;
      const filePath = path.join(uploadDir, uniqueName);

      await writeFile(filePath, buffer);
      uploadedUrls.push(`/uploads/${uniqueName}`);
    }

    return NextResponse.json({
      success: true,
      url: uploadedUrls[0],
      urls: uploadedUrls,
    });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ success: false, error: "Failed to upload image. Please try again." }, { status: 500 });
  }
}
