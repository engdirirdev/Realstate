const fs = require('fs');
const path = require('path');

const userPagePath = path.join(__dirname, '..', 'app', '(admin)', 'admin', 'users', '[id]', 'page.tsx');
let userPageCode = fs.readFileSync(userPagePath, 'utf8');

// Build AdminUserInspectionClient.tsx
let clientCode = userPageCode.replace(
  'type Props = { params: Promise<{ id: string }> };\n\nexport default function AdminUserReviewPage({ params }: Props) {\n  const { id } = use(params);\n  const router = useRouter();\n\n  const [user, setUser] = useState<any>(null);\n  const [loading, setLoading] = useState(true);\n  const [updating, setUpdating] = useState(false);',
  `import { memo, useCallback } from "react";

interface AdminUserInspectionClientProps {
  initialUser: any;
}

function AdminUserInspectionClient({ initialUser }: AdminUserInspectionClientProps) {
  const router = useRouter();
  const id = initialUser?.id;
  const [user, setUser] = useState<any>(initialUser);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);`
);

// Remove fetchUserData and useEffect
clientCode = clientCode.replace(
  /const fetchUserData = async \(\) => {[\s\S]*?useEffect\(\(\) => {\s*fetchUserData\(\);\s*}, \[id\]\);/,
  `// Initial user data hydrated directly from Server Component (0ms fetch waterfall)`
);

clientCode += '\nexport default memo(AdminUserInspectionClient);\n';

const clientDestPath = path.join(__dirname, '..', 'components', 'admin', 'AdminUserInspectionClient.tsx');
fs.writeFileSync(clientDestPath, clientCode, 'utf8');
console.log('Created components/admin/AdminUserInspectionClient.tsx');

// Now write Server Component app/(admin)/admin/users/[id]/page.tsx
const serverPageCode = `// ================================================================
// PAGE NAME  : Admin Dashboard — User Inspection (Server Component)
// ROUTE      : /admin/users/[id]
// DESCRIPTION: Dynamic Role-Based Read-Only Dashboard Preview for
//              ADMIN, USER/MANAGER, and CUSTOMER roles (SSR Fast)
// ROLE       : ADMIN only
// ================================================================
import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminUserInspectionClient from "@/components/admin/AdminUserInspectionClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Inspection – Admin Portal | Kiro-Maal Real Estate",
  description: "Inspect user account telemetry, permissions, and role-specific dashboard metrics.",
  robots: { index: false, follow: false },
};

export const revalidate = 60;

type Props = { params: Promise<{ id: string }> };

export default async function AdminUserReviewPage({ params }: Props) {
  const session = await auth();
  if (!session || (session.user as any)?.role !== "ADMIN") redirect("/login");

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      preferences: true,
      favorites: {
        include: { property: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
        orderBy: { createdAt: "desc" },
      },
      recommendations: {
        include: { property: { include: { images: { take: 1, orderBy: { order: "asc" } } } } },
        orderBy: { score: "desc" },
      },
      managedProperties: {
        include: { images: { take: 1, orderBy: { order: "asc" } } },
        orderBy: { createdAt: "desc" },
      },
      customerInquiries: {
        include: { property: { select: { title: true, city: true, price: true } } },
        orderBy: { createdAt: "desc" },
      },
      managerInquiries: {
        include: { property: { select: { title: true, city: true } }, customer: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      customerBookings: {
        include: { property: { select: { title: true, city: true, price: true } }, payments: true },
        orderBy: { createdAt: "desc" },
      },
      managerBookings: {
        include: { property: { select: { title: true, city: true } }, customer: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" },
      },
      customerPayments: {
        include: { property: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      },
      managerPayments: {
        include: { property: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      },
      customerRentalRequests: {
        include: { property: { select: { title: true, city: true, price: true } } },
        orderBy: { createdAt: "desc" },
      },
      customerPurchaseRequests: {
        include: { property: { select: { title: true, city: true, price: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  return <AdminUserInspectionClient initialUser={user} />;
}
`;

fs.writeFileSync(userPagePath, serverPageCode, 'utf8');
console.log('Rewrote app/(admin)/admin/users/[id]/page.tsx as Server Component');

