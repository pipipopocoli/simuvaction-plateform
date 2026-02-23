import { NextResponse, NextRequest } from "next/server";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";

// GET /api/news
// Fetch news articles based on role and status
export async function GET(req: NextRequest) {
    const session = await getUserSession();
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId, role, userId } = session;
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "all";

    try {
        let whereClause: any = { eventId };

        // Determine what a user can see based on their role and the requested filter
        if (role === "journalist") {
            if (filter === "my_drafts") {
                whereClause = { ...whereClause, authorId: userId, status: "draft" };
            } else if (filter === "review_queue") {
                // Journalists can see articles submitted by OTHERS that need review
                whereClause = { ...whereClause, status: "submitted" };
            } else if (filter === "published") {
                whereClause = { ...whereClause, status: "published" };
            } else {
                // Default journalist view: their own stuff + published stuff + submitted stuff
                whereClause = {
                    ...whereClause,
                    OR: [
                        { authorId: userId },
                        { status: "submitted" },
                        { status: "published" }
                    ]
                };
            }
        } else if (role === "leader" || role === "admin") {
            if (filter === "review_queue") {
                // Leaders only review articles that journalists have already approved (or all submitted if we want a flatter hierarchy)
                // For this V2 implementation: Leaders can see all "submitted" articles to provide the final 3rd vote.
                whereClause = { ...whereClause, status: "submitted" };
            } else {
                // Leaders see submitted and published
                whereClause = {
                    ...whereClause,
                    OR: [
                        { status: "submitted" },
                        { status: "published" }
                    ]
                };
            }
        } else {
            // Delegates and Lobbyists ONLY see fully published news
            whereClause = { ...whereClause, status: "published" };
        }

        const news = await prisma.newsPost.findMany({
            where: whereClause,
            include: {
                author: {
                    select: { name: true, role: true }
                },
                approvals: {
                    include: {
                        approver: {
                            select: { name: true, role: true }
                        }
                    }
                }
            },
            orderBy: [
                // Prioritize published date if exists, otherwise creation date
                { publishedAt: "desc" },
                { createdAt: "desc" }
            ]
        });

        // Compute approval metadata for UI convenience
        const enhancedNews = news.map((post) => {
            const journalistApprovals = post.approvals.filter(a => a.approverRole === "journalist" && a.decision === "approve").length;
            const leaderApprovals = post.approvals.filter(a => (a.approverRole === "leader" || a.approverRole === "admin") && a.decision === "approve").length;
            const rejections = post.approvals.filter(a => a.decision === "reject").length;

            // Re-verify if this user has already voted on this specific article
            const hasUserVoted = post.approvals.some(a => a.approverId === userId);

            return {
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
            };
        });

        return NextResponse.json(enhancedNews);
    } catch (error) {
        console.error("GET News error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/news
// Create a new draft or directly submit an article
export async function POST(req: NextRequest) {
    const session = await getUserSession();
    if (!session || (session.role !== "journalist" && session.role !== "admin")) {
        return NextResponse.json({ error: "Unauthorized. Seuls les journalistes peuvent créer des articles." }, { status: 403 });
    }

    const { eventId, userId } = session;

    try {
        const body = await req.json();
        const { title, content, status } = body; // status can be 'draft' or 'submitted'

        if (!title || !content) {
            return NextResponse.json({ error: "Titre et contenu obligatoires." }, { status: 400 });
        }

        const post = await prisma.newsPost.create({
            data: {
                eventId,
                authorId: userId,
                title,
                body: content,
                status: status === "submitted" ? "submitted" : "draft",
            },
            include: {
                author: { select: { name: true } }
            }
        });

        return NextResponse.json(post);
    } catch (error) {
        console.error("POST News error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
