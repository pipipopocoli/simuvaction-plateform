import { SettingsWhatsApp } from "@/components/settings-whatsapp";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="card-panel rounded-lg p-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Integration placeholders for upcoming notification capabilities.
        </p>
      </section>

      <section className="card-panel rounded-lg p-6">
        <h2 className="text-lg font-semibold">WhatsApp Notifications (Coming soon)</h2>
        <p className="mt-1 text-sm text-zinc-600">
          V1 stores setup placeholders only. Sending reminders is not enabled.
        </p>

        <div className="mt-4">
          <SettingsWhatsApp />
        </div>
      </section>
    </div>
  );
}
