import { redirect } from "next/navigation";
import { getUserSession } from "@/lib/server-auth";
import { SimuvactionEntryPage } from "@/components/public/simuvaction-entry-page";

export default async function PublicHomePage() {
  const session = await getUserSession();
  if (session) {
    redirect("/dashboard");
  }

  return <SimuvactionEntryPage />;
}
