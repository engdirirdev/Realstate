import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

/**
 * Validates that a callback URL is a safe internal relative path,
 * preventing Open Redirect vulnerabilities.
 */
function isSafeCallbackUrl(url: string | null): boolean {
  if (!url) return false;
  // Must start with single slash, not double slash, no backslashes, no scheme protocol
  return (
    url.startsWith("/") &&
    !url.startsWith("//") &&
    !url.includes("://") &&
    !url.includes("\\")
  );
}

/**
 * Attaches standard enterprise security headers to every response.
 */
function applySecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  res.headers.set("X-DNS-Prefetch-Control", "on");
  if (process.env.NODE_ENV === "production") {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  return res;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const isActive = (req.auth?.user as any)?.isActive !== false;

  const isApiRoute = nextUrl.pathname.startsWith("/api/");
  const isCustomerRoute = nextUrl.pathname.startsWith("/customer");
  const isManagerRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

  // Account revocation check: If user token is deactivated, revoke access immediately
  if (isLoggedIn && !isActive) {
    if (isApiRoute) {
      return applySecurityHeaders(
        NextResponse.json(
          { success: false, error: "Account is deactivated.", code: "ACCOUNT_DEACTIVATED" },
          { status: 403 }
        )
      );
    }
    const loginUrl = new URL("/login?error=account_deactivated", nextUrl);
    return applySecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // 1. API Route Defense (CSRF Origin Check on state mutations)
  if (isApiRoute) {
    if (!nextUrl.pathname.startsWith("/api/auth")) {
      if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
        const origin = req.headers.get("origin");
        const host = req.headers.get("host");
        if (origin && host) {
          try {
            const originHost = new URL(origin).host;
            if (originHost !== host) {
              return applySecurityHeaders(
                NextResponse.json(
                  {
                    success: false,
                    error: "Cross-Site Request Forgery blocked. Invalid origin.",
                  },
                  { status: 403 }
                )
              );
            }
          } catch {
            return applySecurityHeaders(
              NextResponse.json(
                { success: false, error: "Invalid request origin header." },
                { status: 403 }
              )
            );
          }
        }
      }
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Auth pages (/login, /register)
  if (isAuthRoute) {
    if (isLoggedIn && nextUrl.searchParams.get("switch") !== "true") {
      const rawCallback = nextUrl.searchParams.get("callbackUrl");
      if (rawCallback && isSafeCallbackUrl(rawCallback)) {
        return applySecurityHeaders(
          NextResponse.redirect(new URL(rawCallback, nextUrl))
        );
      }

      // Default role landing
      if (role === "ADMIN") {
        return applySecurityHeaders(
          NextResponse.redirect(new URL("/admin", nextUrl))
        );
      }
      if (role === "CUSTOMER") {
        return applySecurityHeaders(
          NextResponse.redirect(new URL("/customer", nextUrl))
        );
      }
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", nextUrl))
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 3. Admin routes: require login and ADMIN role
  if (isAdminRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
    if (role !== "ADMIN") {
      const destination = role === "CUSTOMER" ? "/customer" : "/dashboard";
      return applySecurityHeaders(
        NextResponse.redirect(new URL(destination, nextUrl))
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Manager / Staff routes: require login and manager/admin role (not CUSTOMER)
  if (isManagerRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
    if (role === "CUSTOMER") {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/customer", nextUrl))
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // 5. Customer routes: require login
  if (isCustomerRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", nextUrl);
      loginUrl.searchParams.set("callbackUrl", nextUrl.pathname + nextUrl.search);
      return applySecurityHeaders(NextResponse.redirect(loginUrl));
    }
    return applySecurityHeaders(NextResponse.next());
  }

  return applySecurityHeaders(NextResponse.next());
});

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
