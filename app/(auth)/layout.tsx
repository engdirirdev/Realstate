import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication | Kiro-Maal Real Estate",
  description: "Sign in or register for Somalia's premier AI-powered luxury real estate platform.",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
