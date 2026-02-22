import { NextResponse } from "next/server";
import { generateOrUpdateWeeklyPlan } from "@/lib/weekly-plan";

export async function POST() {
  const weeklyPlan = await generateOrUpdateWeeklyPlan();
  return NextResponse.json({ weeklyPlan });
}
