import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerReviewsClient, {
  ReviewItem,
  ReviewPropertyOption,
} from "@/components/customer/CustomerReviewsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Reviews – Customer Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 0;

export default async function CustomerReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [rawReviews, rawProperties] = await Promise.all([
    prisma.review.findMany({
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
    }),
    prisma.property.findMany({
      where: {
        status: { in: ["APPROVED", "PUBLISHED"] },
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        city: true,
        price: true,
      },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
  ]);

  const reviews: ReviewItem[] = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    property: {
      id: r.property.id,
      title: r.property.title,
      city: r.property.city,
      price: Number(r.property.price),
      images: r.property.images,
    },
  }));

  const properties: ReviewPropertyOption[] = rawProperties.map((p) => ({
    id: p.id,
    title: p.title,
    city: p.city,
    price: Number(p.price),
  }));

  return <CustomerReviewsClient initialReviews={reviews} properties={properties} />;
}
