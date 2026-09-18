import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

type Props = { params: Promise<{ id: string }> };

// GET /api/properties/[id]/reviews
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;
    const reviews = await prisma.review.findMany({
      where: { propertyId: id },
      include: {
        user: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const averageRating = reviews.length > 0
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
      : 5.0;

    return NextResponse.json({ success: true, reviews, averageRating, total: reviews.length });
  } catch (error) {
    console.error("[GET /api/properties/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

// POST /api/properties/[id]/reviews
export async function POST(request: NextRequest, { params }: Props) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized. Please log in to leave a review." }, { status: 401 });
    }

    const { id } = await params;
    const { rating, comment } = await request.json();

    if (!rating || rating < 1 || rating > 5 || !comment) {
      return NextResponse.json({ error: "Rating (1-5) and comment are required." }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: {
        propertyId: id,
        userId: session.user.id,
        rating: Number(rating),
        comment: String(comment).trim(),
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("[POST /api/properties/[id]/reviews]", error);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
