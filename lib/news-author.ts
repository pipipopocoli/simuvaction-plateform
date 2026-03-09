export function getPublicAuthorName(author: { name: string; role: string }) {
  if (author.role === "admin" || author.role === "game_master") {
    return "Game Master";
  }

  return author.name;
}

export function getPublicAuthorRole(author: { role: string; displayRole?: string | null }) {
  if (author.role === "admin" || author.role === "game_master") {
    return "Game Master";
  }

  return author.displayRole?.trim() || author.role;
}
