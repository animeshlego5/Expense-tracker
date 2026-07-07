import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic routing only — presence of the session cookie, no DB calls.
// The real session validation happens in the (app) layout / requireUser().
export function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/expenses") ||
    pathname.startsWith("/add") ||
    pathname.startsWith("/income") ||
    pathname.startsWith("/subscriptions") ||
    pathname.startsWith("/settings");

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!sessionCookie && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/expenses/:path*",
    "/add/:path*",
    "/income/:path*",
    "/subscriptions/:path*",
    "/settings/:path*",
    "/login",
    "/signup",
  ],
};
