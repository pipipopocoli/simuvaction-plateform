import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import copyJson from "@/content/simuvaction-site-copy.json";

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

type SourceBlock = {
  text: string;
  path: string;
};

type SectionDefinition = {
  id: string;
  title: string;
  subtitle: string;
  matcher: (text: string) => boolean;
};

const siteCopy = copyJson as SimuvactionSiteCopy;

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

const legacyPatterns = [/this is a paragraph/i, /for the other universities and their own pages/i, /copyright ©/i];

const sections: SectionDefinition[] = [
  {
    id: "general",
    title: "General",
    subtitle: "Overview and framing",
    matcher: (text) =>
      /simuvaction consists/i.test(text) ||
      /simulation/i.test(text) ||
      /symposium/i.test(text) ||
      /interested students/i.test(text) ||
      /ai and education/i.test(text),
  },
  {
    id: "about",
    title: "About",
    subtitle: "Who, what, where, why",
    matcher: (text) =>
      /^who \?/i.test(text) ||
      /^what \?/i.test(text) ||
      /^where \?/i.test(text) ||
      /^why \?/i.test(text) ||
      /experiential learning program/i.test(text) ||
      /opportunity for 40 university students/i.test(text),
  },
  {
    id: "timeline",
    title: "Timeline",
    subtitle: "Stages and key dates",
    matcher: (text) =>
      /kick-off meeting/i.test(text) ||
      /stage \d/i.test(text) ||
      /from january 12, 2026 to april 24, 2026/i.test(text) ||
      /arrival for international students/i.test(text) ||
      /action-day/i.test(text),
  },
  {
    id: "objectives",
    title: "Objectives",
    subtitle: "Learning and ecosystem outcomes",
    matcher: (text) =>
      /objectives/i.test(text) ||
      /create an ecosystem/i.test(text) ||
      /active learning/i.test(text) ||
      /a way to /i.test(text) ||
      /think globally, act locally/i.test(text) ||
      /engage with communities/i.test(text),
  },
  {
    id: "enrollment",
    title: "Enrollment",
    subtitle: "Requirements and eligibility",
    matcher: (text) =>
      /registration/i.test(text) ||
      /enrollment/i.test(text) ||
      /home university/i.test(text) ||
      /certificate of attendance/i.test(text),
  },
  {
    id: "faqs",
    title: "FAQs",
    subtitle: "Operational questions",
    matcher: (text) =>
      /frequently asked questions/i.test(text) ||
      /what are the requirements to obtain the certificate of attendance/i.test(text) ||
      /what assignments should i expect/i.test(text) ||
      /what are the expectations/i.test(text) ||
      /what does the mentoring entail within the project/i.test(text) ||
      /are there awards for this project/i.test(text) ||
      /what if i have zero experience in negotiation/i.test(text) ||
      /if i were to participate, how much would i have to pay/i.test(text) ||
      /is it open to all students/i.test(text) ||
      /how does enrollment work/i.test(text),
  },
  {
    id: "media",
    title: "Media",
    subtitle: "References and publications",
    matcher: (text) =>
      /^media$/i.test(text) ||
      /see the video/i.test(text) ||
      /see the slideshow/i.test(text) ||
      /see the clip/i.test(text) ||
      /see the article/i.test(text) ||
      /emory report/i.test(text),
  },
  {
    id: "contacts",
    title: "Contacts",
    subtitle: "Follow and communication",
    matcher: (text) => /^contacts$/i.test(text) || /follow us/i.test(text) || /simuvaction\.bsky\.social/i.test(text),
  },
  {
    id: "sponsors",
    title: "Sponsors",
    subtitle: "Sponsor cohorts",
    matcher: (text) => /sponsors/i.test(text) || /^2023-2024$/i.test(text) || /^2022-2023$/i.test(text),
  },
  {
    id: "partners",
    title: "Partners",
    subtitle: "Academic and institutional partners",
    matcher: (text) =>
      /partners and stakeholders/i.test(text) ||
      /our 2023 partners/i.test(text) ||
      /our 2022 partners/i.test(text) ||
      /^emory university$/i.test(text) ||
      /^unitar$/i.test(text) ||
      /^georgia tech$/i.test(text) ||
      /^other university$/i.test(text),
  },
];

function normalizeText(value: string) {
  return value.replace(/\u200b/g, "").replace(/\s+/g, " ").trim();
}

function isDisplayNoise(text: string) {
  if (!text) {
    return true;
  }
  if (NAV_AND_CHROME_TEXT.has(text)) {
    return true;
  }
  if (/^[\u200b\s·•\-–—]+$/.test(text)) {
    return true;
  }
  return false;
}

function toBlocks(data: SimuvactionSiteCopy): SourceBlock[] {
  const blocks: SourceBlock[] = [];
  for (const page of data.pages) {
    for (const rawText of page.blocks) {
      blocks.push({
        text: normalizeText(rawText),
        path: page.path,
      });
    }
  }
  return blocks;
}

