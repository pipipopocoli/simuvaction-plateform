import type { NotificationProvider } from "@/lib/types";

export class NoopNotificationProvider implements NotificationProvider {
  async sendReminder(): Promise<void> {
    // Placeholder for future WhatsApp integration.
  }
}

export const notificationProvider = new NoopNotificationProvider();
