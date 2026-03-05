import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { BrandLogo } from "@/components/brand-logo";

const featureList = [
  "Secure role-based collaborative workspaces",
  "Conference feedback and discernment tracking",
  "Live newsroom, votes, and diplomatic coordination",
];

export default async function PublicHomePage() {
  const session = await getUserSession();
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#f5f1e9]">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-16 md:px-10">
        <div className="flex justify-center md:justify-start">
          <BrandLogo size="lg" priority />
        </div>

        <section className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">
            SimuVaction Commons Platform
          </p>
          <h1 className="max-w-3xl font-serif text-4xl font-bold text-[#111827] md:text-5xl">
            One platform for public information and secure educational simulation workspaces.
          </h1>
          <p className="max-w-2xl text-base text-zinc-700 md:text-lg">
            Explore the project, then sign in to access student and staff collaboration spaces.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-lg bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold uppercase tracking-wider text-white hover:bg-blue-900"
            >
              Sign in to Commons
            </Link>
            <Link
              href="/login/forgot"
              className="rounded-lg border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              Recover account
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {featureList.map((feature) => (
            <article
              key={feature}
              className="rounded-xl border border-[#e2e6ee] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
            >
              <p className="text-sm font-semibold text-zinc-800">{feature}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
