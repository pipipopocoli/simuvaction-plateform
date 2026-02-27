import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { resolveWorkspacePath } from "@/lib/authz";

export default async function WorkspaceRedirectPage() {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  redirect(resolveWorkspacePath(session.role));
}
