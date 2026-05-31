import { NextResponse } from "next/server";
import { auth } from "@/auth";

const publicRoutes = ["/login"];
const authRoutes = ["/api/auth"];
const adminRoutes = ["/admin"];
const adminApiRoutes = ["/api/admin"];

function isPublicPath(pathname: string) {
  return (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
    authRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))
  );
}

function isAdminPath(pathname: string) {
  return adminRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isAdminApiPath(pathname: string) {
  return adminApiRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isPrivilegedRole(role: unknown) {
  return role === "owner" || role === "admin";
}

export default auth((request) => {
  const { pathname } = request.nextUrl;
  const sessionUser = request.auth?.user as { role?: string; status?: string } | undefined;
  const isAuthenticated = Boolean(request.auth?.user);
  const isActive = sessionUser?.status !== "deactivated";

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isAuthenticated || !isActive) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if ((isAdminPath(pathname) || isAdminApiPath(pathname)) && !isPrivilegedRole(sessionUser?.role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "You do not have permission to perform this action." },
        { status: 403 }
      );
    }

    return NextResponse.redirect(new URL("/", request.nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
