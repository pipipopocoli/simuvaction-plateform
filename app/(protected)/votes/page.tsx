import { ShieldCheck, Vote } from "lucide-react";
import { AdminVotePanel } from "@/components/voting/admin-vote-panel";
import { VoteDashboard } from "@/components/voting/vote-dashboard";
import { getUserSession } from "@/lib/server-auth";
import { Panel, SectionHeader } from "@/components/ui/commons";

export default async function VotesPage() {
  const session = await getUserSession();
  if (!session) {
    return null;
  }

  const canAdminister = session.role === "leader" || session.role === "admin";

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Parliament"
        title="Votes"
        subtitle="Cast ballots, monitor quorum, and run session resolutions from a unified governance panel."
      />

      <div className="grid gap-6 xl:grid-cols-12">
        <Panel className="xl:col-span-8">
          <h2 className="mb-4 flex items-center gap-2 font-serif text-3xl font-bold text-ink">
            <Vote className="h-6 w-6 text-ink-blue" /> Active Ballots
          </h2>
          <VoteDashboard currentUserId={session.userId} currentUserRole={session.role} />
        </Panel>

        <Panel className="xl:col-span-4" variant="soft">
          <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-ink">
            <ShieldCheck className="h-6 w-6 text-alert-red" /> Vote Governance
          </h2>
          <p className="mt-3 text-sm text-ink/70">
            Leader and admin roles can launch resolutions and define ballot visibility and quorum rules.
          </p>

          {canAdminister ? (
            <div className="mt-4">
              <AdminVotePanel />
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-ink-border bg-white px-4 py-3 text-sm text-ink/70">
              Creation controls are restricted to leader and admin roles.
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
