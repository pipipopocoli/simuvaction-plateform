import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { isAdminLike } from "@/lib/authz";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getUserSession();
    // Only Journalists and Leaders/Admins can approve or reject articles
    if (!session || (session.role !== "journalist" && session.role !== "leader" && !isAdminLike(session.role))) {
        return NextResponse.json({ error: "Unauthorized. Only journalists and leadership can review articles." }, { status: 403 });
    }

    const { eventId, userId, role } = session;
    const { id: postId } = await params;

    try {
        const body = await req.json();
        const { decision, reason } = body; // 'approve' or 'reject'

        if (decision !== "approve" && decision !== "reject") {
            return NextResponse.json({ error: "Invalid decision." }, { status: 400 });
        }

        // Fetch the target article
        const post = await prisma.newsPost.findUnique({
            where: { id: postId, eventId },
            include: {
                approvals: true,
                author: { select: { id: true, name: true } },
            }
        });

        if (!post) {
            return NextResponse.json({ error: "Article not found." }, { status: 404 });
        }

        if (post.status !== "submitted") {
            return NextResponse.json({ error: "Only submitted articles can be reviewed." }, { status: 400 });
        }

        if (post.authorId === userId) {
            return NextResponse.json({ error: "You cannot review or approve your own article." }, { status: 403 });
        }

        // Determine effective role for the approval record
        const approverRole = isAdminLike(role) ? "leader" : role;

        // Upsert the specific user's approval
        await prisma.newsApproval.upsert({
            where: {
                postId_approverId: {
                    postId,
                    approverId: userId
                }
            },
            update: {
                decision,
                reason: reason || null,
                approverRole,
                decidedAt: new Date()
            },
            create: {
                postId,
                approverId: userId,
                decision,
                reason: reason || null,
                approverRole
            }
        });

        // If it's a rejection, we immediately kick the article back to 'rejected' state so the author can fix it
        if (decision === "reject") {
            const rejectedPost = await prisma.newsPost.update({
                where: { id: postId },
                data: { status: "rejected" }
            });

            await prisma.notification.create({
                data: {
                    eventId,
                    userId: post.authorId,
                    type: "news_rejected",
                    title: "Article rejected",
                    body: `Your article "${post.title}" was rejected and returned for revision.`,
                    deepLink: "/workspace/journalist",
                    priority: "high",
                },
            });
            return NextResponse.json({ message: "Article rejected and returned to the author.", post: rejectedPost });
        }

        // If it's an approval, check if we hit the quorum (2 journalists + 1 leader)
        const updatedPost = await prisma.newsPost.findUnique({
            where: { id: postId },
            include: { approvals: true }
        });

        if (!updatedPost) return NextResponse.json({ error: "Error reloading post" }, { status: 500 });

        const journalistApprovals = updatedPost.approvals.filter(a => a.approverRole === "journalist" && a.decision === "approve").length;
        const leaderApprovals = updatedPost.approvals.filter(a => a.approverRole === "leader" && a.decision === "approve").length;

        // PUBLISH CONDITION: Minimum 2 journalist approves AND 1 leader approve.
        if (journalistApprovals >= 2 && leaderApprovals >= 1) {
            await prisma.newsPost.update({
                where: { id: postId },
                data: {
                    status: "published",
                    publishedAt: new Date()
                }
            });

            const recipients = await prisma.user.findMany({
                where: { eventId, id: { not: userId } },
                select: { id: true },
            });

            if (recipients.length > 0) {
                await prisma.notification.createMany({
                    data: recipients.map((recipient) => ({
                        eventId,
                        userId: recipient.id,
                        type: "news_published",
                        title: "New article published",
                        body: post.title,
                        deepLink: `/newsroom/${postId}`,
                        priority: "normal",
                    })),
                });
            }

            return NextResponse.json({ message: "Article officially published.", published: true });
        }

        return NextResponse.json({
            message: "Approval recorded.",
            status: "pending",
            counts: { journalistApprovals, leaderApprovals }
        });

    } catch (error) {
        console.error("POST News Approval error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
