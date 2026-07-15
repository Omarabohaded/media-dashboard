import { NextResponse, type NextRequest } from "next/server";

const publicRoutes = ["/login"];
const authRoutes = ["/api/auth", "/api/debug/auth-diagnostics"];

function isPublicPath(pathname: string) {
  return (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

function hasSessionCookie(request: NextRequest) {
  return Boolean(
    request.cookies.get("authjs.session-token")?.value ||
      request.cookies.get("__Secure-authjs.session-token")?.value ||
      request.cookies.get("next-auth.session-token")?.value ||
      request.cookies.get("__Secure-next-auth.session-token")?.value
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie(request)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
