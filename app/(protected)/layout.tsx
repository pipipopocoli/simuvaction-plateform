import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { TopNav } from "@/components/top-nav";
import { getUserSession } from "@/lib/server-auth";
import { TutorialBot } from "@/components/tutorial-bot";
import { prisma } from "@/lib/prisma";
import { FirstLoginTour } from "@/components/onboarding/first-login-tour";

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

  let isOnboardingCompleted = true;
  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { onboardingCompletedAt: true },
    });
    isOnboardingCompleted = Boolean(user?.onboardingCompletedAt);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2022") {
      console.warn("Onboarding column missing in database. Falling back to completed state.");
    } else {
      console.error("Failed to read onboarding status.", error);
    }
    // Fail-safe: never break authenticated pages if migrations are pending or query fails.
    isOnboardingCompleted = true;
  }

  return (
    <div className="min-h-screen relative">
      <TopNav session={session} />
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 md:px-6 md:py-8">{children}</main>
      <FirstLoginTour userName={session.name} role={session.role} isCompleted={isOnboardingCompleted} />
      <TutorialBot role={session.role} />
    </div>
  );
}
