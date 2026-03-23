import { cookies, headers } from "next/headers";
import { verifySessionJwt, type SessionPayload } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function getUserSession(): Promise<SessionPayload | null> {
  // Try cookie first (web clients)
  const cookieStore = await cookies();
  let token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  // Fallback to Authorization header (mobile clients)
  if (!token) {
    const headerStore = await headers();
    const authHeader = headerStore.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) {
    return null;
  }

  const payload = await verifySessionJwt(token);
  return payload;
}
