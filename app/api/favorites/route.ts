import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/favorites — toggle a favorite
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { propertyId } = await request.json();
  if (!propertyId) {
    return NextResponse.json({ error: "propertyId is required" }, { status: 400 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_propertyId: { userId: session.user.id, propertyId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ success: true, action: "removed" });
  } else {
    await prisma.favorite.create({ data: { userId: session.user.id, propertyId } });
    return NextResponse.json({ success: true, action: "added" });
  }
}

// GET /api/favorites — get user's favorites
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    include: {
      property: {
        include: { images: { take: 1, orderBy: { order: "asc" } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, favorites });
}
