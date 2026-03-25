"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const HIGHLIGHTS = [
  { icon: "\u{1F393}", title: "Human-Centred AI", desc: "AI must serve learners, not replace educators. Teachers retain authority over high-stakes decisions." },
  { icon: "\u{1F6E1}\uFE0F", title: "Privacy & Data Protection", desc: "Ban on commercial resale of student data, live biometric surveillance, and social scoring in education." },
  { icon: "\u{1F30D}", title: "Equity & Inclusion", desc: "AI models must reflect linguistic, cultural, and socioeconomic diversity. No Western-centric bias." },
  { icon: "\u{2696}\uFE0F", title: "Transparent Governance", desc: "Mandatory HRIA reports, appeal procedures, and algorithmic transparency for all educational AI systems." },
  { icon: "\u{1F91D}", title: "International Cooperation", desc: "Establishment of ICG-AI with an $8B Global Fund for equitable AI access in education worldwide." },
  { icon: "\u{1F331}", title: "Green & Sustainable AI", desc: "Environmental sustainability standards embedded in all AI education policies and procurement." },
];

export function SimuvactionEntryPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#1a1a2e]">
      {/* ===== NAVBAR ===== */}
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/simuvaction-logo.png" alt="SimuVaction" width={160} height={40} className="h-10 w-auto" priority />
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#about" className="text-sm font-medium text-gray-600 transition hover:text-[#511E84]">About</a>
            <a href="#highlights" className="text-sm font-medium text-gray-600 transition hover:text-[#511E84]">Key Points</a>
            <Link href="/declaration" className="text-sm font-medium text-gray-600 transition hover:text-[#511E84]">Full Declaration</Link>
            <Link href="/login" className="rounded-full bg-[#511E84] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#3d1663]">Sign In</Link>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-gray-600 md:hidden" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {menuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-gray-100 bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-3">
              <a href="#about" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600">About</a>
              <a href="#highlights" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-gray-600">Key Points</a>
              <Link href="/declaration" className="text-sm font-medium text-gray-600">Full Declaration</Link>
              <Link href="/login" className="mt-2 rounded-full bg-[#511E84] px-5 py-2 text-center text-sm font-semibold text-white">Sign In</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#511E84] via-[#3d1663] to-[#1a1a2e] px-6 py-24 text-center text-white md:py-36">
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
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/50">
            A multistakeholder simulation advancing human-centred AI governance in education through research, policy, and practice.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/declaration" className="rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-[#511E84] transition hover:bg-gray-100">
              Read the Full Declaration
            </Link>
            <Link href="/login" className="rounded-full border border-white/30 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10">
              Sign In to Platform
            </Link>
          </div>
        </div>
      </section>

      {/* ===== ABOUT ===== */}
      <section id="about" className="mx-auto max-w-4xl px-6 py-20">
        <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#511E84]">About the Paper</div>
        <h2 className="font-serif text-3xl font-bold text-[#1a1a2e] md:text-4xl">
          Position Paper: AI in Education
        </h2>
        <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-600">
          <p>
            The GCTAI submits this paper to contribute to SimuVaction 2026&rsquo;s global discussions on AI in education. As a multistakeholder initiative connecting research, policy, and practice, GCTAI promotes AI development grounded in human rights, inclusion, access, and democratic values.
          </p>
          <p>
            The paper addresses six thematic areas&mdash;from personalized assessment and student monitoring to teacher support and accessibility&mdash;and proposes a comprehensive regulatory framework including the establishment of an International Collaboration Group for AI in Education (ICG-AI).
          </p>
        </div>
        <div className="mt-8">
          <Link href="/declaration" className="inline-flex items-center gap-2 rounded-lg border border-[#511E84]/20 bg-[#511E84]/5 px-5 py-3 text-sm font-semibold text-[#511E84] transition hover:bg-[#511E84]/10">
            Read the integral document &rarr;
          </Link>
        </div>
      </section>

      {/* ===== HIGHLIGHTS ===== */}
      <section id="highlights" className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-[#511E84]">Key Positions</div>
          <h2 className="font-serif text-3xl font-bold text-[#1a1a2e] md:text-4xl">At a Glance</h2>
          <p className="mt-3 max-w-2xl text-base text-gray-500">
            Core positions from the GCTAI Position Paper on AI governance in education.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#9ADBE8] hover:shadow-md">
                <div className="mb-3 text-2xl">{h.icon}</div>
                <h3 className="text-base font-bold text-[#1a1a2e]">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{h.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/declaration" className="inline-flex items-center gap-2 rounded-full bg-[#511E84] px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-[#3d1663]">
              Read the Full Declaration &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-100 bg-[#1a1a2e] px-6 py-12 text-center text-white">
        <Image src="/simuvaction-logo.png" alt="SimuVaction" width={140} height={35} className="mx-auto h-9 w-auto" />
        <p className="mt-4 text-sm text-white/50">
          &copy; {new Date().getFullYear()} SimuVaction on AI &mdash; Global Consortium for Trusted Artificial Intelligence
        </p>
        <p className="mt-1 text-xs text-white/30">Versailles, France</p>
      </footer>
    </div>
  );
}
