import { NextRequest, NextResponse } from "next/server";
import { generateOrUpdateWeeklyPlan } from "@/lib/weekly-plan";

function isAuthorized(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const token = request.nextUrl.searchParams.get("token");
  return token === cronSecret;
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weeklyPlan = await generateOrUpdateWeeklyPlan();
  return NextResponse.json({ weeklyPlan });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
