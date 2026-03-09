export const PUBLIC_EDITORIAL_BYLINE = "SimuVaction Editorial";

export function getPublicEditorialByline() {
  return PUBLIC_EDITORIAL_BYLINE;
}

export function getPublicAuthorName(author: { name: string; role: string }) {
  if (author.role !== "journalist") {
    return PUBLIC_EDITORIAL_BYLINE;
  }

  return author.name;
}

export function getPublicAuthorRole(author: { role: string; displayRole?: string | null }) {
  if (author.role !== "journalist") {
    return PUBLIC_EDITORIAL_BYLINE;
  }

  return author.displayRole?.trim() || "Journalist";
}
