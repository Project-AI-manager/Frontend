import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Защита экранов кабинета: нет refresh-cookie → на /login.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("refresh_token");
  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inbox/:path*",
    "/knowledge/:path*",
    "/analytics/:path*",
    "/channels/:path*",
    "/settings/:path*",
    "/onboarding",
    "/profile",
  ],
};
