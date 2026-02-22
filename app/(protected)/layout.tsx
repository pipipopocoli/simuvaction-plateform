import { redirect } from "next/navigation";
import { TopNav } from "@/components/top-nav";
import { getUserSession } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getUserSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <TopNav session={session} />
      <main className="mx-auto w-full max-w-[1400px] px-8 py-8">{children}</main>
    </div>
  );
}
