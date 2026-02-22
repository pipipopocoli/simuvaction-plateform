import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ voteId: string }> }
) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId, teamId, role } = session;
    const { voteId } = await params;

    try {
        const { optionId } = await req.json();

        if (!optionId) {
            return NextResponse.json({ error: "No option selected" }, { status: 400 });
        }

        // 1. Fetch the vote details
        const vote = await prisma.vote.findUnique({
            where: { id: voteId },
            include: {
                options: true,
                eligibilityRoles: true,
                eligibilityTeams: true,
                ballots: true // For team checking
            }
        });

        if (!vote || vote.eventId !== eventId) {
            return NextResponse.json({ error: "Vote not found" }, { status: 404 });
        }

        if (vote.status !== "active") {
            return NextResponse.json({ error: "Vote is not currently active" }, { status: 403 });
        }

        // 2. Validate Option
        const validOption = vote.options.find((opt: { id: string; optionKey: string }) => opt.id === optionId);
        if (!validOption) {
            return NextResponse.json({ error: "Invalid option selected" }, { status: 400 });
        }

        // 3. User Eligibility Check
        const rulesRole = vote.eligibilityRoles.map((r: { role: string }) => r.role);
        if (rulesRole.length > 0 && !rulesRole.includes(role)) {
            return NextResponse.json({ error: "Your role is not eligible to vote" }, { status: 403 });
        }

        const rulesTeams = vote.eligibilityTeams.map((t: { teamId: string }) => t.teamId);
        if (rulesTeams.length > 0 && (!teamId || !rulesTeams.includes(teamId))) {
            return NextResponse.json({ error: "Your team is not eligible to vote" }, { status: 403 });
        }

        // 4. Duplicate Vote Check via VoteBallot
        // If "per_delegation", check if ANYONE in the user's team already voted.
        // If "per_person", check if THIS user already voted.
        let ballotExists = false;

        if (vote.ballotMode === "per_delegation") {
            if (!teamId) {
                return NextResponse.json({ error: "You must belong to a team (delegation) to cast a delegation vote" }, { status: 403 });
            }
            ballotExists = !!(await prisma.voteBallot.findFirst({
                where: { voteId, voterTeamId: teamId }
            }));
        } else {
            ballotExists = !!(await prisma.voteBallot.findFirst({
                where: { voteId, voterUserId: userId }
            }));
        }

        if (ballotExists) {
            return NextResponse.json({ error: "Already voted" }, { status: 403 });
        }

        // 5. Cast the Vote securely
        // Transaction to ensure Ballot + Cast are perfectly synced
        const transactionOps = [];

        // Track WHO voted (for duplicate checking, regardless of secrecy)
        const ballotId = crypto.randomUUID(); // Optional, prisma handles it, but we can generate to strictly link
        transactionOps.push(
            prisma.voteBallot.create({
                data: {
                    id: ballotId,
                    voteId,
                    eventId,
                    voterUserId: userId,
                    voterTeamId: teamId || null,
                }
            })
        );

        // Track WHAT was voted (The Cast linked to the Ballot)
        transactionOps.push(
            prisma.voteCast.create({
                data: {
                    ballotId,
                    optionId,
                }
            })
        );

        // If the vote is public, we also track WHO voted for WHAT (Rollcall)
        if (vote.visibility === "public") {
            transactionOps.push(
                prisma.voteRollcall.create({
                    data: {
                        voteId,
                        userId,
                        optionKey: validOption.optionKey,
                    }
                })
            );
        }

        await prisma.$transaction(transactionOps);

        return NextResponse.json({ success: true, optionId });

    } catch (error) {
        console.error("POST Cast Vote error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
