const fs = require('fs');
const path = require('path');

const reviewPagePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'properties', '[id]', 'review', 'page.tsx');
let reviewPageCode = fs.readFileSync(reviewPagePath, 'utf8');

// Build AdminPropertyReviewClient.tsx
let clientCode = reviewPageCode.replace(
  'interface ReviewPageProps {\n  params: Promise<{ id: string }>;\n}\n\nexport default function PropertyReviewPage({ params }: ReviewPageProps) {\n  const { id } = use(params);\n  const router = useRouter();\n\n  const [property, setProperty] = useState<any>(null);\n  const [fetching, setFetching] = useState(true);\n  const [loading, setLoading] = useState<string | null>(null);',
  `import { memo, useCallback } from "react";

interface AdminPropertyReviewClientProps {
  initialProperty: any;
}

function AdminPropertyReviewClient({ initialProperty }: AdminPropertyReviewClientProps) {
  const router = useRouter();
  const id = initialProperty?.id;
  const [property, setProperty] = useState<any>(initialProperty);
  const [fetching, setFetching] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);`
);

// Remove the client loadProperty useEffect
clientCode = clientCode.replace(
  /useEffect\(\(\) => {\s*async function loadProperty\(\) {[\s\S]*?loadProperty\(\);\s*}, \[id\]\);/,
  `// Initial property data pre-hydrated directly from Server Component (0ms fetch waterfall)`
);

clientCode += '\nexport default memo(AdminPropertyReviewClient);\n';

const clientDestPath = path.join(__dirname, '..', 'components', 'admin', 'AdminPropertyReviewClient.tsx');
fs.writeFileSync(clientDestPath, clientCode, 'utf8');
console.log('Created components/admin/AdminPropertyReviewClient.tsx');

// Now write Server Component app/(admin)/admin/properties/[id]/review/page.tsx
const serverPageCode = `// ================================================================
// PAGE NAME  : Admin Dashboard — Property Review (Server Component)
// ROUTE      : /admin/properties/[id]/review
// DESCRIPTION: Dynamic review page for admin to inspect property-type-
//              specific fields, verify documents, and approve/reject
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminPropertyReviewClient from "@/components/admin/AdminPropertyReviewClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Governance Review – Admin Portal | Kiro-Maal Real Estate",
  description: "Inspect property specifications, verify land title deeds, and enforce compliance standards.",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

interface ReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function PropertyReviewPage({ params }: ReviewPageProps) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      images: { orderBy: { order: "asc" } },
      manager: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!property) notFound();

  return <AdminPropertyReviewClient initialProperty={property} />;
}
`;

fs.writeFileSync(reviewPagePath, serverPageCode, 'utf8');
console.log('Rewrote app/(admin)/admin/properties/[id]/review/page.tsx as Server Component');

