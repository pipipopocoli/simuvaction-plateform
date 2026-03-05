import { NextResponse } from "next/server";

const DEFAULT_PUBLIC_CONFIG = {
  brandName: "SimuVaction",
  logoUrl: "/simuvaction-logo.svg",
  headline: "SimuVaction Commons 2026",
  subheadline: "Interactive diplomatic simulation platform",
  ctaLabel: "Sign in to Commons",
  ctaHref: "/login",
};

export async function GET() {
  return NextResponse.json({
    config: DEFAULT_PUBLIC_CONFIG,
  });
}
