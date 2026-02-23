import { Panel, SectionHeader } from "@/components/ui/commons";
import { SettingsProfile } from "@/components/settings-profile";
import { SettingsWhatsApp } from "@/components/settings-whatsapp";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Account"
        title="Settings"
        subtitle="Manage your personal profile and communication integration settings."
      />

      <Panel>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-zinc-600">Update your display information and credentials.</p>

        <div className="mt-4">
          <SettingsProfile />
        </div>
      </Panel>

      <Panel>
        <h2 className="text-xl font-semibold">WhatsApp Notifications (Coming soon)</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Placeholders only. Reminder sending is still disabled.
        </p>

        <div className="mt-4">
          <SettingsWhatsApp />
        </div>
      </Panel>
    </div>
  );
}
