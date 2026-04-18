import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { parseSessionHeader } from "./src/lib/auth";

const protectedPaths = ["/dashboard", "/meetings"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (!needsAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get("meeting_scribe_session")?.value ?? null;
  const user = parseSessionHeader(token);

  if (!user) {
    const loginUrl = new URL("/", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/meetings/:path*"],
};
