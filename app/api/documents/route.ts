import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";
import { getPublicEditorialByline } from "@/lib/news-author";
import { isPrismaSchemaDriftError, logPrismaSchemaDrift } from "@/lib/prisma-runtime-guard";

export async function GET() {
  try {
    const session = await getUserSession();
    if (!session?.eventId || !session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true, teamId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const documents = await prisma.eventDocument.findMany({
      where: {
        eventId: session.eventId,
        OR: [
          { isPublic: true },
          ...(isAdminLike(user.role)
            ? [{}]
            : user.teamId
              ? [{ targetTeams: { some: { id: user.teamId } } }]
              : []),
        ],
      },
      include: {
        createdBy: {
          select: { name: true, displayRole: true, role: true },
        },
        targetTeams: {
          select: { id: true, countryCode: true, countryName: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      documents.map((document) => ({
        ...document,
        publicAuthorName: getPublicEditorialByline(),
      })),
    );
  } catch (error) {
    if (isPrismaSchemaDriftError(error)) {
      logPrismaSchemaDrift("Failed to fetch documents", error);
      return NextResponse.json([]);
    }
    console.error("Failed to fetch documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: "Use /api/admin/documents for official library uploads." },
    { status: 405 },
  );
}
