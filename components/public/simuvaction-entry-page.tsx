import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { LoginForm } from "@/components/login-form";
import { NextSimulationCountdown } from "@/components/public/next-simulation-countdown";
import copyJson from "@/content/simuvaction-site-copy.json";
import {
  type MappedBlock,
  type MappedSection,
  type MappedSectionId,
  type SimuvactionSiteCopy,
  formatGeneratedAt,
  mapSimuvactionHomeContent,
  toMappedBlockKey,
} from "@/lib/public/simuvaction-copy-mapper";

const siteCopy = copyJson as SimuvactionSiteCopy;
const mappedContent = mapSimuvactionHomeContent(siteCopy);

type ObjectiveCard = {
  key: string;
  title: string;
  lines: string[];
};

type FaqItem = {
  key: string;
  question: string;
  answer: string;
};

function sectionAnchor(id: MappedSectionId): string {
  return `section-${id}`;
}

function getSection(sectionId: MappedSectionId): MappedSection {
  return (
    mappedContent.sections.find((section) => section.id === sectionId) ?? {
      id: sectionId,
      title: sectionId,
      subtitle: "",
      blocks: [],
    }
  );
}

function findLabeledValue(blocks: MappedBlock[], label: string): string | null {
  const expression = new RegExp(`^${label}\\s*\\?\\s*`, "i");
  const candidate = blocks.find((block) => expression.test(block.text));
  if (!candidate) return null;

  const stripped = candidate.text.replace(expression, "").trim();
  return stripped.length > 0 ? stripped : null;
}

function uniqueBlocks(blocks: MappedBlock[]): MappedBlock[] {
  const seen = new Set<string>();
  const output: MappedBlock[] = [];

  for (const block of blocks) {
    const key = toMappedBlockKey(block);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(block);
  }

  return output;
}

function buildFaqItems(blocks: MappedBlock[]): FaqItem[] {
  const items: FaqItem[] = [];

  for (let cursor = 0; cursor < blocks.length; cursor += 1) {
    const block = blocks[cursor];
    const text = block.text.trim();

    if (!text.endsWith("?")) continue;
    if (/^frequently asked questions$/i.test(text)) continue;

    let answer = "Details are available in the source appendix.";
    const next = blocks[cursor + 1];
    if (next && !next.text.trim().endsWith("?")) {
      answer = next.text;
    }

    items.push({
      key: toMappedBlockKey(block),
      question: text,
      answer,
    });
  }

  return items;
}

function buildObjectiveCards(blocks: MappedBlock[]): ObjectiveCard[] {
  const headingMatcher =
    /objectives:\s*create an ecosystem|an exercise for students|a way to consider collaboration|a way to develop international thinking|a way to engage with communities/i;

  const cards: ObjectiveCard[] = [];
  let currentCard: ObjectiveCard | null = null;

  for (const block of blocks) {
    if (headingMatcher.test(block.text)) {
      if (currentCard) {
        cards.push(currentCard);
      }

      currentCard = {
        key: toMappedBlockKey(block),
        title: block.text.replace(/^objectives:\s*/i, "").trim(),
        lines: [],
      };

      continue;
    }

    if (currentCard && currentCard.lines.length < 3) {
      currentCard.lines.push(block.text);
    }
  }

  if (currentCard) {
    cards.push(currentCard);
  }

  if (cards.length > 0) {
    return cards;
  }

  return blocks.slice(0, 4).map((block) => ({
    key: toMappedBlockKey(block),
    title: block.text,
    lines: [],
  }));
}

function firstMatchingText(blocks: MappedBlock[], matcher: RegExp): string | null {
  return blocks.find((block) => matcher.test(block.text))?.text ?? null;
}

function trimPrefix(value: string, matcher: RegExp): string {
  return value.replace(matcher, "").trim();
}

