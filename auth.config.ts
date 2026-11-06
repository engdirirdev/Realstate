import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible NextAuth configuration.
 * Used by middleware.ts to avoid bundling Prisma, MySQL, or bcrypt in the Edge runtime.
 */
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const isBuildPhase =
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_BUILD === "1";
  if (!secret) {
    if (process.env.NODE_ENV === "production" && !isBuildPhase) {
      throw new Error(
        "[Security Alert] Missing required AUTH_SECRET or NEXTAUTH_SECRET environment variable in production mode. Run `openssl rand -base64 32` to generate one."
      );
    }
    return "b140326a76a2785cb7ed14bf60b9f3eb55e7461a74c906f948b4b376e3391acf";
  }
  return secret;
}

export const authConfig = {
  trustHost: true,
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "CUSTOMER";
        token.isActive = (user as any).isActive ?? true;
      }
      return token;
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "PUBLIC";
        session.user.isActive = token.isActive !== false;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
