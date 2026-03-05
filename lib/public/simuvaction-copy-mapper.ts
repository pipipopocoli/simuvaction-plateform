export type SimuvactionSourcePage = {
  sourceUrl: string;
  path: string;
  title: string;
  blocks: string[];
};

export type SimuvactionSiteCopy = {
  generatedAt: string;
  sourceUrl: string;
  pages: SimuvactionSourcePage[];
};

export type MappedSectionId =
  | "general"
  | "about"
  | "timeline"
  | "objectives"
  | "enrollment"
  | "faqs"
  | "media"
  | "contacts"
  | "sponsors"
  | "partners";

export type MappedBlock = {
  text: string;
  path: string;
};

export type MappedSection = {
  id: MappedSectionId;
  title: string;
  subtitle: string;
  blocks: MappedBlock[];
};

export type MappedHomeContent = {
  generatedAt: string;
  sourceUrl: string;
  pageCount: number;
  allBlocks: MappedBlock[];
  legacyBlocks: MappedBlock[];
  unmatchedBlocks: MappedBlock[];
  sections: MappedSection[];
};

const NAV_AND_CHROME_TEXT = new Set([
  "Home",
  "General",
  "About",
  "Our partners and stakeholders",
  "Timeline",
  "Objectives and Benefits",
  "Sponsors",
  "2023 Partners",
  "2022 Partners",
  "Enrollment",
  "FAQs",
  "Media",
  "Contacts",
  "More...",
]);

const LEGACY_PATTERNS = [
  /this is a paragraph/i,
  /for the other universities and their own pages/i,
  /copyright ©/i,
];

type SectionDefinition = {
  id: MappedSectionId;
  title: string;
  subtitle: string;
  matchers: RegExp[];
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
  {
    id: "general",
    title: "General",
    subtitle: "Program overview and strategic context",
    matchers: [
      /simuvaction consists/i,
      /simulation - innovation - action/i,
      /\* a simulation/i,
      /\* a symposium/i,
      /opportunity for 40 university students/i,
    ],
  },
  {
    id: "about",
    title: "About",
    subtitle: "Who, what, when, where, and why",
    matchers: [
      /^who \?/i,
      /^what \?/i,
      /^when \?/i,
      /^where \?/i,
      /^why \?/i,
      /experiential learning program/i,
      /think globally, act locally/i,
    ],
  },
  {
    id: "timeline",
    title: "Timeline",
    subtitle: "Stages, milestones, and Action-Day sequence",
    matchers: [
      /kick-off meeting/i,
      /^stage \d/i,
      /from january 12, 2026 to april 24, 2026/i,
      /what is the program during stage 3/i,
      /arrival for international students/i,
      /action-day/i,
      /wednesday, march 25/i,
    ],
  },
  {
    id: "objectives",
    title: "Objectives",
    subtitle: "Learning outcomes and ecosystem impact",
    matchers: [
      /objectives/i,
      /create an ecosystem/i,
      /active learning/i,
      /a way to consider collaboration/i,
      /a way to develop international thinking/i,
      /a way to engage with communities/i,
    ],
  },
  {
    id: "enrollment",
    title: "Enrollment",
    subtitle: "Eligibility and participation requirements",
    matchers: [
      /registration/i,
      /enrollment/i,
      /certificate of attendance/i,
      /home university/i,
      /requirements/i,
    ],
  },
  {
    id: "faqs",
    title: "FAQs",
    subtitle: "Frequently asked questions",
    matchers: [
      /frequently asked questions/i,
      /is it conceived as a course/i,
      /what are the requirements to obtain the certificate of attendance/i,
      /what assignments should i expect/i,
      /what are the expectations/i,
      /what does the mentoring entail/i,
      /what if i have zero experience in negotiation/i,
      /if i were to participate, how much would i have to pay/i,
      /is it open to all students/i,
      /how does enrollment work/i,
    ],
  },
  {
    id: "media",
    title: "Media",
    subtitle: "Videos, reports, and public articles",
    matchers: [
      /^media$/i,
      /see the video/i,
      /see the slideshow/i,
      /see the clip/i,
      /see the article/i,
      /simuvaction on ai/i,
    ],
  },
  {
    id: "contacts",
    title: "Contacts",
    subtitle: "Official channels and outreach",
    matchers: [
      /^contacts$/i,
      /^follow us$/i,
      /simuvaction\.bsky\.social/i,
      /let's get in touch/i,
    ],
  },
  {
    id: "sponsors",
    title: "Sponsors",
    subtitle: "Sponsor cohorts by academic cycle",
    matchers: [
      /^sponsors/i,
      /^2025-2026$/i,
      /^2023-2024$/i,
      /^2022-2023$/i,
      /^2021-2022$/i,
      /^2020-2021$/i,
      /^2019-2020$/i,
      /^2018-2019$/i,
    ],
  },
  {
    id: "partners",
    title: "Partners",
    subtitle: "Academic and institutional partners",
    matchers: [
      /partners and stakeholders/i,
      /our 2023 partners/i,
      /our 2022 partners/i,
      /^emory university$/i,
      /^unitar$/i,
      /^georgia tech$/i,
      /^comillas pontifical university$/i,
      /^other university$/i,
    ],
  },
];

