function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export function buildVideoRoomName(prefix: "meeting" | "press", id: string, title: string) {
  return `simuvaction-${prefix}-${slugify(title) || prefix}-${id.slice(0, 10)}`;
}
