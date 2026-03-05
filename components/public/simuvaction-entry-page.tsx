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

const LEGACY_PATTERNS = [/this is a paragraph/i, /for the other universities and their own pages/i, /copyright ©/i];

const SECTIONS: SectionDefinition[] = [
  {
    id: "general",
    title: "General",
    subtitle: "Program overview and positioning",
    matcher: (text) =>
      /simuvaction consists/i.test(text) ||
      /interested students/i.test(text) ||
      /simulation - innovation - action/i.test(text) ||
      /a simulation/i.test(text) ||
      /a symposium/i.test(text),
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
      /experiential learning program/i.test(text),
  },
  {
    id: "timeline",
    title: "Timeline",
    subtitle: "Stages, dates, and D-Day sequence",
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
    subtitle: "Ecosystem and learning outcomes",
    matcher: (text) =>
      /objectives/i.test(text) ||
      /create an ecosystem/i.test(text) ||
      /active learning/i.test(text) ||
      /a way to /i.test(text) ||
      /think globally, act locally/i.test(text),
  },
  {
    id: "enrollment",
    title: "Enrollment",
    subtitle: "Eligibility and operational requirements",
    matcher: (text) =>
      /registration/i.test(text) ||
      /enrollment/i.test(text) ||
      /certificate of attendance/i.test(text) ||
      /home university/i.test(text),
  },
  {
    id: "faqs",
    title: "FAQs",
    subtitle: "Common questions answered",
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
    subtitle: "Videos, reports, and publications",
    matcher: (text) =>
      /^media$/i.test(text) ||
      /see the video/i.test(text) ||
      /see the slideshow/i.test(text) ||
      /see the clip/i.test(text) ||
      /see the article/i.test(text),
  },
  {
    id: "contacts",
    title: "Contacts",
    subtitle: "Follow and outreach channels",
    matcher: (text) => /^contacts$/i.test(text) || /follow us/i.test(text) || /simuvaction\.bsky\.social/i.test(text),
  },
  {
    id: "sponsors",
    title: "Sponsors",
    subtitle: "Sponsor cohorts by cycle",
    matcher: (text) => /sponsors/i.test(text) || /^2023-2024$/i.test(text) || /^2022-2023$/i.test(text),
  },
  {
    id: "partners",
    title: "Partners",
    subtitle: "Academic and institutional participants",
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
  if (!text) return true;
  if (NAV_AND_CHROME_TEXT.has(text)) return true;
  if (/^[\s\-–—•·]+$/.test(text)) return true;
  if (text === "​" || text === "​ ​" || text === "​ ​​​") return true;
  return false;
}

function toBlocks(data: SimuvactionSiteCopy): SourceBlock[] {
  return data.pages.flatMap((page) =>
    page.blocks.map((text) => ({
      text: normalizeText(text),
      path: page.path,
    })),
  );
}

function dedupeByPathAndText(blocks: SourceBlock[]) {
  const seen = new Set<string>();
  const output: SourceBlock[] = [];
  for (const block of blocks) {
    const key = `${block.path}::${block.text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(block);
  }
  return output;
}

function classifyBlocks(blocks: SourceBlock[]) {
  const buckets = new Map<string, SourceBlock[]>();
  for (const section of SECTIONS) buckets.set(section.id, []);

  const legacy: SourceBlock[] = [];
  const unmatched: SourceBlock[] = [];

  for (const block of blocks) {
    if (!block.text) continue;
    if (LEGACY_PATTERNS.some((pattern) => pattern.test(block.text))) {
      legacy.push(block);
      continue;
    }
    if (isDisplayNoise(block.text)) {
      continue;
    }
    const section = SECTIONS.find((candidate) => candidate.matcher(block.text));
    if (section) {
      buckets.get(section.id)?.push(block);
      continue;
    }
    unmatched.push(block);
  }

  return { buckets, legacy, unmatched };
}

function formatGeneratedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
}

function sectionAnchor(id: string) {
  return `section-${id}`;
}

export function SimuvactionEntryPage() {
  const allBlocks = dedupeByPathAndText(toBlocks(siteCopy));
  const { buckets, legacy, unmatched } = classifyBlocks(allBlocks);
  const renderedSections = SECTIONS.map((section) => ({
    ...section,
    blocks: buckets.get(section.id) ?? [],
  })).filter((section) => section.blocks.length > 0);
  const curatedCount = renderedSections.reduce((acc, section) => acc + section.blocks.length, 0);

  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        <section className="overflow-hidden rounded-3xl border border-[#d8deec] bg-white shadow-[0_14px_32px_rgba(15,23,42,0.08)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">
            <div className="space-y-5 p-6 lg:p-8">
              <BrandLogo size="lg" priority />
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">SimuVaction · Public Entry</p>
              <h1 className="font-serif text-4xl font-bold leading-tight text-[#0f172a] lg:text-5xl">
                AI governance simulation with complete public program information.
              </h1>
              <p className="max-w-3xl text-base text-zinc-700">
                Version propre et structurée du contenu public SimuVaction, avec conservation intégrale des textes
                sources accessibles en bas de page.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e3e7f2] bg-[#f8faff] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Pages sources</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{siteCopy.pages.length}</p>
                </div>
                <div className="rounded-xl border border-[#e3e7f2] bg-[#f8faff] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Blocs affichés</p>
                  <p className="mt-1 text-xl font-bold text-zinc-900">{curatedCount}</p>
                </div>
                <div className="rounded-xl border border-[#e3e7f2] bg-[#f8faff] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Extraction</p>
                  <p className="mt-1 text-sm font-semibold text-zinc-900">{formatGeneratedAt(siteCopy.generatedAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {renderedSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${sectionAnchor(section.id)}`}
                    className="rounded-full border border-[#d7deef] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] transition hover:border-[#1E3A8A]/40"
                  >
                    {section.title}
                  </a>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#login-anchor"
                  className="rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-blue-900"
                >
                  Se connecter
                </a>
                <Link
                  href={siteCopy.sourceUrl}
                  className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                >
                  Site source
                </Link>
              </div>
            </div>

            <aside
              id="login-anchor"
              className="border-t border-[#d8deec] bg-gradient-to-b from-[#f9fbff] to-white p-6 lg:border-l lg:border-t-0 lg:p-8"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Connexion</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-zinc-900">Accès sécurisé</h2>
              <p className="mt-2 text-sm text-zinc-600">Utilise tes identifiants SimuVaction pour entrer sur la plateforme.</p>
              <div className="mt-5">
                <LoginForm />
              </div>
            </aside>
          </div>
        </section>

        <section className="space-y-4">
          {renderedSections.map((section) => (
            <article key={section.id} id={sectionAnchor(section.id)} className="rounded-2xl border border-[#d8deec] bg-white p-4 shadow-sm lg:p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{section.title}</p>
                  <h3 className="mt-1 font-serif text-2xl font-bold text-zinc-900">{section.subtitle}</h3>
                </div>
                <span className="rounded-full bg-[#edf2ff] px-2.5 py-1 text-xs font-semibold text-[#1E3A8A]">
                  {section.blocks.length} blocs
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {section.blocks.slice(0, 8).map((block, index) => (
                  <li key={`${section.id}-preview-${block.path}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-zinc-800">
                    {block.text}
                  </li>
                ))}
              </ul>

              {section.blocks.length > 8 ? (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-semibold text-[#1E3A8A]">
                    Voir le reste ({section.blocks.length - 8} blocs)
                  </summary>
                  <ul className="mt-3 space-y-2">
                    {section.blocks.slice(8).map((block, index) => (
                      <li key={`${section.id}-full-${block.path}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-zinc-800">
                        {block.text}
                      </li>
                    ))}
                  </ul>
                </details>
              ) : null}
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-[#d8deec] bg-white p-4 shadow-sm lg:p-5">
          <h2 className="font-serif text-2xl font-bold text-zinc-900">Source integrity</h2>
          <p className="mt-2 text-sm text-zinc-600">
            Sections techniques pour garantir l’intégralité de l’information source.
          </p>

          {legacy.length > 0 ? (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
                Legacy source notes ({legacy.length})
              </summary>
              <ul className="mt-3 space-y-2">
                {legacy.map((block, index) => (
                  <li key={`legacy-${block.path}-${index}`} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {block.text}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          {unmatched.length > 0 ? (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
                Unmatched but preserved blocks ({unmatched.length})
              </summary>
              <ul className="mt-3 space-y-2">
                {unmatched.map((block, index) => (
                  <li key={`unmatched-${block.path}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                    {block.text}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}

          <details className="mt-4">
            <summary className="cursor-pointer text-sm font-semibold text-zinc-800">
              Full verbatim source copy ({allBlocks.length})
            </summary>
            <ul className="mt-3 space-y-2">
              {allBlocks.map((block, index) => (
                <li key={`verbatim-${block.path}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800">
                  <p>{block.text}</p>
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