function normalizeText(value: string): string {
  return value.replace(/\u200b/g, "").replace(/\s+/g, " ").trim();
}

function isDisplayNoise(text: string): boolean {
  if (!text) return true;
  if (NAV_AND_CHROME_TEXT.has(text)) return true;
  if (/^[\s\-–—•·]+$/.test(text)) return true;
  if (text === "​" || text === "​ ​" || text === "​ ​​​") return true;
  return false;
}

function toBlocks(data: SimuvactionSiteCopy): MappedBlock[] {
  return data.pages.flatMap((page) =>
    page.blocks.map((text) => ({
      text: normalizeText(text),
      path: page.path,
    })),
  );
}

function dedupeByPathAndText(blocks: MappedBlock[]): MappedBlock[] {
  const seen = new Set<string>();
  const output: MappedBlock[] = [];

  for (const block of blocks) {
    const key = `${block.path}::${block.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(block);
  }

  return output;
}

function classifyBlocks(blocks: MappedBlock[]): {
  sections: MappedSection[];
  legacyBlocks: MappedBlock[];
  unmatchedBlocks: MappedBlock[];
} {
  const sectionMap = new Map<MappedSectionId, MappedBlock[]>();
  for (const section of SECTION_DEFINITIONS) {
    sectionMap.set(section.id, []);
  }

  const legacyBlocks: MappedBlock[] = [];
  const unmatchedBlocks: MappedBlock[] = [];

  for (const block of blocks) {
    if (!block.text) continue;

    if (LEGACY_PATTERNS.some((pattern) => pattern.test(block.text))) {
      legacyBlocks.push(block);
      continue;
    }

    if (isDisplayNoise(block.text)) {
      continue;
    }

    const section = SECTION_DEFINITIONS.find((candidate) =>
      candidate.matchers.some((matcher) => matcher.test(block.text)),
    );

    if (section) {
      sectionMap.get(section.id)?.push(block);
    } else {
      unmatchedBlocks.push(block);
    }
  }

  const sections = SECTION_DEFINITIONS.map((definition) => ({
    id: definition.id,
    title: definition.title,
    subtitle: definition.subtitle,
    blocks: sectionMap.get(definition.id) ?? [],
  }));

  return { sections, legacyBlocks, unmatchedBlocks };
}

export function mapSimuvactionHomeContent(copy: SimuvactionSiteCopy): MappedHomeContent {
  const allBlocks = dedupeByPathAndText(toBlocks(copy));
  const { sections, legacyBlocks, unmatchedBlocks } = classifyBlocks(allBlocks);

  return {
    generatedAt: copy.generatedAt,
    sourceUrl: copy.sourceUrl,
    pageCount: copy.pages.length,
    allBlocks,
    legacyBlocks,
    unmatchedBlocks,
    sections,
  };
}

export function formatGeneratedAt(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;

  return parsed.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export function toMappedBlockKey(block: MappedBlock): string {
  return `${block.path}::${block.text}`;
}

