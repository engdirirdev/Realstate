import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { invalidateLocationCache } from "@/lib/cache";
import {
  ABUDWAK_VILLAGE_NAMES,
  SYSTEM_COUNTRY,
  SYSTEM_REGION_FULL,
  normalizeAbudwakVillage,
} from "@/lib/abudwak-locations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const locations = await prisma.location.findMany({ orderBy: { city: "asc" } });
    return NextResponse.json({ success: true, locations });
  } catch (error) {
    console.error("[GET /api/admin/locations]", error);
    return NextResponse.json({ success: false, error: "Failed to fetch locations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // Support quick-seeding all 6 official Abudwak villages
    if (body?.seedAllAbudwak) {
      const created: any[] = [];
      for (const village of ABUDWAK_VILLAGE_NAMES) {
        const loc = await prisma.location.upsert({
          where: {
            city_region: {
              city: village,
              region: SYSTEM_REGION_FULL,
            },
          },
          update: { country: SYSTEM_COUNTRY },
          create: {
            city: village,
            region: SYSTEM_REGION_FULL,
            country: SYSTEM_COUNTRY,
          },
        });
        created.push(loc);
      }
      await invalidateLocationCache().catch(() => {});
      return NextResponse.json({ success: true, locations: created });
    }

    const rawVillage = body?.village || body?.city;
    if (!rawVillage) {
      return NextResponse.json(
        { success: false, error: "Village name is required." },
        { status: 400 }
      );
    }

    const canonicalVillage = normalizeAbudwakVillage(String(rawVillage));
    if (!canonicalVillage) {
      return NextResponse.json(
        {
          success: false,
          error: `Only the 6 official villages of Abudwak are allowed: ${ABUDWAK_VILLAGE_NAMES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        city: canonicalVillage,
        region: SYSTEM_REGION_FULL,
        country: SYSTEM_COUNTRY,
      },
    });

    await invalidateLocationCache().catch(() => {});

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("[POST /api/admin/locations]", error);
    return NextResponse.json(
      { success: false, error: "This Abudwak village is already registered." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;
    const rawVillage = body?.village || body?.city;

    if (!id || !rawVillage) {
      return NextResponse.json(
        { success: false, error: "Location ID and Village name are required." },
        { status: 400 }
      );
    }

    const canonicalVillage = normalizeAbudwakVillage(String(rawVillage));
    if (!canonicalVillage) {
      return NextResponse.json(
        {
          success: false,
          error: `Only the 6 official villages of Abudwak are allowed: ${ABUDWAK_VILLAGE_NAMES.join(", ")}.`,
        },
        { status: 400 }
      );
    }

    const location = await prisma.location.update({
      where: { id },
      data: {
        city: canonicalVillage,
        region: SYSTEM_REGION_FULL,
        country: SYSTEM_COUNTRY,
      },
    });

    await invalidateLocationCache().catch(() => {});

    return NextResponse.json({ success: true, location });
  } catch (error) {
    console.error("[PATCH /api/admin/locations]", error);
    return NextResponse.json({ success: false, error: "Failed to update village" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

    await prisma.location.delete({ where: { id } });

    await invalidateLocationCache().catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/admin/locations]", error);
    return NextResponse.json({ success: false, error: "Failed to delete location" }, { status: 500 });
  }
}
