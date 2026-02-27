import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: postId } = await params;
    const { eventId, userId } = session;

    try {
        const post = await prisma.newsPost.findUnique({
            where: { id: postId, eventId },
            include: {
                author: { select: { name: true, role: true } },
                approvals: { include: { approver: { select: { name: true, role: true } } } }
            }
        });

        if (!post) return NextResponse.json({ error: "Article not found." }, { status: 404 });

        // Privacy check
        if (post.status === "draft" && post.authorId !== userId) {
            return NextResponse.json({ error: "This draft is private." }, { status: 403 });
        }

        // Compute approval metadata for UI convenience
        const journalistApprovals = post.approvals.filter(a => a.approverRole === "journalist" && a.decision === "approve").length;
        const leaderApprovals = post.approvals.filter(a => (a.approverRole === "leader" || a.approverRole === "admin") && a.decision === "approve").length;
        const rejections = post.approvals.filter(a => a.decision === "reject").length;

        const hasUserVoted = post.approvals.some(a => a.approverId === userId);

        return NextResponse.json({
            ...post,
            stats: {
                journalistApprovals,
                leaderApprovals,
                rejections,
                requiredJournalists: 2,
                requiredLeaders: 1,
                canPublish: journalistApprovals >= 2 && leaderApprovals >= 1
            },
            hasUserVoted
        });
    } catch (error) {
        console.error("GET News [id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getUserSession();
    if (!session || (session.role !== "journalist" && session.role !== "admin")) {
        return NextResponse.json({ error: "Unauthorized. Only the author can edit this draft." }, { status: 403 });
    }

    const { id: postId } = await params;
    const { eventId, userId } = session;

    try {
        const post = await prisma.newsPost.findUnique({ where: { id: postId, eventId } });
        if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

        // Only the original author can edit their draft/rejected piece, Admin is god mode fallback
        if (post.authorId !== userId && session.role !== "admin") {
            return NextResponse.json({ error: "You are not the author of this article." }, { status: 403 });
        }

        // It is strictly forbidden to edit a post that is actively being reviewed or published.
        if (post.status === "submitted" || post.status === "published") {
            return NextResponse.json({ error: "Cannot edit an article that is under review or already published." }, { status: 400 });
        }

        const body = await req.json();
        const { title, content, status } = body;

        // If the author submits the article, we wipe existing approvals/rejections to restart the fresh queue
        if (status === "submitted" && post.status !== "submitted") {
            await prisma.newsApproval.deleteMany({ where: { postId } });
        }

        const updated = await prisma.newsPost.update({
            where: { id: postId },
            data: {
                title: title ?? post.title,
                body: content ?? post.body,
                status: status ?? post.status
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("PATCH News [id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await getUserSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: postId } = await params;
    const { eventId, userId, role } = session;

    try {
        const post = await prisma.newsPost.findUnique({ where: { id: postId, eventId } });
        if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

        if (post.authorId !== userId && role !== "admin") {
            return NextResponse.json({ error: "You are not the author of this article." }, { status: 403 });
        }

        await prisma.newsPost.delete({ where: { id: postId } });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("DELETE News [id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
