import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/products", "/warehouses", "/inventory", "/requests", "/users", "/settings", "/notifications", "/admin", "/spaces"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiresAuth = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/products/:path*", "/warehouses/:path*", "/inventory/:path*", "/requests/:path*", "/users/:path*", "/settings/:path*", "/notifications/:path*", "/admin/:path*", "/spaces/:path*"],
};