"use client";

import { useEffect, useState } from "react";

type WhatsAppSetting = {
  numbers: string[];
  metaToken: string;
  metaPhoneNumberId: string;
  enabled: boolean;
};

const defaultSetting: WhatsAppSetting = {
  numbers: [],
  metaToken: "",
  metaPhoneNumberId: "",
  enabled: false,
};

export function SettingsWhatsApp() {
  const [setting, setSetting] = useState<WhatsAppSetting>(defaultSetting);
  const [numbersInput, setNumbersInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      const response = await fetch("/api/settings/whatsapp", { cache: "no-store" });
      const payload = await response.json().catch(() => ({ setting: defaultSetting }));
      if (!active) return;

      const normalized = (payload.setting ?? defaultSetting) as WhatsAppSetting;
      setSetting(normalized);
      setNumbersInput(normalized.numbers.join("\n"));
      setIsLoading(false);
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    const numbers = numbersInput
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/settings/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...setting,
          numbers,
          enabled: false,
        }),
      });

      if (!response.ok) {
        setError("Validation failed. Use E.164 format like +33123456789.");
        return;
      }

      const payload = await response.json();
      const updated = payload.setting as WhatsAppSetting;
      setSetting(updated);
      setNumbersInput(updated.numbers.join("\n"));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading settings...</p>;
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium">WhatsApp numbers (E.164, one per line)</label>
        <textarea
          rows={5}
          value={numbersInput}
          onChange={(event) => setNumbersInput(event.target.value)}
          className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
          placeholder="+33612345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Meta access token (placeholder)</label>
        <input
          type="password"
          value={setting.metaToken}
          onChange={(event) =>
            setSetting((previous) => ({
              ...previous,
              metaToken: event.target.value,
            }))
          }
          className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Meta phone number ID (placeholder)</label>
        <input
          value={setting.metaPhoneNumberId}
          onChange={(event) =>
            setSetting((previous) => ({
              ...previous,
              metaPhoneNumberId: event.target.value,
            }))
          }
          className="mt-1 w-full rounded border border-zinc-400 bg-white px-3 py-2"
        />
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-zinc-600">
        <input type="checkbox" checked={false} disabled />
        Enable WhatsApp reminders (coming soon, locked off)
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving}
        className="rounded border border-zinc-900 bg-zinc-900 px-3 py-1.5 text-sm text-zinc-100 hover:bg-zinc-800 disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Save placeholders"}
      </button>

      <div className="rounded border border-dashed border-zinc-400 bg-zinc-50 p-3 text-sm text-zinc-600">
        <p className="font-medium">TODO</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>Implement NotificationProvider Meta adapter.</li>
          <li>Add template-based reminder payloads.</li>
          <li>Add scheduler trigger wiring for weekly/task reminders.</li>
        </ul>
      </div>
    </div>
  );
}
