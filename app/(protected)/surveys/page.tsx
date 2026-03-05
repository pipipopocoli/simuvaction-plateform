import { getUserSession } from "@/lib/server-auth";
import { SectionHeader } from "@/components/ui/commons";
import { SurveysClient } from "@/components/surveys/surveys-client";

export default async function SurveysPage() {
  const session = await getUserSession();

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Feedback"
        title="Surveys"
        subtitle="Conference satisfaction and discernment progression tracking."
      />
      <SurveysClient role={session?.role ?? null} />
    </div>
  );
}
