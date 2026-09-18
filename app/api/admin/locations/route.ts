import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({ orderBy: { city: "asc" } });
    return NextResponse.json({ success: true, locations });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { city, region, country } = await request.json();
    if (!city || !region) return NextResponse.json({ error: "City and Region required" }, { status: 400 });

    const location = await prisma.location.create({
      data: {
        city: String(city).trim(),
        region: String(region).trim(),
        country: country ? String(country).trim() : "Somalia",
      },
    });

    return NextResponse.json({ success: true, location });
  } catch (error) {
    return NextResponse.json({ error: "Location already exists" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete location" }, { status: 500 });
  }
}
