import NextAuth, { CredentialsSignin } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { authConfig } from "@/auth.config";
import { checkRateLimit, clearRateLimit } from "@/lib/rate-limiter";

/**
 * Standard NextAuth Error Classes for Custom Codes
 */
export class AccountDeactivatedError extends CredentialsSignin {
  code = "account_deactivated";
}

export class TooManyAttemptsError extends CredentialsSignin {
  code = "too_many_attempts";
}

export class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "b140326a76a2785cb7ed14bf60b9f3eb55e7461a74c906f948b4b376e3391acf",
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new InvalidCredentialsError();
        }

        const email = (credentials.email as string).trim().toLowerCase();
        const password = credentials.password as string;

        // Rate limiting: 5 failed attempts per 60 seconds per email
        const rateCheck = checkRateLimit(`auth:login:${email}`, {
          limit: 5,
          windowSeconds: 60,
        });

        if (!rateCheck.allowed) {
          throw new TooManyAttemptsError();
        }

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          throw new InvalidCredentialsError();
        }

        if (!user.isActive) {
          throw new AccountDeactivatedError();
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
          throw new InvalidCredentialsError();
        }

        clearRateLimit(`auth:login:${email}`);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // 1. Initial sign in
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.isActive = (user as any).isActive ?? true;
        token.lastValidated = Date.now();
        return token;
      }

      // 2. Client-triggered session update (e.g. profile edit)
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.image) token.picture = session.image;
      }

      // 3. Periodic Session Invalidation / Revalidation
      // Re-verifies user active status and current role from the database every 5 minutes
      const REVALIDATION_WINDOW_MS = 5 * 60 * 1000;
      const needsValidation =
        !token.lastValidated ||
        Date.now() - (token.lastValidated as number) > REVALIDATION_WINDOW_MS ||
        !token.role;

      if (needsValidation && (token.id || token.email)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: token.id
              ? { id: token.id as string }
              : { email: (token.email as string).toLowerCase().trim() },
            select: { id: true, role: true, isActive: true, name: true, image: true },
          });

          if (!dbUser || !dbUser.isActive) {
            token.isActive = false;
            token.role = "REVOKED";
          } else {
            token.id = dbUser.id;
            token.role = dbUser.role;
            token.isActive = true;
            token.lastValidated = Date.now();
          }
        } catch (dbError) {
          console.warn("[Auth JWT] Background session revalidation skipped (DB unreachable):", dbError);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = (token.role as string) || "PUBLIC";
        session.user.isActive = token.isActive !== false && token.role !== "REVOKED";
      }
      return session;
    },
  },
});
