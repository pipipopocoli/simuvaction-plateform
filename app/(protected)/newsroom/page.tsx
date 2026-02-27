import Link from "next/link";
import { ArrowRight, FileText, Newspaper } from "lucide-react";
import { FrontPageNewsFeed } from "@/components/newsroom/front-page-news-feed";
import { LeaderNewsApprovalPanel } from "@/components/newsroom/leader-news-approval-panel";
import { getUserSession } from "@/lib/server-auth";
import { isAdminLike } from "@/lib/authz";
import { ActionButton, Panel, SectionHeader } from "@/components/ui/commons";

export default async function NewsroomPage() {
  const session = await getUserSession();
  if (!session) {
    return null;
  }

  const canReview = session.role === "leader" || isAdminLike(session.role);
  const canWrite = session.role === "journalist" || isAdminLike(session.role);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Editorial Command"
        title="Newsroom"
        subtitle="Review dispatches, publish approved stories, and keep delegations aligned on verified updates."
        actions={
          canWrite ? (
            <Link href="/workspace/journalist">
              <ActionButton>
                Open journalist workspace
                <ArrowRight className="h-4 w-4" />
              </ActionButton>
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <FrontPageNewsFeed />
        </div>

        <Panel className="xl:col-span-4">
          <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
            <FileText className="h-6 w-6 text-ink-blue" /> Editorial Queue
          </h2>
          <p className="mt-3 text-sm text-ink/70">
            Journalists submit articles to peer review. Leaders can issue final approval when quorum is reached.
          </p>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-ink-border bg-ivory p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Your role</p>
              <p className="mt-2 text-sm font-semibold text-ink">{session.role.toUpperCase()}</p>
            </div>
            <div className="rounded-xl border border-ink-border bg-white p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink/55">Workflow</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
                <li>1. Draft and submit from journalist workspace.</li>
                <li>2. Two journalist approvals unlock leader review.</li>
                <li>3. One leader approval publishes to Commons feed.</li>
              </ul>
            </div>
          </div>

          {!canReview && (
            <p className="mt-4 flex items-center gap-2 rounded-lg border border-ink-border bg-white px-3 py-2 text-sm text-ink/70">
              <Newspaper className="h-4 w-4 text-ink-blue" />
              Final approval controls are restricted to leader and admin roles.
            </p>
          )}
        </Panel>
      </div>

      {canReview ? (
        <Panel>
          <h2 className="mb-4 font-serif text-3xl font-bold text-ink">Leader Approval Panel</h2>
          <LeaderNewsApprovalPanel userId={session.userId} />
        </Panel>
      ) : null}
    </div>
  );
}
