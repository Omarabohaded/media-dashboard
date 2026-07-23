import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import { hasValidAuthenticatedSession } from "@/lib/sessionPolicy";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/login"];
const authRoutes = ["/api/auth"];

function isPublicPath(pathname: string) {
  return (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

export default auth((request) => {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasValidAuthenticatedSession(request.auth)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
