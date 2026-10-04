import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isCustomerRoute = nextUrl.pathname.startsWith("/customer");
  const isManagerRoute = nextUrl.pathname.startsWith("/dashboard");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isAuthRoute =
    nextUrl.pathname === "/login" || nextUrl.pathname === "/register";

  // Auth pages (redirect if already logged in, unless switch=true)
  if (isAuthRoute) {
    if (isLoggedIn && nextUrl.searchParams.get("switch") !== "true") {
      if (role === "ADMIN") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      }
      if (role === "CUSTOMER") {
        return NextResponse.redirect(new URL("/customer", nextUrl));
      }
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  // Admin routes: require login and ADMIN role
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl)
      );
    }
    if (role !== "ADMIN") {
      const destination = role === "CUSTOMER" ? "/customer" : "/dashboard";
      return NextResponse.redirect(new URL(destination, nextUrl));
    }
    return NextResponse.next();
  }

  // Manager / Agent routes: require login and not CUSTOMER
  if (isManagerRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl)
      );
    }
    if (role === "CUSTOMER") {
      return NextResponse.redirect(new URL("/customer", nextUrl));
    }
    return NextResponse.next();
  }

  // Customer routes: require login
  if (isCustomerRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`, nextUrl)
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
