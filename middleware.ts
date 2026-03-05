import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

function isPublicPath(rawPathname: string): boolean {
  // Normalize pathname by removing trailing slash if present (unless it's exactly "/").
  const pathname = rawPathname === "/" ? "/" : rawPathname.replace(/\/$/, "");

  if (pathname === "/") return true;
  if (pathname === "/login") return true;
  if (pathname === "/login/forgot") return true;
  if (pathname === "/auth/reset") return true;
  if (pathname === "/api/public/config") return true;
  if (pathname === "/api/consent") return true;
  if (pathname === "/api/analytics/event") return true;
  if (pathname === "/api/auth/login") return true;
  if (pathname === "/api/auth/logout") return true;
  if (pathname === "/api/auth/reset") return true;

  if (pathname.startsWith("/_next") || pathname === "/favicon.ico") return true;

  return false;
}

async function hasValidSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret || sessionSecret.length < 32) {
    return false;
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(sessionSecret), {
      algorithms: ["HS256"],
    });
    return true;
  } catch {
    return false;
  }
}

function attachSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return attachSecurityHeaders(NextResponse.next());
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (await hasValidSessionToken(token)) {
    return attachSecurityHeaders(NextResponse.next());
  }

  if (pathname.startsWith("/api/")) {
    return attachSecurityHeaders(
      NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    );
  }

  const redirectUrl = new URL("/login", request.url);
  redirectUrl.searchParams.set("next", pathname);
  return attachSecurityHeaders(NextResponse.redirect(redirectUrl));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
