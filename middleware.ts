/**
 * Next.js middleware — protects all /admin/** routes.
 * Any request to /admin/* that is not authenticated is redirected to /admin/login.
 * The /admin/login and /api/auth/** routes are publicly accessible.
 */
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and auth API routes through
  if (
    pathname === "/admin/login" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Protect all /admin routes
  if (pathname.startsWith("/admin")) {
    const session = await auth();
    if (!session?.user) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Double-check role
    const role = (session.user as { role?: string }).role;
    if (role !== "admin") {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
    /*
     * Match all /admin routes.
     * Exclude static files and Next.js internals.
     */
    "/admin/:path*",
    "/api/github/:path*",
  ],
};
