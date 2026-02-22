export type WeeklyPlanItemType =
  | "official_deadline"
  | "task_due"
  | "urgent_task"
  | "meeting";

export interface WeeklyPlanItem {
  type: WeeklyPlanItemType;
  title: string;
  dueIso: string;
  details?: string;
  relatedTaskId?: string;
}

export interface MeetingAgendaPayload {
  datetimeCetIso: string;
  agendaTaskIds: string[];
  optionalNotes?: string;
}

export interface NotificationProvider {
  sendReminder(input: {
    to: string;
    message: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
