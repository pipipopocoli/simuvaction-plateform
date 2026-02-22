import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const deadlines = await prisma.officialDeadline.findMany({
    orderBy: { orderIndex: "asc" },
  });

  return NextResponse.json({ deadlines });
}
