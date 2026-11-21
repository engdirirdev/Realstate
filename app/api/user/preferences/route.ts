import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PropertyType } from "@prisma/client";

const VALID_TYPES = new Set([
  "HOUSE",
  "APARTMENT",
  "VILLA",
  "COMMERCIAL",
  "LAND",
  "OFFICE",
  "WAREHOUSE",
  "SHOP",
  "STUDIO",
  "TOWNHOUSE",
  "OTHER",
]);

function normalizeType(val: unknown): PropertyType | null {
  if (!val || typeof val !== "string") return null;
  const upper = val.trim().toUpperCase();
  return VALID_TYPES.has(upper) ? (upper as PropertyType) : null;
}

// GET — fetch current user & preferences
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, preferences] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { id: true, name: true, email: true, phone: true, image: true },
      }),
      prisma.userPreference.findUnique({
        where: { userId: session.user.id },
      }),
    ]);

    const mapped = preferences
      ? {
          preferredCity: preferences.preferredLocation ?? "Mogadishu",
          preferredLocation: preferences.preferredLocation ?? "Mogadishu",
          propertyType: preferences.preferredType ?? "VILLA",
          preferredType: preferences.preferredType ?? "VILLA",
          minBedrooms: preferences.preferredBedrooms ?? 3,
          preferredBedrooms: preferences.preferredBedrooms ?? 3,
          minBudget: preferences.minBudget ?? 20000,
          maxBudget: preferences.maxBudget ?? 150000,
          minArea: preferences.preferredMinArea ?? 120,
        }
      : {
          preferredCity: "Mogadishu",
          preferredLocation: "Mogadishu",
          propertyType: "VILLA",
          preferredType: "VILLA",
          minBedrooms: 3,
          preferredBedrooms: 3,
          minBudget: 20000,
          maxBudget: 150000,
          minArea: 120,
        };

    return NextResponse.json({
      success: true,
      user,
      preferences: mapped,
      data: {
        user,
        preferences: mapped,
      },
    });
  } catch (error) {
    console.error("[GET /api/user/preferences]", error);
    return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
  }
}

// POST — create or update preferences
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const city = body.preferredCity || body.preferredLocation || null;
    const type = normalizeType(body.propertyType || body.preferredType);
    const beds = body.minBedrooms ?? body.preferredBedrooms;
    const minBudget = body.minBudget;
    const maxBudget = body.maxBudget;
    const minArea = body.minArea ?? body.preferredMinArea;

    const preferences = await prisma.userPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        preferredLocation: city,
        preferredType: type,
        preferredBedrooms: beds ? Number(beds) : null,
        minBudget: minBudget !== undefined ? Number(minBudget) : null,
        maxBudget: maxBudget !== undefined ? Number(maxBudget) : null,
        preferredMinArea: minArea !== undefined ? Number(minArea) : null,
      },
      update: {
        preferredLocation: city,
        preferredType: type,
        preferredBedrooms: beds ? Number(beds) : null,
        minBudget: minBudget !== undefined ? Number(minBudget) : null,
        maxBudget: maxBudget !== undefined ? Number(maxBudget) : null,
        preferredMinArea: minArea !== undefined ? Number(minArea) : null,
      },
    });

    return NextResponse.json({ success: true, preferences });
  } catch (error) {
    console.error("[POST /api/user/preferences]", error);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
