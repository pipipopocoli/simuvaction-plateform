"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const PRINCIPLES = [
  {
    num: 1,
    title: "Human-Centredness",
    text: "Equity, non-discrimination, transparency, accountability, and responsible data stewardship.",
  },
  {
    num: 2,
    title: "Balanced Governance",
    text: "We reject the binary of \u201cno regulation\u201d vs. \u201ctotal restriction.\u201d We support tiered risk frameworks and mandatory Human Rights and Equity Impact Assessments (HRIA).",
  },
  {
    num: 3,
    title: "Responsible Innovation",
    text: "AI can accelerate personalized learning, yet we challenge the tech-solutionist view by highlighting algorithmic bias, privacy infringement, and the erosion of pedagogical trust.",
  },
  {
    num: 4,
    title: "Evidence-Based Research",
    text: "Long-term research via open consortia. Privacy-by-design and universal design standards, especially for sensitive biometric data and accessibility tools.",
  },
  {
    num: 5,
    title: "Interoperability & Green AI",
    text: "Industrial development must adhere to open standards and environmental sustainability. We oppose monopolistic commercial lock-in.",
  },
  {
    num: 6,
    title: "SDG 4 \u2014 Quality Education",
    text: "Advance inclusive and equitable quality education and co-create trustworthy AI ecosystems.",
  },
  {
    num: 7,
    title: "Transnational Coordination",
    text: "Operate as a transnational coordinating body, aligning global standards in cooperation with UNESCO, the OECD, and regional education ministries.",
  },
];

const RED_LINES = [
  {
    boundary: "Commercial Resale of Data",
    consequence:
      "No framework that allows the commercial resale of educational behavioral data. Student information is a public trust, not a commercial asset.",
  },
  {
    boundary: "Live Biometric Surveillance",
    consequence:
      "Block agreements permitting real-time facial recognition, affective surveillance, or emotion analytics in classrooms until demonstrably safe.",
  },
  {
    boundary: "Social Scoring",
    consequence:
      "Immediate ban on social-scoring or behavioral-ranking systems in educational environments.",
  },
  {
    boundary: "Black-Box Final Decisions",
    consequence:
      "No systems dictating critical decisions (admissions, discipline, grading) without mandatory human review and appeal procedures.",
  },
];

const OBJECTIVES = [
  "Securing commitments for public funding of open-source educational AI projects and joint capacity-building programs for policymakers and teachers.",
  "Mandatory, publicly accessible Human Rights and Equity Impact Assessment (HRIA) reports for all educational AI procurement.",
  "Agreement to establish National Councils for AI in Education to ensure localized, multistakeholder oversight.",
];

const BASKETS = [
  {
    num: 1,
    name: "Access & Equity",
    focus: "Infrastructure, local languages, open-source funding",
  },
  {
    num: 2,
    name: "Safeguards & Governance",
    focus: "HRIAs, data fiduciaries, child protection",
  },
  {
    num: 3,
    name: "Innovation & Flexibility",
    focus: "IP safe harbors, regulatory sandboxes, national implementation discretion",
  },
];

