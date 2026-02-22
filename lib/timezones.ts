import { DateTime } from "luxon";
import {
  BANGKOK_TIMEZONE,
  DISPLAY_TIMEZONES,
  NAIROBI_TIMEZONE,
  PARIS_TIMEZONE,
} from "@/lib/constants";

export function fromParisIsoToUtcDate(isoLocalParis: string): Date {
  return DateTime.fromISO(isoLocalParis, { zone: PARIS_TIMEZONE }).toUTC().toJSDate();
}

export function toParisDateTime(input: Date | string): DateTime {
  const base = typeof input === "string" ? DateTime.fromISO(input) : DateTime.fromJSDate(input);
  return base.setZone(PARIS_TIMEZONE);
}

export function getCurrentParisNow(): DateTime {
  return DateTime.now().setZone(PARIS_TIMEZONE);
}

export function getCurrentParisWeekStart(now = getCurrentParisNow()): DateTime {
  return now.startOf("week");
}

export function formatInZone(
  input: Date | string,
  zone: string,
  format = "dd LLL yyyy, HH:mm",
): string {
  const base = typeof input === "string" ? DateTime.fromISO(input) : DateTime.fromJSDate(input);
  return base.setZone(zone).toFormat(format);
}

export function toDisplayTimezoneRows(input: Date | string) {
  return DISPLAY_TIMEZONES.map((entry) => ({
    label: entry.label,
    value: formatInZone(input, entry.zone),
  }));
}

export function parisNowPlusDays(days: number): Date {
  return getCurrentParisNow().plus({ days }).toUTC().toJSDate();
}

export function parseDatetimeLocalToUtc(value: string): Date {
  return DateTime.fromISO(value, { zone: PARIS_TIMEZONE }).toUTC().toJSDate();
}

export function utcDateToDatetimeLocalValue(input: Date): string {
  return DateTime.fromJSDate(input)
    .setZone(PARIS_TIMEZONE)
    .toFormat("yyyy-LL-dd'T'HH:mm");
}

export const TZ_COLUMNS = {
  paris: PARIS_TIMEZONE,
  bangkok: BANGKOK_TIMEZONE,
  nairobi: NAIROBI_TIMEZONE,
};
