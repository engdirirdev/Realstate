import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string }> };

// GET /api/properties/[id]/documents
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const documents = await prisma.propertyDocument.findMany({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, documents });
  } catch (error) {
    console.error("[GET /api/properties/[id]/documents]", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

// POST /api/properties/[id]/documents
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { title, fileUrl, fileType } = await request.json();

    if (!title || !fileUrl) {
      return NextResponse.json({ error: "Title and file URL are required." }, { status: 400 });
    }

    const doc = await prisma.propertyDocument.create({
      data: {
        propertyId: id,
        title: String(title).trim(),
        fileUrl: String(fileUrl).trim(),
        fileType: fileType ? String(fileType).toUpperCase() : "PDF",
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error) {
    console.error("[POST /api/properties/[id]/documents]", error);
    return NextResponse.json({ error: "Failed to add document" }, { status: 500 });
  }
}
