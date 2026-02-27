import { NextResponse, NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { isAdminLike } from "@/lib/authz";

export async function GET() {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, userId, teamId, role } = session;

    try {
        const votes = await prisma.vote.findMany({
            where: { eventId },
            include: {
                options: true,
                eligibilityRoles: true,
                eligibilityTeams: true,
                // Include user's own cast to know if they voted
                ballots: {
                    where: { voterUserId: userId }
                },
                createdBy: {
                    select: { name: true, role: true }
                },
                _count: {
                    select: { ballots: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        const enhancedVotes = votes.map((vote) => {
            let isEligible = false;

            // If the vote targets specific roles
            const rulesRole = vote.eligibilityRoles.map(r => r.role);
            if (rulesRole.length === 0 || rulesRole.includes(role)) {
                isEligible = true;
            }

            // If the vote restricts by teams (usually only "delegate" roles have teams)
            const rulesTeams = vote.eligibilityTeams.map(t => t.teamId);
            if (rulesTeams.length > 0) {
                if (!teamId || !rulesTeams.includes(teamId)) {
                    isEligible = false;
                }
            }

            // Admins can see but maybe not vote depending on the rules
            // Most of the time Admins just manage votes.

            return {
                ...vote,
                isEligible,
                hasVoted: vote.ballots.length > 0,
            };
        });

        return NextResponse.json(enhancedVotes);
    } catch (error) {
        console.error("GET Votes error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const session = await getUserSession();
    if (!session || (!isAdminLike(session.role) && session.role !== "leader")) {
        return NextResponse.json({ error: "Unauthorized. Only Leaders or Admins can create votes." }, { status: 403 });
    }

    const { eventId, userId } = session;

    try {
        const body = await req.json();
        const {
            title,
            description,
            status,
            visibility,
            voteType,
            quorumPercent,
            options, // Array of strings e.g. ["Yes", "No", "Abstain"]
            eligibleRoles, // Optional: Array of role strings ["delegate"]
            eligibleTeams // Optional: Array of teamIds
        } = body;

        if (!title || !options || options.length < 2) {
            return NextResponse.json({ error: "Missing required fields or insufficient options" }, { status: 400 });
        }

        const vote = await prisma.vote.create({
            data: {
                eventId,
                title,
                description: description || null,
                status: status || "draft",
                visibility: visibility || "public",
                ballotMode: voteType || "per_delegation",
                quorumPercent: quorumPercent || 50,
                createdById: userId,
                options: {
                    create: options.map((optLabel: string) => ({ label: optLabel }))
                },
                eligibilityRoles: eligibleRoles ? {
                    create: eligibleRoles.map((roleStr: string) => ({ role: roleStr }))
                } : undefined,
                eligibilityTeams: eligibleTeams ? {
                    create: eligibleTeams.map((tId: string) => ({ teamId: tId }))
                } : undefined,
            },
            include: {
                options: true,
                eligibilityRoles: true,
                eligibilityTeams: true,
            }
        });

        const eligibleRoleList = Array.isArray(eligibleRoles)
            ? eligibleRoles.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
            : [];
        const eligibleTeamList = Array.isArray(eligibleTeams)
            ? eligibleTeams.filter((value: unknown): value is string => typeof value === "string" && value.trim().length > 0)
            : [];

        const userWhere: Prisma.UserWhereInput = {
            eventId,
            id: { not: userId },
            ...(eligibleRoleList.length > 0 ? { role: { in: eligibleRoleList } } : {}),
            ...(eligibleTeamList.length > 0 ? { teamId: { in: eligibleTeamList } } : {}),
        };

        const recipients = await prisma.user.findMany({
            where: userWhere,
            select: { id: true },
        });

        if (recipients.length > 0) {
            const statusValue = (vote.status ?? "").toLowerCase();
            const isOpened = statusValue === "active" || statusValue === "open";

            await prisma.notification.createMany({
                data: recipients.map((recipient) => ({
                    eventId,
                    userId: recipient.id,
                    type: isOpened ? "vote_opened" : "vote_created",
                    title: isOpened ? "A vote is now open" : "A new vote was created",
                    body: vote.title,
                    deepLink: "/votes",
                    priority: isOpened ? "high" : "normal",
                })),
            });
        }

        return NextResponse.json(vote);
    } catch (error) {
        console.error("POST Vote error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
