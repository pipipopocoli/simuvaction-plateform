import { DocumentLibrary } from "@/components/library/document-library";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LibraryPage() {
  const session = await getSession();

  if (!session?.userId) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });

  const isAdmin = user?.role === "admin" || user?.role === "operator";

  return <DocumentLibrary isAdmin={isAdmin} />;
}
