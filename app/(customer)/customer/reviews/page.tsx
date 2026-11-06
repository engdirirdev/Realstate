import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CustomerReviewsClient, { ReviewItem } from "@/components/customer/CustomerReviewsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Reviews – Customer Portal | Kiro-Maal Real Estate",
  robots: { index: false, follow: false },
};

export const revalidate = 30;

export default async function CustomerReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawReviews = await prisma.review.findMany({
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

  const reviews: ReviewItem[] = rawReviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    property: {
      id: r.property.id,
      title: r.property.title,
      city: r.property.city,
      price: r.property.price,
      images: r.property.images,
    },
  }));

  return <CustomerReviewsClient initialReviews={reviews} />;
}
