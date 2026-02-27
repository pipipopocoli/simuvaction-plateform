export type AtlasDelegationKind = "country" | "actor";

export type AtlasMapPoint = {
  xPct: number;
  yPct: number;
};

export type AtlasMemberPreview = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  positionPaperSummary: string | null;
};

export type AtlasDelegation = {
  id: string;
  name: string;
  countryCode: string;
  flagEmoji: string;
  kind: AtlasDelegationKind;
  region: string;
  status: "active" | "watch";
  stance: string;
  priorities: string[];
  memberCount: number;
  memberPreviews: AtlasMemberPreview[];
  leadership: AtlasMemberPreview[];
  latestActions: string[];
  mapPoint?: AtlasMapPoint;
};

type TeamWithCount = {
  id: string;
  countryCode: string;
  countryName: string;
  stanceShort: string | null;
  stanceLong: string | null;
  priorities: string[];
  latestActions?: string[];
  users?: Array<{
    id: string;
    name: string;
    role: string;
    avatarUrl: string | null;
    positionPaperSummary: string | null;
  }>;
  _count: { users: number };
};

const NAME_NORMALIZATION: Record<string, string> = {
  Mexique: "Mexico",
  "Sénégal": "Senegal",
  "Türkiye": "Turkey",
  "United Kingdom": "UK",
  Britain: "UK",
  "United States": "USA",
  "United States of America": "USA",
  Brasil: "Brazil",
};

const COUNTRY_COORDINATES: Record<string, AtlasMapPoint> = {
  Brazil: { xPct: 30, yPct: 55 },
  Canada: { xPct: 20, yPct: 27 },
  France: { xPct: 48, yPct: 34 },
  Germany: { xPct: 50, yPct: 33 },
  India: { xPct: 62, yPct: 45 },
  Japan: { xPct: 77, yPct: 40 },
  Mexico: { xPct: 17, yPct: 44 },
  Senegal: { xPct: 43, yPct: 46 },
  Singapore: { xPct: 68, yPct: 58 },
  Turkey: { xPct: 56, yPct: 39 },
  UK: { xPct: 46, yPct: 30 },
  USA: { xPct: 16, yPct: 36 },
};

const COUNTRY_ALPHA2: Record<string, string> = {
  Brazil: "BR",
  Canada: "CA",
  France: "FR",
  Germany: "DE",
  India: "IN",
  Japan: "JP",
  Mexico: "MX",
  Senegal: "SN",
  Singapore: "SG",
  Turkey: "TR",
  UK: "GB",
  USA: "US",
};

const ISO3_TO_ALPHA2: Record<string, string> = {
  BRA: "BR",
  CAN: "CA",
  FRA: "FR",
  DEU: "DE",
  GER: "DE",
  IND: "IN",
  JPN: "JP",
  MEX: "MX",
  SEN: "SN",
  SGP: "SG",
  TUR: "TR",
  GBR: "GB",
  UK: "GB",
  USA: "US",
};

const COUNTRY_REGION: Record<string, string> = {
  Brazil: "Americas",
  Canada: "Americas",
  France: "Europe",
  Germany: "Europe",
  India: "Asia",
  Japan: "Asia",
  Mexico: "Americas",
  Senegal: "Africa",
  Singapore: "Asia",
  Turkey: "Europe",
  UK: "Europe",
  USA: "Americas",
};

const NON_STATE_ACTORS = new Set([
  "Everyone.AI",
  "Everyone AI",
  "EVERYONE.AI",
  "ICESCO",
  "Meta",
  "Microsoft",
]);

function normalizeName(name: string): string {
  return NAME_NORMALIZATION[name] ?? name;
}

function inferRegion(name: string, kind: AtlasDelegationKind): string {
  if (kind === "actor") {
    return "Global";
  }

  return COUNTRY_REGION[name] ?? "Global";
}

function defaultStance(name: string, kind: AtlasDelegationKind): string {
  if (kind === "actor") {
    return `${name} is active in cross-delegation coordination and policy influence.`;
  }

  return `${name} is currently refining its diplomatic position for this simulation round.`;
}

function defaultPriorities(kind: AtlasDelegationKind): string[] {
  if (kind === "actor") {
    return ["Coalition outreach", "Policy alignment", "Strategic communication"];
  }

  return ["Negotiation strategy", "Resolution drafting", "Bilateral outreach"];
}

function normalizeCountryCode(rawCode: string, normalizedName: string, kind: AtlasDelegationKind): string {
  if (kind === "actor") {
    return "GLOBAL";
  }

  const upperCode = rawCode.trim().toUpperCase();
  const byIso3 = ISO3_TO_ALPHA2[upperCode];
  if (byIso3) {
    return byIso3;
  }

  const byName = COUNTRY_ALPHA2[normalizedName];
  if (byName) {
    return byName;
  }

  return upperCode.slice(0, 2) || "UN";
}

function toFlagEmoji(countryCode: string): string {
  if (countryCode.length !== 2) {
    return "🌐";
  }

  const points = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
}

export function toAtlasDelegations(teams: TeamWithCount[]): AtlasDelegation[] {
  return teams
    .map((team) => {
      const normalizedName = normalizeName(team.countryName);
      const kind: AtlasDelegationKind = NON_STATE_ACTORS.has(normalizedName) ? "actor" : "country";
      const mapPoint = kind === "country" ? COUNTRY_COORDINATES[normalizedName] : undefined;
      const stanceSource = team.stanceShort?.trim() || team.stanceLong?.trim();
      const countryCode = normalizeCountryCode(team.countryCode, normalizedName, kind);
      const allMembers = (team.users ?? []).map((user) => ({
        id: user.id,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        positionPaperSummary: user.positionPaperSummary,
      }));
      const leadership = allMembers.filter((member) => member.role === "leader").slice(0, 2);
      const memberPreviews = allMembers.slice(0, 2);
      const latestActions = team.latestActions && team.latestActions.length > 0
        ? team.latestActions.slice(0, 3)
        : ["No recent tracked action."];

      return {
        id: team.id,
        name: normalizedName,
        countryCode,
        flagEmoji: kind === "country" ? toFlagEmoji(countryCode) : "🌐",
        kind,
        region: inferRegion(normalizedName, kind),
        status: team._count.users > 0 ? "active" : "watch",
        stance: stanceSource || defaultStance(normalizedName, kind),
        priorities: team.priorities.length > 0 ? team.priorities : defaultPriorities(kind),
        memberCount: team._count.users,
        memberPreviews,
        leadership,
        latestActions,
        mapPoint,
      } satisfies AtlasDelegation;
    })
    .sort((left, right) => {
      if (left.kind !== right.kind) {
        return left.kind === "country" ? -1 : 1;
      }

      return left.name.localeCompare(right.name);
    });
}
