import { redirect } from "next/navigation";
import { AtlasClient } from "@/components/atlas/atlas-client";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { toAtlasDelegations } from "@/lib/atlas";

export default async function AtlasPage() {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  const teams = await prisma.team.findMany({
    where: { eventId: session.eventId },
    include: { _count: { select: { users: true } } },
    orderBy: { countryName: "asc" },
  });

  const delegations = toAtlasDelegations(teams);

  return <AtlasClient delegations={delegations} />;
}
