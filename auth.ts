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

// Constant-time dummy hash to prevent user enumeration / timing attacks
const DUMMY_BCRYPT_HASH = "$2a$10$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqr";

// In-memory token revalidation cache (60s TTL) to prevent repeated DB queries during burst navigation
const sessionValidationCache = new Map<string, { role: string; isActive: boolean; validatedAt: number }>();
const VALIDATION_CACHE_TTL = 60 * 1000;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
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
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            role: true,
            isActive: true,
            password: true,
          },
        });

        if (!user || !user.password) {
          // Timing attack defense: run bcrypt.compare against dummy hash before throwing
          await bcrypt.compare(password, DUMMY_BCRYPT_HASH).catch(() => false);
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

        // Populate validation cache immediately on successful sign-in
        sessionValidationCache.set(user.id, {
          role: user.role,
          isActive: user.isActive,
          validatedAt: Date.now(),
        });

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
      // Re-verifies user active status and current role from database or memory cache every 5 minutes
      const REVALIDATION_WINDOW_MS = 5 * 60 * 1000;
      const needsValidation =
        !token.lastValidated ||
        Date.now() - (token.lastValidated as number) > REVALIDATION_WINDOW_MS ||
        !token.role;

      if (needsValidation && (token.id || token.email)) {
        const userId = token.id as string;
        const cached = userId ? sessionValidationCache.get(userId) : undefined;

        if (cached && Date.now() - cached.validatedAt < VALIDATION_CACHE_TTL) {
          token.role = cached.role;
          token.isActive = cached.isActive;
          token.lastValidated = Date.now();
        } else {
          try {
            const dbUser = await prisma.user.findUnique({
              where: userId
                ? { id: userId }
                : { email: (token.email as string).toLowerCase().trim() },
              select: { id: true, role: true, isActive: true },
            });

            if (!dbUser || !dbUser.isActive) {
              token.isActive = false;
              token.role = "REVOKED";
              if (userId) sessionValidationCache.delete(userId);
            } else {
              token.id = dbUser.id;
              token.role = dbUser.role;
              token.isActive = true;
              token.lastValidated = Date.now();
              sessionValidationCache.set(dbUser.id, {
                role: dbUser.role,
                isActive: true,
                validatedAt: Date.now(),
              });
            }
          } catch (dbError) {
            console.warn("[Auth JWT] Background session revalidation skipped (DB unreachable):", dbError);
          }
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
