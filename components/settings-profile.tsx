"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel } from "@/components/ui/commons";

type ProfilePayload = {
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  teamName: string | null;
};

export function SettingsProfile() {
  const router = useRouter();
  const [profile, setProfile] = useState<ProfilePayload | null>(null);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/settings/profile", { cache: "no-store" });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          if (!active) return;
          setError(payload.error ?? "Unable to load profile.");
          return;
        }

        if (!active) return;
        const fetchedProfile = payload.profile as ProfilePayload;
        setProfile(fetchedProfile);
        setName(fetchedProfile.name);
        setAvatarUrl(fetchedProfile.avatarUrl ?? "");
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
        currentPassword?: string;
        newPassword?: string;
      } = {
        name: name.trim(),
        avatarUrl: avatarUrl.trim() ? avatarUrl.trim() : null,
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
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

          <div>
            <label htmlFor="avatar-url" className="block text-sm font-medium text-zinc-700">
              Avatar URL
            </label>
            <input
              id="avatar-url"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
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
        </div>

        <Panel className="flex flex-col items-center justify-center gap-3 p-4">
          <div
            className="h-20 w-20 rounded-full border border-zinc-300 bg-zinc-100 bg-cover bg-center text-zinc-700"
            style={avatarUrl.trim() ? { backgroundImage: `url(${avatarUrl.trim()})` } : undefined}
          >
            {!avatarUrl.trim() ? (
              <div className="grid h-full w-full place-items-center text-lg font-semibold">{avatarInitials}</div>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500">Live preview</p>
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
