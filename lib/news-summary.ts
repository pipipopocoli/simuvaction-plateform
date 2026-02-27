function splitWords(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean);
}

export function buildFixedWordSummary(text: string, size: number): string {
  const words = splitWords(text);
  if (words.length === 0 || size <= 0) {
    return "";
  }

  if (words.length >= size) {
    return words.slice(0, size).join(" ");
  }

  const expanded = [...words];
  let idx = 0;
  while (expanded.length < size) {
    expanded.push(words[idx % words.length]);
    idx += 1;
  }

  return expanded.join(" ");
}
