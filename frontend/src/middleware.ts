import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPaths = [
  "/dashboard",
  "/products",
  "/warehouses",
  "/inventory",
  "/transactions",
  "/requests",
  "/roles",
  "/members",
  "/settings",
  "/notifications",
  "/spaces",
  "/join-requests",
  "/workflows",
  "/logs",
  "/audit-logs",
  "/my-assets",
  "/merchants",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const requiresAuth = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!requiresAuth) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/products/:path*",
    "/warehouses/:path*",
    "/inventory/:path*",
    "/transactions/:path*",
    "/requests/:path*",
    "/roles/:path*",
    "/members/:path*",
    "/settings/:path*",
    "/notifications/:path*",
    "/spaces/:path*",
    "/join-requests/:path*",
    "/workflows/:path*",
    "/logs/:path*",
    "/audit-logs/:path*",
    "/my-assets/:path*",
    "/merchants/:path*",
  ],
};
