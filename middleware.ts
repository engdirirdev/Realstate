import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  // Protected user routes
  const isUserRoute =
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/profile") ||
    nextUrl.pathname.startsWith("/favorites") ||
    nextUrl.pathname.startsWith("/ai-assistant") ||
    nextUrl.pathname.startsWith("/price-prediction") ||
    nextUrl.pathname.startsWith("/search-history") ||
    nextUrl.pathname.startsWith("/compare") ||
    nextUrl.pathname.startsWith("/notifications");

  // Protected admin routes
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // Auth pages (redirect if already logged in)
  const isAuthRoute =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

  if (isAuthRoute) {
    if (isLoggedIn) {
      if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (isUserRoute && !isLoggedIn) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${nextUrl.pathname}`, nextUrl)
    );
  }

  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
