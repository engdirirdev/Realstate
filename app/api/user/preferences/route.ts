import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET — fetch current preferences
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
  });

  // Map DB fields to UI-friendly names
  const mapped = preferences
    ? {
        preferredCity: preferences.preferredLocation ?? "",
        propertyType: preferences.preferredType ?? "",
        minBedrooms: preferences.preferredBedrooms ?? 1,
        maxBudget: preferences.maxBudget ?? 100000,
        minArea: preferences.preferredMinArea ?? 50,
      }
    : null;

  return NextResponse.json({ success: true, preferences: mapped });
}

// POST — create or update preferences
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { preferredCity, propertyType, minBedrooms, maxBudget, minArea } = body;

  const preferences = await prisma.userPreference.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      preferredLocation: preferredCity || null,
      preferredType: propertyType || null,
      preferredBedrooms: minBedrooms ? Number(minBedrooms) : null,
      maxBudget: maxBudget ? Number(maxBudget) : null,
      preferredMinArea: minArea ? Number(minArea) : null,
    },
    update: {
      preferredLocation: preferredCity || null,
      preferredType: propertyType || null,
      preferredBedrooms: minBedrooms ? Number(minBedrooms) : null,
      maxBudget: maxBudget ? Number(maxBudget) : null,
      preferredMinArea: minArea ? Number(minArea) : null,
    },
  });

  return NextResponse.json({ success: true, preferences });
}
