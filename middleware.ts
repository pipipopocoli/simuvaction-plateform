import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

function isPublicPath(rawPathname: string): boolean {
  // Normalize pathname by removing trailing slash if present (unless it's exactly "/").
  const pathname = rawPathname === "/" ? "/" : rawPathname.replace(/\/$/, "");

  if (pathname === "/") return true;
  if (pathname === "/login") return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname === "/api/auth/logout") return true;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return true;

  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  // We simply check if the token exists to prevent Edge Runtime crypto crashes.
  // The ACTUAL strict verification (`verifySessionJwt`) happens securely inside 
  // the Node.js environment during Server Component rendering via `getUserSession()`.
  if (token) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(redirectUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
