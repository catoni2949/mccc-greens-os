/** Lightweight text similarity — upgrade path: embeddings + pgvector on mention_key. */

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "for",
  "is",
  "was",
  "are",
  "we",
  "they",
  "this",
  "that",
  "with",
  "as",
  "at",
  "be",
  "it",
  "our",
  "will",
  "would",
  "should",
  "about",
  "from",
  "have",
  "has",
  "had",
  "not",
  "but",
  "by",
  "if",
  "so",
  "meeting",
  "committee",
  "greens",
]);

export function normalizeKey(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalizeKey(text)
    .split(" ")
    .filter((w) => w.length > 2 && !STOP.has(w));
}

export function extractHoleNumbers(text: string): number[] {
  const holes = new Set<number>();
  const re = /\b(?:hole|#)\s*(\d{1,2})\b/gi;
  let m: RegExpExecArray | null;
  const s = text;
  while ((m = re.exec(s)) !== null) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) holes.add(n);
  }
  const greenRe = /\b(\d{1,2})\s+green\b/gi;
  while ((m = greenRe.exec(s)) !== null) {
    const n = parseInt(m[1], 10);
    if (!Number.isNaN(n)) holes.add(n);
  }
  return Array.from(holes);
}

export function overlapScore(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (!ta.length || !tb.length) return 0;
  const tbSet = new Set(tb);
  let inter = 0;
  for (let i = 0; i < ta.length; i++) {
    if (tbSet.has(ta[i])) inter++;
  }
  const union = new Set(ta.concat(tb)).size;
  return inter / union;
}

export function titleSimilarity(a: string, b: string): number {
  const na = normalizeKey(a);
  const nb = normalizeKey(b);
  if (!na || !nb) return 0;
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) {
    const shorter = Math.min(na.length, nb.length);
    const longer = Math.max(na.length, nb.length);
    return 0.75 + (shorter / longer) * 0.2;
  }
  return overlapScore(a, b);
}

export function combinedRelevanceScore(
  query: string,
  target: string,
  opts?: { holeQuery?: number[]; holeTarget?: number[]; categoryMatch?: boolean }
): number {
  let score = titleSimilarity(query, target);
  if (opts?.categoryMatch) score += 0.12;
  const qh = opts?.holeQuery ?? extractHoleNumbers(query);
  const th = opts?.holeTarget ?? extractHoleNumbers(target);
  if (qh.length && th.length && qh.some((h) => th.includes(h))) {
    score += 0.35;
  }
  return Math.min(1, score);
}

export function mentionKeyFromTitle(title: string): string {
  const tokens = tokenize(title).slice(0, 8);
  return tokens.join("-") || normalizeKey(title).slice(0, 64);
}