function uniqueByTextWithSource(blocks: SourceBlock[]) {
  const seen = new Set<string>();
  const out: SourceBlock[] = [];
  for (const block of blocks) {
    const key = `${block.path}::${block.text}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    out.push(block);
  }
  return out;
}

function classify(blocks: SourceBlock[]) {
  const sectionBuckets = new Map<string, SourceBlock[]>();
  for (const section of sections) {
    sectionBuckets.set(section.id, []);
  }
  const legacy: SourceBlock[] = [];

  for (const block of blocks) {
    if (!block.text) {
      continue;
    }
    if (legacyPatterns.some((pattern) => pattern.test(block.text))) {
      legacy.push(block);
      continue;
    }
    if (isDisplayNoise(block.text)) {
      continue;
    }
    const section = sections.find((candidate) => candidate.matcher(block.text));
    if (section) {
      sectionBuckets.get(section.id)?.push(block);
    } else {
      sectionBuckets.get("general")?.push(block);
    }
  }

  return { sectionBuckets, legacy };
}

function formatGeneratedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
}

export function SimuvactionEntryPage() {
  const allBlocks = uniqueByTextWithSource(toBlocks(siteCopy));
  const { sectionBuckets, legacy } = classify(allBlocks);
  const renderedSections = sections
    .map((section) => ({
      ...section,
      blocks: sectionBuckets.get(section.id) ?? [],
    }))
    .filter((section) => section.blocks.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f7f3] to-[#eef2f7]">
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
        <section className="rounded-2xl border border-[#d9deea] bg-white/95 p-6 shadow-[0_14px_35px_rgba(15,23,42,0.1)] lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <BrandLogo size="lg" priority />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
                SimuVaction — Official Public Information
              </p>
              <h1 className="font-serif text-4xl font-bold leading-tight text-[#111827] lg:text-5xl">
                Simulation, innovation, and action in AI governance and education.
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-zinc-700">
                This page consolidates the complete SimuVaction public copy in a structured format while preserving full
                source text access.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e4e7ef] bg-[#f9fbff] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Source pages</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{siteCopy.pages.length}</p>
                </div>
                <div className="rounded-xl border border-[#e4e7ef] bg-[#f9fbff] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Display blocks</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">
                    {renderedSections.reduce((acc, section) => acc + section.blocks.length, 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e4e7ef] bg-[#f9fbff] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Extracted</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{formatGeneratedAt(siteCopy.generatedAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#login-anchor"
                  className="rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-blue-900"
                >
                  Connect to platform
                </a>
                <Link
                  href={siteCopy.sourceUrl}
                  className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Open source website
                </Link>
              </div>
            </div>

            <aside
              id="login-anchor"
              className="rounded-2xl border border-[#dbe1ee] bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.08)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Connexion</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-zinc-900">Secure access</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Access student and staff areas using your SimuVaction credentials.
              </p>
              <div className="mt-4">
                <LoginForm />
              </div>
            </aside>
          </div>
        </section>

        <section className="space-y-4">
          {renderedSections.map((section, index) => (
            <article key={section.id} className="rounded-2xl border border-[#d9deea] bg-white p-4 shadow-sm lg:p-5">
              <details open={index < 2}>
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{section.title}</p>
                      <h3 className="mt-1 font-serif text-2xl font-bold text-zinc-900">{section.subtitle}</h3>
                    </div>
                    <span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-xs font-semibold text-[#1E3A8A]">
                      {section.blocks.length} blocks
                    </span>
                  </div>
                </summary>
                <ul className="mt-4 space-y-2 text-sm leading-relaxed text-zinc-800">
                  {section.blocks.map((block, blockIndex) => (
                    <li key={`${section.id}-${block.path}-${blockIndex}`} className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-2">
                      <p>{block.text}</p>
                      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">
                        Source {block.path}
                      </p>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          ))}
        </section>

        {legacy.length > 0 ? (
          <section className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
            <h2 className="font-serif text-2xl font-bold text-amber-900">Legacy source notes</h2>
            <p className="mt-2 text-sm text-amber-800">
              Preserved verbatim from source pages, including placeholder/editorial leftover content.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-amber-900">
              {legacy.map((block, index) => (
                <li key={`legacy-${block.path}-${index}`} className="rounded-lg border border-amber-200 bg-white/80 px-3 py-2">
                  <p>{block.text}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-amber-700">
                    Source {block.path}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="rounded-2xl border border-[#d9deea] bg-white p-5">
          <details>
            <summary className="cursor-pointer list-none text-sm font-semibold uppercase tracking-[0.1em] text-zinc-700">
              Full verbatim source copy ({allBlocks.length} blocks)
            </summary>
            <p className="mt-3 text-sm text-zinc-600">
              Complete extracted text from all locked source pages, including navigation/chrome text.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-800">
              {allBlocks.map((block, index) => (
                <li key={`verbatim-${block.path}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-2">
                  <p>{block.text || " "}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-zinc-500">Source {block.path}</p>
                </li>
              ))}
            </ul>
          </details>
        </section>
      </main>
    </div>
  );
}
