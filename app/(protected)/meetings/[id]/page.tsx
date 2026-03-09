import { notFound, redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { prisma } from "@/lib/prisma";
import { EmbeddedVideoRoom } from "@/components/video/embedded-video-room";

export default async function MeetingSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;
  const meetingSession = await prisma.meetingSession.findFirst({
    where: {
      id,
      eventId: session.eventId,
      participants: { some: { userId: session.userId } },
    },
    include: {
      chatRoom: { select: { id: true, name: true } },
    },
  });

  if (!meetingSession) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink/55">Private meeting room</p>
        <h1 className="mt-1 font-serif text-4xl font-bold text-ink">{meetingSession.title}</h1>
        <p className="mt-2 text-sm text-ink/65">
          Scheduled for {meetingSession.scheduledStartAt.toISOString()} to {meetingSession.scheduledEndAt.toISOString()}
        </p>
      </div>
      <EmbeddedVideoRoom kind="meeting" id={meetingSession.id} />
      {meetingSession.chatRoom ? (
        <a
          href={`/chat/${meetingSession.chatRoom.id}`}
          className="inline-flex rounded-lg border border-ink-border bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink-blue/40"
        >
          Open meeting chat
        </a>
      ) : null}
    </div>
  );
}
