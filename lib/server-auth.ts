import { cookies } from "next/headers";
import { verifySessionJwt, type SessionPayload } from "@/lib/auth";
import { SESSION_COOKIE_NAME } from "@/lib/constants";

export async function getUserSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionJwt(token);
  return payload;
}
