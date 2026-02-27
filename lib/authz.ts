export function isAdminLike(role: string | null | undefined): boolean {
  return role === "admin" || role === "game_master";
}

export function resolveWorkspacePath(role: string | null | undefined): string {
  if (role === "delegate") return "/workspace/delegate";
  if (role === "journalist") return "/workspace/journalist";
  if (role === "leader") return "/workspace/leader";
  if (role === "lobbyist") return "/workspace/lobbyist";
  if (isAdminLike(role)) return "/workspace/admin";
  return "/";
}

export function normalizeMemberRole(rawRole: string): {
  role: "delegate" | "leader" | "journalist" | "admin" | "game_master";
  teamName: string | null;
} {
  const value = rawRole.trim();
  const lower = value.toLowerCase();

  if (lower === "secretariat / leadership" || lower === "leadership") {
    return { role: "leader", teamName: null };
  }

  if (lower === "journaliste" || lower === "journalist") {
    return { role: "journalist", teamName: null };
  }

  if (lower === "admin" || lower === "system admin") {
    return { role: "admin", teamName: null };
  }

  if (lower === "game master" || lower === "game_master") {
    return { role: "game_master", teamName: null };
  }

  return { role: "delegate", teamName: value };
}
