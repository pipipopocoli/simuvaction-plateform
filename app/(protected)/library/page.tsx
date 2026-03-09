import { DocumentLibrary } from "@/components/library/document-library";
import { prisma } from "@/lib/prisma";
import { getUserSession } from "@/lib/server-auth";
import { redirect } from "next/navigation";

export default async function LibraryPage() {
  const session = await getUserSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true, teamId: true },
  });

  const isAdmin = user?.role === "admin" || user?.role === "operator";

  return <DocumentLibrary isAdmin={isAdmin} teamId={user?.teamId ?? null} />;
}
