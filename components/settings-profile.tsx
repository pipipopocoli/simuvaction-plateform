"use client";

import Image from "next/image";
import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/commons";

type ProfilePayload = {
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  teamName: string | null;
  whatsAppNumber: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  positionPaperUrl: string | null;
  positionPaperSummary: string | null;
  preferredTimeZone: string | null;
  googleCalendarConnected?: boolean;
  googleCalendarAccountEmail?: string | null;
};

type AvatarStatusPayload = {
  configured: boolean;
  maxSizeMb: number;
};

export function SettingsProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [whatsAppNumber, setWhatsAppNumber] = useState("");
  const [xUrl, setXUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [positionPaperUrl, setPositionPaperUrl] = useState("");
  const [positionPaperSummary, setPositionPaperSummary] = useState("");
  const [preferredTimeZone, setPreferredTimeZone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [avatarUploadConfigured, setAvatarUploadConfigured] = useState<boolean | null>(null);
  const [avatarMaxSizeMb, setAvatarMaxSizeMb] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const [profileResponse, statusResponse] = await Promise.all([
          fetch("/api/settings/profile", { cache: "no-store" }),
          fetch("/api/settings/profile/avatar/status", { cache: "no-store" }),
        ]);

        const payload = await profileResponse.json().catch(() => ({}));
        if (!profileResponse.ok) {
          if (!active) return;
          setError(payload.error ?? "Unable to load profile.");
          return;
        }

        const statusPayload = (await statusResponse.json().catch(() => ({}))) as Partial<AvatarStatusPayload>;

        if (!active) return;
        const fetchedProfile = payload.profile as ProfilePayload;
        setProfile(fetchedProfile);
        setName(fetchedProfile.name);
        setAvatarUrl(fetchedProfile.avatarUrl ?? "");
        setWhatsAppNumber(fetchedProfile.whatsAppNumber ?? "");
        setXUrl(fetchedProfile.xUrl ?? "");
        setLinkedinUrl(fetchedProfile.linkedinUrl ?? "");
        setPositionPaperUrl(fetchedProfile.positionPaperUrl ?? "");
        setPositionPaperSummary(fetchedProfile.positionPaperSummary ?? "");
        setPreferredTimeZone(
          fetchedProfile.preferredTimeZone ??
            Intl.DateTimeFormat().resolvedOptions().timeZone ??
            "UTC",
        );
        setAvatarUploadConfigured(statusResponse.ok ? Boolean(statusPayload.configured) : false);
        if (typeof statusPayload.maxSizeMb === "number" && Number.isFinite(statusPayload.maxSizeMb)) {
          setAvatarMaxSizeMb(statusPayload.maxSizeMb);
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const avatarInitials = useMemo(() => {
    const source = name.trim() || profile?.name || "SV";
    return source
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [name, profile?.name]);

  async function uploadAvatar(file: File) {
    setError(null);
    setSuccess(null);

    if (!avatarUploadConfigured) {
      setError("Avatar upload is not configured for this environment. Use Avatar URL override below.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are accepted.");
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/settings/profile/avatar", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload.errorCode === "BLOB_CONFIG_MISSING") {
          setError("Avatar upload is not configured for this environment. Use Avatar URL override below.");
          setAvatarUploadConfigured(false);
          return;
        }
        setError(payload.error ?? "Avatar upload failed.");
        return;
      }

      setAvatarUrl(payload.avatarUrl ?? "");
      setSuccess("Avatar uploaded. Save profile to persist.");
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  function onAvatarDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (!avatarUploadConfigured) {
      return;
    }
    setIsDraggingAvatar(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      uploadAvatar(file);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (!name.trim()) {
      setError("Display name is required.");
      return;
    }

    setIsSaving(true);

    try {
      const body: {
        name: string;
        avatarUrl: string | null;
        whatsAppNumber: string | null;
        xUrl: string | null;
        linkedinUrl: string | null;
        positionPaperUrl: string | null;
        positionPaperSummary: string | null;
        preferredTimeZone: string | null;
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: name.trim(),
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
        whatsAppNumber: whatsAppNumber.trim() ? whatsAppNumber.trim() : null,
        xUrl: xUrl.trim() ? xUrl.trim() : null,
        linkedinUrl: linkedinUrl.trim() ? linkedinUrl.trim() : null,
        positionPaperUrl: positionPaperUrl.trim() ? positionPaperUrl.trim() : null,
        positionPaperSummary: positionPaperSummary.trim() ? positionPaperSummary.trim() : null,
        preferredTimeZone: preferredTimeZone.trim() ? preferredTimeZone.trim() : null,
      };

      if (newPassword.trim()) {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword.trim();
      }

      const response = await fetch("/api/settings/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload.error ?? "Failed to save profile.");
        return;
      }

      const updatedProfile = payload.profile as ProfilePayload;
      setProfile(updatedProfile);
      setName(updatedProfile.name);
      setAvatarUrl(updatedProfile.avatarUrl ?? "");
      setWhatsAppNumber(updatedProfile.whatsAppNumber ?? "");
      setXUrl(updatedProfile.xUrl ?? "");
      setLinkedinUrl(updatedProfile.linkedinUrl ?? "");
      setPositionPaperUrl(updatedProfile.positionPaperUrl ?? "");
      setPositionPaperSummary(updatedProfile.positionPaperSummary ?? "");
      setPreferredTimeZone(updatedProfile.preferredTimeZone ?? "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(payload.passwordChanged ? "Profile and password updated." : "Profile updated.");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading profile...</p>;
  }

  if (!profile) {
    return <p className="text-sm text-red-600">Unable to load profile data.</p>;
  }

  async function connectGoogleCalendar() {
    setError(null);
    try {
      const response = await fetch("/api/integrations/google/calendar/connect", { cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.authUrl) {
        setError(payload.error ?? "Unable to start Google Calendar connection.");
        return;
      }
      window.location.href = payload.authUrl;
    } catch (connectError) {
      setError(connectError instanceof Error ? connectError.message : "Unable to start Google Calendar connection.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-zinc-700">
              Display name
            </label>
            <input
              id="display-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              required
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="x-url" className="block text-sm font-medium text-zinc-700">
                X profile URL
              </label>
              <input
                id="x-url"
                value={xUrl}
                onChange={(event) => setXUrl(event.target.value)}
                placeholder="https://x.com/your-handle"
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>

            <div>
              <label htmlFor="linkedin-url" className="block text-sm font-medium text-zinc-700">
                LinkedIn URL
              </label>
              <input
                id="linkedin-url"
                value={linkedinUrl}
                onChange={(event) => setLinkedinUrl(event.target.value)}
                placeholder="https://linkedin.com/in/your-handle"
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-zinc-700">
                WhatsApp number
              </label>
              <input
                id="whatsapp"
                value={whatsAppNumber}
                onChange={(event) => setWhatsAppNumber(event.target.value)}
                placeholder="+14185551234"
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>

            <div>
              <label htmlFor="preferred-timezone" className="block text-sm font-medium text-zinc-700">
                Preferred timezone
              </label>
              <input
                id="preferred-timezone"
                value={preferredTimeZone}
                onChange={(event) => setPreferredTimeZone(event.target.value)}
                placeholder="Europe/Paris"
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>

            <div>
              <label htmlFor="position-paper-url" className="block text-sm font-medium text-zinc-700">
                Position paper URL
              </label>
              <input
                id="position-paper-url"
                value={positionPaperUrl}
                onChange={(event) => setPositionPaperUrl(event.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="position-paper-summary" className="block text-sm font-medium text-zinc-700">
              Position paper summary
            </label>
            <textarea
              id="position-paper-summary"
              value={positionPaperSummary}
              onChange={(event) => setPositionPaperSummary(event.target.value)}
              placeholder="Short summary shown on delegation cards"
              className="mt-1 min-h-[120px] w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Email</p>
              <p className="mt-1 text-sm text-zinc-800">{profile.email}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Role</p>
              <p className="mt-1 text-sm text-zinc-800">{profile.role}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Team</p>
              <p className="mt-1 text-sm text-zinc-800">{profile.teamName ?? "No team"}</p>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Google Calendar</p>
            <p className="mt-2 text-sm text-zinc-700">
              {profile.googleCalendarConnected
                ? `Connected as ${profile.googleCalendarAccountEmail ?? "Google account"}`
                : "Not connected yet. Connect it to create Google Meet links automatically for meetings and press conferences."}
            </p>
            <button
              type="button"
              onClick={connectGoogleCalendar}
              className="mt-3 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900"
            >
              {profile.googleCalendarConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
            </button>
          </div>
        </div>

        <Panel className="flex flex-col gap-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600">Avatar</p>
          <div
            className={`relative flex h-44 items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition ${
              avatarUploadConfigured === false
                ? "border-zinc-200 bg-zinc-100 opacity-70"
                : isDraggingAvatar
                  ? "border-ink-blue bg-blue-50"
                  : "border-zinc-300 bg-zinc-50"
            }`}
            onDragOver={(event) => {
              if (!avatarUploadConfigured) return;
              event.preventDefault();
              setIsDraggingAvatar(true);
            }}
            onDragLeave={() => setIsDraggingAvatar(false)}
            onDrop={onAvatarDrop}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Profile avatar"
                fill
                unoptimized
                sizes="176px"
                className="rounded-lg object-cover"
              />
            ) : (
              <div className="grid h-20 w-20 place-items-center rounded-full border border-zinc-300 bg-white text-xl font-semibold text-zinc-700">
                {avatarInitials}
              </div>
            )}
          </div>

          <label
            className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold ${
              avatarUploadConfigured === false
                ? "cursor-not-allowed border-zinc-200 bg-zinc-100 text-zinc-500"
                : "cursor-pointer border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            {avatarUploadConfigured === false
              ? "Upload disabled (configuration missing)"
              : isUploadingAvatar
                ? "Uploading..."
                : `Drop image above or click to upload (max ${avatarMaxSizeMb}MB)`}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={avatarUploadConfigured === false || isUploadingAvatar}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  uploadAvatar(file);
                }
              }}
            />
          </label>

          {avatarUploadConfigured === false ? (
            <p className="text-xs text-zinc-600">
              Upload API is available but not configured in this deployment. You can still set an avatar with a direct URL.
            </p>
          ) : null}

          <div>
            <label htmlFor="avatar-url" className="block text-xs font-medium text-zinc-600">
              Avatar URL (optional manual override)
            </label>
            <input
              id="avatar-url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
        </Panel>
      </div>

      <Panel className="space-y-4 p-4" variant="soft">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-600">Change password</h3>
        <p className="text-sm text-zinc-600">To set a new password, provide your current password first.</p>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-zinc-700">
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-zinc-700">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
            />
          </div>
        </div>
      </Panel>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <button
        type="submit"
        disabled={isSaving}
        className="rounded border border-zinc-900 bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-70"
      >
        {isSaving ? "Saving..." : "Save profile"}
      </button>
    </form>
  );
}
