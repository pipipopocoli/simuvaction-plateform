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
  description: string;
  matcher: (text: string) => boolean;
};

const siteCopy = copyJson as SimuvactionSiteCopy;

const legacyPatterns = [
  /this is a paragraph/i,
  /for the other universities and their own pages/i,
  /copyright ©/i,
];

const sectionDefinitions: SectionDefinition[] = [
  {
    id: "general",
    title: "General",
    description: "Core narrative and public framing of SimuVaction.",
    matcher: (text) =>
      /^home$/i.test(text) ||
      /^general$/i.test(text) ||
      /simuvaction consists/i.test(text) ||
      /\* a simulation/i.test(text) ||
      /\* a symposium/i.test(text) ||
      /ai and education/i.test(text),
  },
  {
    id: "about",
    title: "About",
    description: "Program mission, audience, format, and educational intent.",
    matcher: (text) =>
      /who \?/i.test(text) ||
      /what \?/i.test(text) ||
      /where \?/i.test(text) ||
      /why \?/i.test(text) ||
      /experiential learning program/i.test(text) ||
      /opportunity for 40 university students/i.test(text),
  },
  {
    id: "timeline",
    title: "Timeline",
    description: "Schedule milestones, stages, and in-person week agenda.",
    matcher: (text) =>
      /timeline/i.test(text) ||
      /kick-off meeting/i.test(text) ||
      /stage \d/i.test(text) ||
      /arrival for international students/i.test(text) ||
      /action-day/i.test(text) ||
      /from january 12, 2026 to april 24, 2026/i.test(text),
  },
  {
    id: "objectives",
    title: "Objectives",
    description: "Program objectives and ecosystem outcomes.",
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
    description: "Eligibility and enrollment requirements.",
    matcher: (text) =>
      /enrollment/i.test(text) ||
      /registration/i.test(text) ||
      /certificate of attendance/i.test(text) ||
      /home university/i.test(text),
  },
  {
    id: "faqs",
    title: "FAQs",
    description: "Frequently asked questions and operational answers.",
    matcher: (text) =>
      /frequently asked questions/i.test(text) ||
      /^is it conceived as a course\?/i.test(text) ||
      /^what are the requirements to obtain the certificate of attendance\?/i.test(text) ||
      /^what assignments should i expect\?/i.test(text) ||
      /^what are the expectations\?/i.test(text) ||
      /^what does the mentoring entail within the project\?/i.test(text) ||
      /^are there awards for this project\?/i.test(text) ||
      /^what if i have zero experience in negotiation\?/i.test(text) ||
      /^if i were to participate, how much would i have to pay\?/i.test(text) ||
      /^is it open to all students\?/i.test(text) ||
      /^which universities are partners to the program/i.test(text) ||
      /^how does enrollment work\?/i.test(text) ||
      /^upon completion of the program/i.test(text),
  },
  {
    id: "media",
    title: "Media",
    description: "Published media references and external mentions.",
    matcher: (text) =>
      /^media$/i.test(text) ||
      /see the video/i.test(text) ||
      /see the slideshow/i.test(text) ||
      /see the article/i.test(text) ||
      /emory report/i.test(text) ||
      /consulat général de france/i.test(text),
  },
  {
    id: "contacts",
    title: "Contacts",
    description: "Follow-up channels and contact entry points.",
    matcher: (text) =>
      /^contacts$/i.test(text) ||
      /follow us/i.test(text) ||
      /simuvaction\.bsky\.social/i.test(text),
  },
  {
    id: "sponsors",
    title: "Sponsors",
    description: "Sponsor references by yearly cohort.",
    matcher: (text) =>
      /sponsors/i.test(text) ||
      /^2023-2024$/i.test(text) ||
      /^2022-2023$/i.test(text),
  },
  {
    id: "partners",
    title: "Partners",
    description: "Academic and stakeholder partner references.",
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

function normalizeText(text: string) {
  return text.trim();
}

function toSourceBlocks(data: SimuvactionSiteCopy): SourceBlock[] {
  return data.pages.flatMap((page) =>
    page.blocks.map((text) => ({
      text: normalizeText(text),
      path: page.path,
    })),
  );
}

function classifyBlocks(blocks: SourceBlock[]) {
  const buckets = new Map<string, SourceBlock[]>();
  for (const section of sectionDefinitions) {
    buckets.set(section.id, []);
  }
  const legacy: SourceBlock[] = [];

  for (const block of blocks) {
    if (legacyPatterns.some((pattern) => pattern.test(block.text))) {
      legacy.push(block);
      continue;
    }

    const match = sectionDefinitions.find((section) => section.matcher(block.text));
    if (!match) {
      buckets.get("general")?.push(block);
      continue;
    }

    buckets.get(match.id)?.push(block);
  }

  return { buckets, legacy };
}

function formatGeneratedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
}

export function SimuvactionEntryPage() {
  const sourceBlocks = toSourceBlocks(siteCopy);
  const { buckets, legacy } = classifyBlocks(sourceBlocks);
  const renderedSections = sectionDefinitions
    .map((section) => ({
      ...section,
      blocks: buckets.get(section.id) ?? [],
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
                Simulation + Symposium platform for AI governance and education.
              </h1>
              <p className="max-w-3xl text-base leading-relaxed text-zinc-700">
                This page consolidates the complete text extracted from the SimuVaction public website, organized by
                theme and kept verbatim.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e4e7ef] bg-[#f9fbff] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Source pages</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{siteCopy.pages.length}</p>
                </div>
                <div className="rounded-xl border border-[#e4e7ef] bg-[#f9fbff] px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Text blocks</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{sourceBlocks.length}</p>
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
                      <h3 className="mt-1 font-serif text-2xl font-bold text-zinc-900">{section.description}</h3>
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
              Preserved verbatim from source pages, including legacy/placeholder editor content.
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
      </main>
    </div>
  );
}
