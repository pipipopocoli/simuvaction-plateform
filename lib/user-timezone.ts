import { DateTime } from "luxon";

const FALLBACK_TEAM_TIMEZONES: Record<string, string> = {
  BR: "America/Sao_Paulo",
  CA: "America/Toronto",
  DE: "Europe/Berlin",
  FR: "Europe/Paris",
  GB: "Europe/London",
  IN: "Asia/Kolkata",
  JP: "Asia/Tokyo",
  MX: "America/Mexico_City",
  SG: "Asia/Singapore",
  SN: "Africa/Dakar",
  TR: "Europe/Istanbul",
  US: "America/New_York",
};

export function normalizeTimeZone(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  try {
    return DateTime.now().setZone(value).isValid ? value : null;
  } catch {
    return null;
  }
}

export function inferTimeZoneFromTeam(countryCode: string | null | undefined) {
  if (!countryCode) {
    return null;
  }

  return FALLBACK_TEAM_TIMEZONES[countryCode.trim().toUpperCase()] ?? null;
}

export function resolveUserTimeZone(
  preferredTimeZone: string | null | undefined,
  teamCountryCode: string | null | undefined,
) {
  return normalizeTimeZone(preferredTimeZone) ?? inferTimeZoneFromTeam(teamCountryCode) ?? "UTC";
}

export function formatDateInTimeZone(
  input: Date | string,
  timeZone: string,
  format = "dd LLL yyyy, HH:mm",
) {
  const base = typeof input === "string" ? DateTime.fromISO(input) : DateTime.fromJSDate(input);
  return base.setZone(resolveUserTimeZone(timeZone, null)).toFormat(format);
}
