import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { dbCache, invalidatePropertyCache } from "@/lib/cache";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST: Customer creates a new property review
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, rating, comment } = body;

    if (!propertyId) {
      return NextResponse.json({ error: "Please select a property to review." }, { status: 400 });
    }
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 stars." }, { status: 400 });
    }
    if (!comment || !String(comment).trim()) {
      return NextResponse.json({ error: "Please write a review comment." }, { status: 400 });
    }

    const created = await prisma.review.create({
      data: {
        userId: session.user.id,
        propertyId: String(propertyId),
        rating: numRating,
        comment: String(comment).trim(),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
          },
        },
      },
    });

    dbCache.invalidateTags(["reviews", "properties"]);
    await invalidatePropertyCache(String(propertyId)).catch(() => {});

    return NextResponse.json({
      success: true,
      review: {
        ...created,
        createdAt: created.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Create review error:", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}

// PATCH: Customer edits an existing review
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, rating, comment } = body;

    if (!id) {
      return NextResponse.json({ error: "Review ID is required." }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Review not found or unauthorized." }, { status: 404 });
    }

    const numRating = rating !== undefined ? Number(rating) : existing.rating;
    if (numRating < 1 || numRating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5 stars." }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        rating: numRating,
        ...(comment !== undefined && { comment: String(comment).trim() }),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            price: true,
            images: { take: 1, orderBy: { order: "asc" }, select: { url: true } },
          },
        },
      },
    });

    dbCache.invalidateTags(["reviews", "properties"]);
    await invalidatePropertyCache(existing.propertyId).catch(() => {});

    return NextResponse.json({
      success: true,
      review: {
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Update review error:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 });
    }

    await prisma.review.deleteMany({
      where: { id, userId: session.user.id },
    });

    dbCache.invalidateTags(["reviews", "properties"]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete review error:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
