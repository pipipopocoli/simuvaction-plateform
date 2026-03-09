import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { PressConferencesPanel } from "@/components/press/press-conferences-panel";

export default async function PressConferencesPage() {
  const session = await getUserSession();
  if (!session) {
    redirect("/login");
  }

  return <PressConferencesPanel />;
}