export function SimuvactionEntryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/simuvaction-logo.png"
              alt="SimuVaction"
              width={160}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#declaration" className="text-sm font-medium text-gray-600 transition hover:text-[#511E84]">
              Declaration
            </a>
            <a href="#principles" className="text-sm font-medium text-gray-600 transition hover:text-[#511E84]">
              Principles
            </a>
            <a href="#red-lines" className="text-sm font-medium text-gray-600 transition hover:text-[#511E84]">
              Red Lines
            </a>
            <a href="#objectives" className="text-sm font-medium text-gray-600 transition hover:text-[#511E84]">
              Objectives
            </a>
            <Link
              href="/login"
              className="rounded-full bg-[#511E84] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3d1663]"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-gray-600 md:hidden"
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#declaration" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600">Declaration</a>
              <a href="#principles" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600">Principles</a>
              <a href="#red-lines" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600">Red Lines</a>
              <a href="#objectives" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600">Objectives</a>
              <Link href="/login" className="mt-2 rounded-full bg-[#511E84] px-5 py-2 text-center text-sm font-semibold text-white">
                Sign In
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#511E84] via-[#3d1663] to-[#1a1a2e] px-6 py-24 text-center text-white md:py-32">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-[#9ADBE8] blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-[#511E84] blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#9ADBE8]">
            <span className="h-2 w-2 rounded-full bg-[#9ADBE8]" />
            Versailles &mdash; March 25, 2026
          </div>
          <h1 className="font-serif text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            SimuVaction on AI
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/70 md:text-xl">
            Global Consortium for Trusted Artificial Intelligence
          </p>
          <p className="mx-auto mt-2 max-w-lg text-sm text-white/50">
            A multistakeholder initiative bridging research, policy, and practice for human-centred AI in education.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="#declaration"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#511E84] transition hover:bg-gray-100"
            >
              Read the Declaration
            </a>
            <Link
              href="/login"
              className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ===== DECLARATION INTRO ===== */}
      <section id="declaration" className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#511E84]">
          Position Paper
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#1a1a2e] md:text-4xl">
          Advancing Human-Centred AI for Inclusive Education
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-600">
          <p>
            The Global Consortium for Trusted Artificial Intelligence (GCTAI) submits this paper to contribute to
            SimuVaction 2026&rsquo;s global discussions on the use of Artificial Intelligence in education.
          </p>
          <p>
            GCTAI is a multistakeholder initiative that connects research, policy, and practice. It promotes the
            development and use of AI based on human rights, inclusion, access, and democratic values.
          </p>
          <p>
            We reaffirm that AI in education must support Sustainable Development Goal 4: inclusive and equitable
            quality education for all.
          </p>
        </div>
      </section>

      {/* ===== PRINCIPLES ===== */}
      <section id="principles" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#511E84]">
            Core Stance
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#1a1a2e] md:text-4xl">
            First Principles
          </h2>
          <p className="mt-3 max-w-2xl text-base text-gray-500">
            Seven non-negotiable principles guiding GCTAI&rsquo;s position on AI governance in education.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div
                key={p.num}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#9ADBE8] hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#511E84]/10 text-sm font-bold text-[#511E84]">
                  {p.num}
                </div>
                <h3 className="text-base font-bold text-[#1a1a2e]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== RED LINES ===== */}
      <section id="red-lines" className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-red-600">
          Non-Negotiable Boundaries
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#1a1a2e] md:text-4xl">
          Red Lines
        </h2>
        <p className="mt-3 max-w-2xl text-base text-gray-500">
          Strict boundaries regarding data and surveillance to protect learners.
        </p>

        <div className="mt-10 space-y-4">
          {RED_LINES.map((rl) => (
            <div
              key={rl.boundary}
              className="rounded-xl border border-red-100 bg-red-50/50 p-6"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600">
                  &#10005;
                </div>
                <div>
                  <h3 className="font-bold text-[#1a1a2e]">{rl.boundary}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{rl.consequence}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== OBJECTIVES ===== */}
      <section id="objectives" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#511E84]">
            Terms of Satisfaction
          </div>
          <h2 className="font-serif text-3xl font-bold text-[#1a1a2e] md:text-4xl">
            The Global Ethical Compact
          </h2>
          <p className="mt-3 max-w-2xl text-base text-gray-500">
            The Secretariat will consider the negotiations successful if these deliverables are secured.
          </p>

          <div className="mt-10 space-y-4">
            {OBJECTIVES.map((obj, i) => (
              <div
                key={i}
                className="flex gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#511E84] text-sm font-bold text-white">
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{obj}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== NEGOTIATION BASKETS ===== */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#511E84]">
          Organization
        </div>
        <h2 className="font-serif text-3xl font-bold text-[#1a1a2e] md:text-4xl">
          Negotiation Tracks
        </h2>
        <p className="mt-3 max-w-2xl text-base text-gray-500">
          Negotiations compartmentalized into three concurrent tracks for interest-based bargaining.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {BASKETS.map((b) => (
            <div
              key={b.num}
              className="rounded-xl border border-[#9ADBE8]/40 bg-gradient-to-b from-[#9ADBE8]/5 to-white p-6"
            >
              <div className="mb-3 text-xs font-bold uppercase tracking-wider text-[#511E84]">
                Basket {b.num}
              </div>
              <h3 className="text-lg font-bold text-[#1a1a2e]">{b.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{b.focus}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-100 bg-[#1a1a2e] px-6 py-12 text-center text-white">
        <Image
          src="/simuvaction-logo.png"
          alt="SimuVaction"
          width={140}
          height={35}
          className="mx-auto h-9 w-auto"
        />
        <p className="mt-4 text-sm text-white/50">
          &copy; {new Date().getFullYear()} SimuVaction on AI &mdash; Global Consortium for Trusted Artificial Intelligence
        </p>
        <p className="mt-1 text-xs text-white/30">
          Versailles, France
        </p>
      </footer>
    </div>
  );
}
