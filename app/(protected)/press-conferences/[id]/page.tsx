import { notFound, redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { EmbeddedVideoRoom } from "@/components/video/embedded-video-room";

export default async function PressConferencePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const conference = await prisma.pressConference.findFirst({
    where: {
      id,
      eventId: session.eventId,
    },
    include: {
      createdBy: { select: { name: true } },
      participants: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!conference) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">Press conference</p>
        <h1 className="mt-1 font-serif text-4xl font-bold text-ink">{conference.title}</h1>
        <p className="mt-2 text-sm text-ink/65">
          Hosted by {conference.createdBy.name}. Speakers:{" "}
          {conference.participants.map((participant) => participant.user.name).join(", ") || "TBA"}
        </p>
      </div>
      <EmbeddedVideoRoom kind="press" id={conference.id} />
    </div>
  );
}
