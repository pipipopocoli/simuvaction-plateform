import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ voteId: string }> }
) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = session;
    const { voteId } = await params;

    try {
        const vote = await prisma.vote.findUnique({
            where: { id: voteId },
            include: {
                options: true,
                eligibilityRoles: true,
                eligibilityTeams: true,
                createdBy: {
                    select: { name: true, role: true }
                },
                _count: {
                    select: { ballots: true }
                }
            }
        });

        if (!vote || vote.eventId !== eventId) {
            return NextResponse.json({ error: "Vote not found" }, { status: 404 });
        }

        // To secure secret votes, we only return aggregate counts if requested by Admin,
        // or if `showLiveResults` is true. Otherwise we only fetch the definition.

        let results = null;
        if (vote.showLiveResults || session.role === "admin" || session.role === "leader") {
            // Aggregate counts per option
            const optionsWithCounts = await Promise.all(vote.options.map(async (opt: { id: string }) => {
                const count = await prisma.voteCast.count({
                    where: { optionId: opt.id }
                });
                return {
                    optionId: opt.id,
                    count
                };
            }));

            // If public, we could also fetch the rollcalls, but mostly we just need counts
            const rollcalls = vote.visibility === "public"
                ? await prisma.voteRollcall.findMany({
                    where: { voteId },
                    include: { user: { select: { id: true, name: true, teamId: true } } }
                })
                : [];

            results = {
                counts: optionsWithCounts,
                rollcalls
            };
        }

        return NextResponse.json({
            vote,
            results,
            isEligible: true, // simplified here, detailed check happens in lists
        });
    } catch (error) {
        console.error("GET Vote Details error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
