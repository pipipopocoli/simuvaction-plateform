export const SESSION_COOKIE_NAME = "simuvaction_session";

export const PARIS_TIMEZONE = "Europe/Paris";
export const BANGKOK_TIMEZONE = "Asia/Bangkok";
export const NAIROBI_TIMEZONE = "Africa/Nairobi";

export const DISPLAY_TIMEZONES = [
  { label: "CET/CEST (Europe/Paris)", zone: PARIS_TIMEZONE },
  { label: "Asia/Bangkok", zone: BANGKOK_TIMEZONE },
  { label: "Africa/Nairobi", zone: NAIROBI_TIMEZONE },
] as const;

export const DEFAULT_TAG_NAMES = [
  "Research",
  "Writing",
  "Negotiation",
  "X",
  "Logistics",
] as const;

export const PILLARS = [
  { name: "Learning", slug: "learning" },
  { name: "Profiling & Privacy", slug: "profiling-privacy" },
  { name: "Inclusion", slug: "inclusion" },
  { name: "Governance", slug: "governance" },
  { name: "MediaCom", slug: "mediacom" },
] as const;

export const OFFICIAL_DEADLINES = [
  {
    title: "Team Formation deadline",
    isoParis: "2026-02-24T23:59:00",
    orderIndex: 1,
  },
  {
    title: "Position Paper due",
    isoParis: "2026-03-24T23:59:00",
    orderIndex: 2,
  },
  {
    title: "D-Day recommendations submission",
    isoParis: "2026-03-25T17:00:00",
    orderIndex: 3,
  },
  {
    title: "Individual report due",
    isoParis: "2026-04-22T23:59:00",
    orderIndex: 4,
  },
  {
    title: "Voices from Simuvaction seminar",
    isoParis: "2026-04-24T23:59:00",
    orderIndex: 5,
  },
] as const;

export const RATE_LIMIT_MAX_FAILURES = 5;
export const RATE_LIMIT_WINDOW_MINUTES = 10;
