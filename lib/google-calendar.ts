import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const GOOGLE_USERINFO_API = "https://www.googleapis.com/oauth2/v2/userinfo";

function getRequiredGoogleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    return null;
  }

  return { clientId, clientSecret, redirectUri };
}

export function isGoogleCalendarConfigured() {
  return Boolean(getRequiredGoogleEnv());
}

export function buildGoogleCalendarAuthUrl(state: string) {
  const env = getRequiredGoogleEnv();
  if (!env) {
    return null;
  }

  const params = new URLSearchParams({
    client_id: env.clientId,
    redirect_uri: env.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeToken(params: URLSearchParams) {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Google token exchange failed: ${payload}`);
  }

  return response.json() as Promise<{
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
  }>;
}

export async function connectGoogleCalendarForUser(userId: string, eventId: string, code: string) {
  const env = getRequiredGoogleEnv();
  if (!env) {
    throw new Error("Google Calendar integration is not configured.");
  }

  const tokenPayload = await exchangeToken(
    new URLSearchParams({
      code,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      redirect_uri: env.redirectUri,
      grant_type: "authorization_code",
    }),
  );

  if (!tokenPayload.access_token) {
    throw new Error("Google access token was not returned.");
  }

  const userInfoResponse = await fetch(GOOGLE_USERINFO_API, {
    headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
  });
  const userInfo = userInfoResponse.ok
    ? ((await userInfoResponse.json()) as { email?: string })
    : { email: null };

  const expiresAt =
    typeof tokenPayload.expires_in === "number"
      ? new Date(Date.now() + tokenPayload.expires_in * 1000)
      : null;

  return prisma.googleCalendarConnection.upsert({
    where: { userId },
    update: {
      eventId,
      providerAccountEmail: userInfo.email ?? null,
      accessToken: tokenPayload.access_token ?? null,
      refreshToken: tokenPayload.refresh_token ?? null,
      tokenType: tokenPayload.token_type ?? null,
      scope: tokenPayload.scope ?? null,
      expiresAt,
      lastSyncedAt: new Date(),
    },
    create: {
      eventId,
      userId,
      providerAccountEmail: userInfo.email ?? null,
      accessToken: tokenPayload.access_token ?? null,
      refreshToken: tokenPayload.refresh_token ?? null,
      tokenType: tokenPayload.token_type ?? null,
      scope: tokenPayload.scope ?? null,
      expiresAt,
      lastSyncedAt: new Date(),
    },
  });
}

async function refreshGoogleAccessToken(refreshToken: string) {
  const env = getRequiredGoogleEnv();
  if (!env) {
    throw new Error("Google Calendar integration is not configured.");
  }

  return exchangeToken(
    new URLSearchParams({
      refresh_token: refreshToken,
      client_id: env.clientId,
      client_secret: env.clientSecret,
      grant_type: "refresh_token",
    }),
  );
}

async function getValidGoogleAccessToken(userId: string) {
  const connection = await prisma.googleCalendarConnection.findUnique({
    where: { userId },
  });

  if (!connection) {
    return null;
  }

  const stillValid =
    connection.accessToken &&
    connection.expiresAt &&
    connection.expiresAt.getTime() > Date.now() + 60_000;

  if (stillValid) {
    return { accessToken: connection.accessToken!, providerAccountEmail: connection.providerAccountEmail };
  }

  if (!connection.refreshToken) {
    return null;
  }

  const refreshed = await refreshGoogleAccessToken(connection.refreshToken);
  if (!refreshed.access_token) {
    return null;
  }

  const expiresAt =
    typeof refreshed.expires_in === "number"
      ? new Date(Date.now() + refreshed.expires_in * 1000)
      : connection.expiresAt;

  await prisma.googleCalendarConnection.update({
    where: { userId },
    data: {
      accessToken: refreshed.access_token,
      tokenType: refreshed.token_type ?? connection.tokenType,
      scope: refreshed.scope ?? connection.scope,
      expiresAt,
      lastSyncedAt: new Date(),
    },
  });

  return {
    accessToken: refreshed.access_token,
    providerAccountEmail: connection.providerAccountEmail,
  };
}

export async function createGoogleCalendarEventForUser(args: {
  userId: string;
  summary: string;
  description?: string | null;
  startsAt: Date;
  endsAt: Date;
  timeZone?: string | null;
  attendeeEmails?: string[];
}) {
  const token = await getValidGoogleAccessToken(args.userId);
  if (!token) {
    return null;
  }

  const timeZone = args.timeZone || "UTC";
  const response = await fetch(`${GOOGLE_CALENDAR_API}?conferenceDataVersion=1`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: args.summary,
      description: args.description ?? "",
      start: {
        dateTime: args.startsAt.toISOString(),
        timeZone,
      },
      end: {
        dateTime: args.endsAt.toISOString(),
        timeZone,
      },
      attendees: (args.attendeeEmails ?? []).filter(Boolean).map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: randomUUID(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    }),
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Google Calendar event creation failed: ${payload}`);
  }

  const payload = (await response.json()) as {
    id?: string;
    hangoutLink?: string;
    conferenceData?: { entryPoints?: Array<{ uri?: string; entryPointType?: string }> };
  };

  const googleMeetUrl =
    payload.hangoutLink ??
    payload.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === "video")?.uri ??
    null;

  return {
    calendarEventId: payload.id ?? null,
    googleMeetUrl,
  };
}