export function SimuvactionEntryPage() {
  const generalSection = getSection("general");
  const aboutSection = getSection("about");
  const timelineSection = getSection("timeline");
  const objectivesSection = getSection("objectives");
  const enrollmentSection = getSection("enrollment");
  const faqSection = getSection("faqs");
  const mediaSection = getSection("media");
  const contactsSection = getSection("contacts");
  const sponsorsSection = getSection("sponsors");
  const partnersSection = getSection("partners");

  const visibleSections = mappedContent.sections.filter((section) => section.blocks.length > 0);
  const visibleBlockCount = visibleSections.reduce((sum, section) => sum + section.blocks.length, 0);

  const simulationLine =
    firstMatchingText(generalSection.blocks, /\*\s*a simulation/i) ??
    "A full-scale role-based simulation on global AI governance.";
  const symposiumLine =
    firstMatchingText(generalSection.blocks, /\*\s*a symposium/i) ??
    "A companion symposium connecting academic and professional ecosystems.";
  const missionLine =
    firstMatchingText(generalSection.blocks, /opportunity for 40 university students|actively engage/i) ??
    "SimuVaction is an experiential program where students research, negotiate, and produce actionable recommendations.";

  const aboutBlocks = uniqueBlocks(aboutSection.blocks);
  const whoValue =
    findLabeledValue(aboutBlocks, "WHO") ??
    "International and interdisciplinary student teams with diverse backgrounds.";
  const whatValue =
    findLabeledValue(aboutBlocks, "WHAT") ??
    "Teams play assigned roles, debate, draft amendments, and vote policy recommendations.";
  const whenValue =
    findLabeledValue(aboutBlocks, "WHEN") ??
    "January 12, 2026 to April 24, 2026, with a key in-person sequence in March.";
  const whereValue =
    findLabeledValue(aboutBlocks, "WHERE") ??
    "Online collaboration with an in-person week in Paris-Versailles.";

  const whyPoints = aboutBlocks
    .filter((block) => /^to\s+/i.test(block.text))
    .map((block) => trimPrefix(block.text, /^to\s+/i))
    .slice(0, 4);

  const timelineBlocks = uniqueBlocks(timelineSection.blocks);
  const timelineStages = timelineBlocks.filter((block) =>
    /kick-off meeting|^stage\s+\d|action-day|\*\s*a simulation|\*\s*a symposium/i.test(block.text),
  );
  const stageThreeSchedule = timelineBlocks.filter((block) =>
    /arrival for international students|monday,\s*march|tuesday,\s*march|wednesday,\s*march|thursday,\s*march/i.test(
      block.text,
    ),
  );

  const objectiveCards = buildObjectiveCards(uniqueBlocks(objectivesSection.blocks));
  const enrollmentHighlights = uniqueBlocks(enrollmentSection.blocks)
    .map((block) => block.text)
    .filter((text) => !/^registration$/i.test(text))
    .slice(0, 6);
  const faqItems = buildFaqItems(uniqueBlocks(faqSection.blocks));

  const sponsorsItems = uniqueBlocks(sponsorsSection.blocks)
    .map((block) => block.text)
    .filter((text) => !/^sponsors/i.test(text));
  const partnerItems = uniqueBlocks(partnersSection.blocks)
    .map((block) => block.text)
    .filter((text) => !/^our\s+\d{4}\s+partners/i.test(text));
  const mediaItems = uniqueBlocks(mediaSection.blocks).map((block) => block.text);
  const contactItems = uniqueBlocks(contactsSection.blocks).map((block) => block.text);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_0%_0%,rgba(29,78,216,0.08),transparent_40%),radial-gradient(circle_at_100%_0%,rgba(15,23,42,0.08),transparent_38%),linear-gradient(180deg,#f7f9ff_0%,#eef2fb_100%)]">
      <main className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-10">
        <section className="relative overflow-hidden rounded-3xl border border-[#cad7ef] bg-white/95 shadow-[0_18px_40px_rgba(15,23,42,0.1)]">
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-100/70 blur-3xl" aria-hidden="true" />
          <div className="absolute -bottom-28 right-0 h-64 w-64 rounded-full bg-slate-200/60 blur-3xl" aria-hidden="true" />

          <div className="relative grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:p-10">
            <div className="space-y-6">
              <BrandLogo size="lg" priority />

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1d4ed8]">AI Governance Simulation Program</p>
                <h1 className="max-w-4xl font-serif text-4xl font-bold leading-tight text-[#0f172a] lg:text-5xl">
                  SimuVaction helps students understand, negotiate, and shape global AI governance.
                </h1>
                <p className="max-w-3xl text-base leading-relaxed text-slate-700">{missionLine}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#d8e2f5] bg-[#f8fbff] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Source pages</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a]">{mappedContent.pageCount}</p>
                </div>
                <div className="rounded-xl border border-[#d8e2f5] bg-[#f8fbff] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Mapped content blocks</p>
                  <p className="mt-1 text-2xl font-bold text-[#0f172a]">{visibleBlockCount}</p>
                </div>
                <div className="rounded-xl border border-[#d8e2f5] bg-[#f8fbff] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">Source extraction</p>
                  <p className="mt-1 text-sm font-semibold text-[#0f172a]">{formatGeneratedAt(mappedContent.generatedAt)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#login-anchor"
                  className="rounded-lg bg-[#1d4ed8] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#1e40af]"
                >
                  Access Platform
                </a>
                <Link
                  href={mappedContent.sourceUrl}
                  className="rounded-lg border border-[#cbd5e1] bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Source website
                </Link>
              </div>

              <NextSimulationCountdown
                eventStartIsoParis="2026-03-25T08:30:00"
                eventEndIsoParis="2026-03-25T18:00:00"
                eventLabel="Action-Day - Paris-Versailles"
              />
            </div>

            <aside
              id="login-anchor"
              className="self-start rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-[0_10px_24px_rgba(15,23,42,0.08)] lg:sticky lg:top-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Secure Login</p>
              <h2 className="mt-2 font-serif text-2xl font-bold text-[#0f172a]">Enter SimuVaction</h2>
              <p className="mt-2 text-sm text-slate-600">
                Sign in with your official account to access your role workspace, surveys, votes, and newsroom tools.
              </p>
              <div className="mt-5">
                <LoginForm />
              </div>
            </aside>
          </div>
        </section>

        <section className="rounded-2xl border border-[#cad7ef] bg-white p-5 shadow-sm lg:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Quick Navigation</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {visibleSections.map((section) => (
              <a
                key={section.id}
                href={`#${sectionAnchor(section.id)}`}
                className="rounded-full border border-[#d6dff2] bg-[#f8faff] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#93b0ea] hover:text-[#1d4ed8]"
              >
                {section.title}
              </a>
            ))}
            <a
              href="#source-appendix"
              className="rounded-full border border-[#d6dff2] bg-[#f8faff] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#93b0ea] hover:text-[#1d4ed8]"
            >
              Source Appendix
            </a>
          </div>
        </section>

        {generalSection.blocks.length > 0 ? (
          <section id={sectionAnchor("general")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">What Is SimuVaction</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">A simulation and symposium designed for real-world AI governance learning</h2>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-xl border border-[#dbe4f7] bg-[#f8faff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Simulation</p>
                <p className="mt-2 text-base font-semibold text-[#0f172a]">{simulationLine}</p>
                <p className="mt-2 text-sm text-slate-700">
                  Students assume high-responsibility roles and work through research, negotiation, drafting, amendments,
                  and policy voting.
                </p>
              </article>
              <article className="rounded-xl border border-[#dbe4f7] bg-[#f8faff] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Symposium</p>
                <p className="mt-2 text-base font-semibold text-[#0f172a]">{symposiumLine}</p>
                <p className="mt-2 text-sm text-slate-700">
                  The symposium expands the academic and professional conversation on AI and education with partners and
                  stakeholders.
                </p>
              </article>
            </div>
          </section>
        ) : null}

        {aboutSection.blocks.length > 0 ? (
          <section id={sectionAnchor("about")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Program At A Glance</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Who participates, what happens, and why it matters</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <article className="rounded-xl border border-[#dbe4f7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Who</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{whoValue}</p>
              </article>
              <article className="rounded-xl border border-[#dbe4f7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">What</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{whatValue}</p>
              </article>
              <article className="rounded-xl border border-[#dbe4f7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">When</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{whenValue}</p>
              </article>
              <article className="rounded-xl border border-[#dbe4f7] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Where</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">{whereValue}</p>
              </article>
              <article className="rounded-xl border border-[#dbe4f7] p-4 md:col-span-2 lg:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-500">Why</p>
                <ul className="mt-2 space-y-1">
                  {whyPoints.map((point) => (
                    <li key={point} className="text-sm leading-relaxed text-slate-700">
                      {point}
                    </li>
                  ))}
                  {whyPoints.length === 0 ? (
                    <li className="text-sm leading-relaxed text-slate-700">
                      To discuss AI governance, build professional capability, and collaborate across cultures.
                    </li>
                  ) : null}
                </ul>
              </article>
            </div>
          </section>
        ) : null}

        {timelineSection.blocks.length > 0 ? (
          <section id={sectionAnchor("timeline")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Timeline</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">From Kick-off to Action-Day and closing review</h2>

            <ol className="mt-5 space-y-3">
              {timelineStages.map((block) => (
                <li key={toMappedBlockKey(block)} className="rounded-xl border border-[#dbe4f7] bg-[#f8faff] px-4 py-3 text-sm text-slate-700">
                  {block.text}
                </li>
              ))}
            </ol>

            {stageThreeSchedule.length > 0 ? (
              <details className="mt-5 rounded-xl border border-[#dbe4f7] bg-[#f8faff] p-4">
                <summary className="cursor-pointer text-sm font-semibold text-[#1d4ed8]">Stage 3 in-person schedule (Paris-Versailles)</summary>
                <ul className="mt-3 space-y-2">
                  {stageThreeSchedule.map((block) => (
                    <li key={toMappedBlockKey(block)} className="text-sm text-slate-700">
                      {block.text}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </section>
        ) : null}

        {objectivesSection.blocks.length > 0 ? (
          <section id={sectionAnchor("objectives")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Objectives</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Academic impact, collaboration, and civic capability</h2>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {objectiveCards.map((card) => (
                <article key={card.key} className="rounded-xl border border-[#dbe4f7] bg-[#f8faff] p-4">
                  <h3 className="font-serif text-xl font-bold text-[#0f172a]">{card.title}</h3>
                  {card.lines.length > 0 ? (
                    <ul className="mt-3 space-y-2">
                      {card.lines.map((line) => (
                        <li key={`${card.key}::${line}`} className="text-sm leading-relaxed text-slate-700">
                          {line}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {enrollmentSection.blocks.length > 0 || faqSection.blocks.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-2">
            {enrollmentSection.blocks.length > 0 ? (
              <article id={sectionAnchor("enrollment")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Enrollment</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Participation requirements</h2>
                <ul className="mt-4 space-y-2">
                  {enrollmentHighlights.map((line) => (
                    <li key={line} className="rounded-lg border border-[#dbe4f7] bg-[#f8faff] px-3 py-2 text-sm text-slate-700">
                      {line}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {faqSection.blocks.length > 0 ? (
              <article id={sectionAnchor("faqs")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">FAQs</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Common questions</h2>
                <div className="mt-4 space-y-2">
                  {faqItems.map((item) => (
                    <details key={item.key} className="rounded-lg border border-[#dbe4f7] bg-[#f8faff] p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-[#0f172a]">{item.question}</summary>
                      <p className="mt-2 text-sm text-slate-700">{item.answer}</p>
                    </details>
                  ))}
                  {faqItems.length === 0 ? (
                    <p className="text-sm text-slate-700">FAQ details are available in the source appendix.</p>
                  ) : null}
                </div>
              </article>
            ) : null}
          </section>
        ) : null}

        {partnersSection.blocks.length > 0 ||
        sponsorsSection.blocks.length > 0 ||
        mediaSection.blocks.length > 0 ||
        contactsSection.blocks.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-2">
            {partnersSection.blocks.length > 0 ? (
              <article id={sectionAnchor("partners")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Partners</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Academic and institutional network</h2>
                <ul className="mt-4 space-y-2">
                  {partnerItems.slice(0, 14).map((item) => (
                    <li key={`partner-${item}`} className="text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {sponsorsSection.blocks.length > 0 ? (
              <article id={sectionAnchor("sponsors")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Sponsors</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Support by cycle</h2>
                <ul className="mt-4 space-y-2">
                  {sponsorsItems.slice(0, 14).map((item) => (
                    <li key={`sponsor-${item}`} className="text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {mediaSection.blocks.length > 0 ? (
              <article id={sectionAnchor("media")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Media</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Public reports and references</h2>
                <ul className="mt-4 space-y-2">
                  {mediaItems.slice(0, 16).map((item) => (
                    <li key={`media-${item}`} className="text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}

            {contactsSection.blocks.length > 0 ? (
              <article id={sectionAnchor("contacts")} className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Contacts</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Follow and connect</h2>
                <ul className="mt-4 space-y-2">
                  {contactItems.map((item) => (
                    <li key={`contact-${item}`} className="text-sm text-slate-700">
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            ) : null}
          </section>
        ) : null}

        <section id="source-appendix" className="rounded-2xl border border-[#cad7ef] bg-white p-6 shadow-sm lg:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1d4ed8]">Source Appendix</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[#0f172a]">Full source integrity and traceability</h2>
          <p className="mt-2 text-sm text-slate-600">
            This appendix preserves legacy and unmatched source blocks and keeps the full verbatim corpus accessible.
          </p>

          <details className="mt-4 rounded-xl border border-[#dbe4f7] bg-[#f8faff] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#1d4ed8]">Legacy notes ({mappedContent.legacyBlocks.length})</summary>
            <ul className="mt-3 space-y-2">
              {mappedContent.legacyBlocks.map((block) => (
                <li key={toMappedBlockKey(block)} className="text-sm text-slate-700">
                  {block.text}
                </li>
              ))}
            </ul>
          </details>

          <details className="mt-4 rounded-xl border border-[#dbe4f7] bg-[#f8faff] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#1d4ed8]">
              Unmatched but preserved blocks ({mappedContent.unmatchedBlocks.length})
            </summary>
            <ul className="mt-3 space-y-2">
              {mappedContent.unmatchedBlocks.map((block) => (
                <li key={toMappedBlockKey(block)} className="text-sm text-slate-700">
                  {block.text}
                </li>
              ))}
            </ul>
          </details>

          <details className="mt-4 rounded-xl border border-[#dbe4f7] bg-[#f8faff] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[#1d4ed8]">
              Full verbatim source copy ({mappedContent.allBlocks.length})
            </summary>
            <ul className="mt-3 space-y-2">
              {mappedContent.allBlocks.map((block) => (
                <li key={toMappedBlockKey(block)} className="rounded-lg border border-[#dbe4f7] bg-white px-3 py-2 text-sm text-slate-700">
                  <p>{block.text}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Source: {block.path}</p>
                </li>
              ))}
            </ul>
          </details>
        </section>
      </main>
    </div>
  );
}
