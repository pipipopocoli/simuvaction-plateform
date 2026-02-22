"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { saveNextMeeting } from "@/lib/meeting";
import { generateOrUpdateWeeklyPlan } from "@/lib/weekly-plan";

const meetingFormSchema = z.object({
  datetimeCetIso: z.string().min(1),
  agendaTaskIds: z.array(z.string()).default([]),
  optionalNotes: z.string().optional(),
});

export async function generateWeeklyPlanAction() {
  await generateOrUpdateWeeklyPlan();
  revalidatePath("/");
}

export async function saveNextMeetingAction(formData: FormData) {
  const parsed = meetingFormSchema.safeParse({
    datetimeCetIso: formData.get("datetimeCetIso"),
    agendaTaskIds: formData.getAll("agendaTaskIds"),
    optionalNotes: formData.get("optionalNotes") || undefined,
  });

  if (!parsed.success) {
    return;
  }

  await saveNextMeeting(parsed.data);
  revalidatePath("/");
}
