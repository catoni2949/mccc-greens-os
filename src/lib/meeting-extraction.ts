export type ExtractedActionItem = {
  title: string;
  owner: string | null;
  priority: "High" | "Medium" | "Low";
  category: string | null;
  due_date: string | null;
  hole_or_area: string | null;
  board_relevance: boolean;
  notes: string | null;
};

export type ExtractedStrategicProject = {
  title: string;
  hole_or_area: string | null;
  category: string | null;
  priority_tier: string | null;
  strategic_rationale: string | null;
  notes: string | null;
};

export type ExtractedTreeItem = {
  title: string;
  hole_or_area: string | null;
  hole_number: number | null;
  species: string | null;
  topic: string | null;
  board_relevant: boolean;
  tree_type: string | null;
  rationale: string | null;
  permit_status: string | null;
  committee_status: string | null;
  board_status: string | null;
  target_season: string | null;
  notes: string | null;
};

export type ExtractedCapitalItem = {
  title: string;
  item_type: string | null;
  estimated_cost: number | null;
  target_year: number | null;
  priority: "High" | "Medium" | "Low";
  status: string | null;
  notes: string | null;
};

export type ExtractedMemberFeedback = {
  topic: string;
  category: string | null;
  feedback_text: string | null;
  source: string | null;
  status: string | null;
  owner: string | null;
  notes: string | null;
};

export type MeetingExtractionResult = {
  summary: string;
  decisions: string;
  actionItems: ExtractedActionItem[];
  strategicProjects: ExtractedStrategicProject[];
  treeItems: ExtractedTreeItem[];
  capitalItems: ExtractedCapitalItem[];
  memberFeedback: ExtractedMemberFeedback[];
};

export type SentenceCategory =
  | "action"
  | "capital"
  | "tree"
  | "communication"
  | "strategic"
  | "decision"
  | "board"
  | null;

export type SentenceClassification = {
  category: SentenceCategory;
  boardRelated: boolean;
};

export type SentenceCategories = {
  categories: SentenceCategory[];
  boardRelated: boolean;
};

const OWNERS = ["Ryan", "Dwayne", "Mike", "Stacey", "Committee"] as const;

const MIN_SENTENCE_LEN = 18;

const ACTION_PATTERNS = [
  /will follow up/i,
  /follow[- ]?up/i,
  /needs to/i,
  /need to/i,
  /assigned to/i,
  /action item/i,
  /\bconfirm\b/i,
  /\bschedule\b/i,
  /\bsubmit\b/i,
  /coordinate/i,
  /\breview\b/i,
  /\bobtain\b/i,
  /\bsend\b/i,
  /\bprepare\b/i,
  /dwayne will/i,
  /ryan will/i,
  /committee agreed to/i,
  /mike will/i,
  /stacey will/i,
  /next meeting/i,
  /\baction\b/i,
];

const CAPITAL_PATTERNS = [
  /\bmower\b/i,
  /irrigation/i,
  /equipment/i,
  /replacement/i,
  /\bbudget\b/i,
  /\bcapital\b/i,
  /purchase/i,
  /funding/i,
  /controller/i,
  /\bfleet\b/i,
  /\$\d/,
  /\bcost\b/i,
  /pump/i,
];

/** Tree entity signals — if any match, a tree item should be produced. */
export const TREE_ENTITY_PATTERNS = [
  /\btree\b/i,
  /\boak\b/i,
  /\bcedar\b/i,
  /\bfir\b/i,
  /\bcorridor\b/i,
  /pruning/i,
  /canopy/i,
  /permit/i,
  /airflow/i,
  /sunlight/i,
  /removal/i,
  /shade/i,
];

const TREE_PATTERNS = TREE_ENTITY_PATTERNS;

const COMMUNICATION_PATTERNS = [
  /member communication/i,
  /newsletter/i,
  /update members/i,
  /\bcommunication\b/i,
  /\bpsa\b/i,
  /town hall/i,
  /social media/i,
];

const BOARD_PATTERNS = [
  /board approval/i,
  /board review/i,
  /membership vote/i,
  /strategic approval/i,
  /\bboard\b/i,
  /bylaws/i,
];

const DECISION_PATTERNS = [
  /\bdecision\b/i,
  /\bapproved\b/i,
  /\bagreed\b/i,
  /\bvote\b/i,
  /consensus/i,
];

const STRATEGIC_PATTERNS = [
  /strategic plan/i,
  /master plan/i,
  /implementation/i,
  /sequence/i,
  /roadmap/i,
];

/** Category priority when picking a single primary (legacy). */
const CATEGORY_PRIORITY: SentenceCategory[] = [
  "board",
  "decision",
  "tree",
  "capital",
  "communication",
  "strategic",
  "action",
];

export function isTreeEntity(sentence: string): boolean {
  return sentenceContainsAny(sentence, TREE_ENTITY_PATTERNS);
}

export function extractHoleNumber(sentence: string): number | null {
  const m = sentence.match(/\bhole\s*#?\s*(\d+)\b/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return Number.isNaN(n) ? null : n;
}

export function extractTreeSpecies(sentence: string): string | null {
  if (/\boak\b/i.test(sentence)) return "Oak";
  if (/\bcedar\b/i.test(sentence)) return "Cedar";
  if (/\bfir\b/i.test(sentence)) return "Fir";
  if (/\bmaple\b/i.test(sentence)) return "Maple";
  if (/\bpine\b/i.test(sentence)) return "Pine";
  return null;
}

export function extractBoardRelevance(sentence: string): boolean {
  return sentenceContainsAny(sentence, BOARD_PATTERNS);
}

function titleCasePhrase(phrase: string): string {
  return phrase
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function compressTreeTitle(sentence: string): string {
  const hole = extractHoleNumber(sentence);
  const species = extractTreeSpecies(sentence);

  const corridorMatch = sentence.match(
    /\bhole\s*#?\s*(\d+)\s+corridor\s+([a-z]+)/i
  );
  if (corridorMatch) {
    const n = parseInt(corridorMatch[1], 10);
    const tail = corridorMatch[2].toLowerCase();
    return `Hole ${n} corridor ${tail}`;
  }

  if (hole !== null && /\bcorridor\b/i.test(sentence) && species) {
    return `Hole ${hole} corridor ${species.toLowerCase()}`;
  }

  if (hole !== null && species) {
    return `Hole ${hole} ${species.toLowerCase()}`;
  }

  if (hole !== null) {
    return `Hole ${hole} tree item`;
  }

  let t = normalizeSentence(sentence);
  t = t.replace(/^.*?\b(?:on|about|regarding)\s+(?:the\s+)?/i, "");
  t = t.replace(/^the\s+/i, "");
  t = t.replace(
    /\s+and\s+(?:confirm|determine|verify)\b.*$/i,
    ""
  );
  t = t.replace(/\s+(?:whether|if)\b.*$/i, "");
  t = t.replace(/\b(?:will follow up|follow[- ]?up)\b.*?(?=\bhole\b)/i, "");
  t = t.trim();

  if (species && !new RegExp(species, "i").test(t)) {
    t = `${t} ${species}`.trim();
  }

  if (t.length > 72) {
    return `${titleCasePhrase(t.slice(0, 71))}…`;
  }

  return titleCasePhrase(t);
}

export function compressCapitalTitle(sentence: string): string {
  const patterns = [
    /\b((?:fairway|green|greens|rough|approach)\s+\w+\s+replacement)\b/i,
    /\b(\w+\s+mower\s+replacement)\b/i,
    /\b(fairway\s+mower)\b/i,
    /\b((?:irrigation|pump|controller|fleet)\s+\w+)\b/i,
    /\b(\w+\s+equipment\s+replacement)\b/i,
  ];

  for (const p of patterns) {
    const m = sentence.match(p);
    if (m?.[1]) {
      return titleCasePhrase(
        m[1].replace(/\s+(?:should|remains?|stay|is|are)\b.*$/i, "").trim()
      );
    }
  }

  let t = normalizeSentence(sentence);
  t = t.split(/\b(?:should|remains?|stay|high priority|low priority)\b/i)[0];
  t = t.replace(/^.*?\b(?:that|the)\s+/i, "");
  t = t.trim();
  if (t.length > 55) {
    const mower = t.match(/\b\w+(?:\s+\w+){0,2}\s+mower\b/i);
    if (mower) return titleCasePhrase(mower[0]);
    return `${titleCasePhrase(t.slice(0, 54))}…`;
  }
  return titleCasePhrase(t);
}

function treeDedupeKey(sentence: string): string {
  return fingerprint(compressTreeTitle(sentence));
}

function capitalDedupeKey(sentence: string): string {
  return fingerprint(compressCapitalTitle(sentence));
}

export function normalizeSentence(text: string): string {
  let s = text.replace(/\s+/g, " ").trim();
  s = s.replace(/^[-*•]\s+/, "");
  s = s.replace(/^\d+[.)]\s+/, "");
  s = s.replace(
    /^(?:Ryan|Dwayne|Mike|Stacey|Committee)\s*(?:said|noted|mentioned|stated)[:,]?\s*/i,
    ""
  );
  s = s.replace(
    /^(?:Ryan|Dwayne|Mike|Stacey)\s+said\s+that\s+/i,
    ""
  );
  return s.trim();
}

export function sentenceContainsAny(sentence: string, patterns: RegExp[]): boolean {
  const lower = sentence.toLowerCase();
  return patterns.some((p) => p.test(lower));
}

function sentenceScore(sentence: string, patterns: RegExp[]): number {
  const lower = sentence.toLowerCase();
  return patterns.reduce((n, p) => (p.test(lower) ? n + 1 : n), 0);
}

function fingerprint(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Fuzzy dedupe: drop near-duplicates and substring repeats. */
export function dedupeLines(lines: string[]): string[] {
  const out: string[] = [];
  const keys: string[] = [];

  for (const line of lines) {
    const fp = fingerprint(line);
    if (fp.length < MIN_SENTENCE_LEN) continue;

    const isDup = keys.some((k) => {
      if (k === fp) return true;
      const shorter = k.length < fp.length ? k : fp;
      const longer = k.length < fp.length ? fp : k;
      if (longer.includes(shorter) && shorter.length / longer.length > 0.72) {
        return true;
      }
      const a = k.split(" ");
      const b = fp.split(" ");
      const overlap = a.filter((w) => w.length > 3 && b.includes(w)).length;
      const ratio = overlap / Math.min(a.length, b.length);
      return ratio > 0.85;
    });

    if (!isDup) {
      out.push(line);
      keys.push(fp);
    }
  }
  return out;
}

/** Multi-category: tree/capital/action can coexist on one sentence. */
export function classifySentenceCategories(
  sentence: string
): SentenceCategories {
  const categories: SentenceCategory[] = [];
  const boardRelated = extractBoardRelevance(sentence);

  if (isTreeEntity(sentence)) categories.push("tree");

  if (sentenceScore(sentence, CAPITAL_PATTERNS) > 0) {
    categories.push("capital");
  }

  if (sentenceScore(sentence, COMMUNICATION_PATTERNS) > 0) {
    categories.push("communication");
  }

  if (sentenceScore(sentence, STRATEGIC_PATTERNS) > 0) {
    categories.push("strategic");
  }

  if (sentenceScore(sentence, ACTION_PATTERNS) > 0) {
    categories.push("action");
  }

  if (
    sentenceScore(sentence, DECISION_PATTERNS) > 0 &&
    !categories.includes("action")
  ) {
    categories.push("decision");
  }

  if (
    boardRelated &&
    sentenceScore(sentence, BOARD_PATTERNS) > 0 &&
    categories.length === 0
  ) {
    categories.push("board");
  }

  return { categories, boardRelated };
}

export function classifySentence(sentence: string): SentenceClassification {
  const boardRelated = extractBoardRelevance(sentence);

  const scores: Record<Exclude<SentenceCategory, null>, number> = {
    action: sentenceScore(sentence, ACTION_PATTERNS),
    capital: sentenceScore(sentence, CAPITAL_PATTERNS),
    tree: sentenceScore(sentence, TREE_PATTERNS),
    communication: sentenceScore(sentence, COMMUNICATION_PATTERNS),
    strategic: sentenceScore(sentence, STRATEGIC_PATTERNS),
    decision: sentenceScore(sentence, DECISION_PATTERNS),
    board: sentenceScore(sentence, BOARD_PATTERNS),
  };

  let best: SentenceCategory = null;
  let bestScore = 0;

  for (const cat of CATEGORY_PRIORITY) {
    if (!cat) continue;
    const sc = scores[cat];
    if (sc > bestScore) {
      bestScore = sc;
      best = cat;
    }
  }

  if (bestScore === 0) return { category: null, boardRelated };

  if (boardRelated && (best === "action" || best === "tree")) {
    return { category: best, boardRelated: true };
  }

  if (scores.board > 0 && scores.board >= bestScore) {
    return { category: "board", boardRelated: true };
  }

  if (scores.decision > 0 && scores.decision >= bestScore - 1) {
    return { category: "decision", boardRelated };
  }

  return { category: best, boardRelated };
}

function splitTranscriptIntoSentences(transcript: string): string[] {
  const chunks: string[] = [];
  const blocks = transcript.replace(/\r\n/g, "\n").split(/\n+/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (/^[-*•]\s/.test(trimmed) || /^\d+[.)]\s/.test(trimmed)) {
      chunks.push(trimmed);
      continue;
    }

    const parts = trimmed.split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/);
    chunks.push(...parts);
  }

  const normalized = chunks
    .map(normalizeSentence)
    .filter((s) => s.length >= MIN_SENTENCE_LEN);

  return dedupeLines(normalized);
}

function inferOwner(line: string): string | null {
  for (const o of OWNERS) {
    if (new RegExp(`\\b${o}\\b`, "i").test(line)) return o;
  }
  return null;
}

function inferPriority(line: string): "High" | "Medium" | "Low" {
  if (/urgent|asap|high priority|critical|remains high/i.test(line)) return "High";
  if (/low priority|when time|eventually/i.test(line)) return "Low";
  return "Medium";
}

function inferHoleOrArea(line: string): string | null {
  const hole = line.match(/\bhole\s*#?\s*(\d+)\b/i);
  if (hole) return `Hole ${hole[1]}`;
  const corridor = line.match(/\b(corridor|approach|green|fairway)\b/i);
  if (corridor) return corridor[1];
  return null;
}

function compressTitle(sentence: string, max = 110): string {
  let t = normalizeSentence(sentence);
  const owner = inferOwner(t);

  t = t.replace(/\b(\w+)\s+will\s+/gi, (_, name) => {
    const cap = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
    return `${cap} to `;
  });
  t = t.replace(/\bneeds to\b/i, "to");
  t = t.replace(/\bneed to\b/i, "to");
  t = t.replace(/\bcommittee agreed to\b/i, "Committee to");
  t = t.replace(/\b(action item|follow[- ]?up):\s*/i, "");

  if (owner && !/^(\w+ to)/i.test(t)) {
    t = `${owner}: ${t}`;
  }

  t = t.replace(/\s+/g, " ").trim();
  if (t.length > max) t = `${t.slice(0, max - 1)}…`;
  return t;
}

function bulletLines(lines: string[], formatter: (s: string) => string = compressTitle): string {
  const items = dedupeLines(lines.map(formatter));
  if (!items.length) return "- None identified";
  return items.map((l) => `- ${l}`).join("\n");
}

function dedupeByTitle<T extends { title: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = fingerprint(i.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildTreeItemFromSentence(sentence: string): ExtractedTreeItem {
  const hole = extractHoleNumber(sentence);
  const species = extractTreeSpecies(sentence);
  const board_relevant = extractBoardRelevance(sentence);
  const title = compressTreeTitle(sentence);

  return {
    title,
    hole_or_area: hole != null ? `Hole ${hole}` : inferHoleOrArea(sentence),
    hole_number: hole,
    species,
    topic: title,
    board_relevant,
    tree_type: species,
    rationale: null,
    permit_status: /permit/i.test(sentence) ? "Pending" : "Not Required",
    committee_status: "In Review",
    board_status: board_relevant ? "Pending" : "Not Required",
    target_season: null,
    notes: null,
  };
}

function buildCapitalItemFromSentence(sentence: string): ExtractedCapitalItem {
  const costMatch = sentence.match(/\$[\d,]+(?:\.\d+)?/);
  let estimated_cost: number | null = null;
  if (costMatch) {
    estimated_cost = parseFloat(costMatch[0].replace(/[$,]/g, ""));
  }

  const title = compressCapitalTitle(sentence);
  const lower = sentence.toLowerCase();

  return {
    title,
    item_type: /\bmower\b/i.test(lower)
      ? "Equipment"
      : /irrigation|pump/i.test(lower)
        ? "Irrigation"
        : /equipment|fleet|controller/i.test(lower)
          ? "Equipment"
          : null,
    estimated_cost,
    target_year: null,
    priority: inferPriority(sentence),
    status: "Under Review",
    notes: null,
  };
}

function dedupeByTopic<T extends { topic: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => {
    const key = fingerprint(i.topic);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildSummaryBullets(
  sentences: string[],
  buckets: Record<string, string[]>
): string {
  const candidates: string[] = [];

  const pick = (arr: string[]) => {
    for (const s of arr) {
      if (candidates.length >= 4) break;
      const t = compressTitle(s, 90);
      if (!candidates.some((c) => fingerprint(c) === fingerprint(t))) {
        candidates.push(t);
      }
    }
  };

  pick(buckets.decision ?? []);
  pick(buckets.board ?? []);
  pick(buckets.action ?? []);
  pick([
    ...(buckets.capital ?? []),
    ...(buckets.tree ?? []),
    ...(buckets.strategic ?? []),
  ]);

  if (candidates.length < 4) {
    for (const s of sentences) {
      if (candidates.length >= 4) break;
      const t = compressTitle(s, 90);
      if (!candidates.some((c) => fingerprint(c) === fingerprint(t))) {
        candidates.push(t);
      }
    }
  }

  const bullets = candidates.slice(0, 4);
  const topics = dedupeLines(
    sentences
      .filter((s) => classifySentenceCategories(s).categories.length > 0)
      .map((s) =>
        isTreeEntity(s) ? compressTreeTitle(s) : compressTitle(s, 80)
      )
  ).slice(0, 4);

  const boardNotes = dedupeLines([
    ...(buckets.board ?? []),
    ...(buckets.decision ?? []).filter((s) =>
      sentenceContainsAny(s, BOARD_PATTERNS)
    ),
  ])
    .map((s) => compressTitle(s, 90))
    .slice(0, 4);

  return `## Draft Summary
${bullets.map((b) => `- ${b}`).join("\n") || "- TBD"}

## Key Discussion Topics
${topics.map((t) => `- ${t}`).join("\n") || "- TBD"}

## Board-Relevant Notes
${boardNotes.map((b) => `- ${b}`).join("\n") || "- None identified"}`;
}

/** Heuristic extraction — replaceable with AI provider later */
export function extractMeetingIntelligence(
  transcript: string
): MeetingExtractionResult {
  const sentences = splitTranscriptIntoSentences(transcript);
  const buckets: Record<string, string[]> = {
    action: [],
    capital: [],
    tree: [],
    communication: [],
    strategic: [],
    decision: [],
    board: [],
  };

  const treeKeys = new Set<string>();
  const capitalKeys = new Set<string>();
  const actionKeys = new Set<string>();

  for (const sentence of sentences) {
    const { categories, boardRelated } = classifySentenceCategories(sentence);
    const fp = fingerprint(sentence);

    if (isTreeEntity(sentence)) {
      const key = treeDedupeKey(sentence);
      if (!treeKeys.has(key)) {
        treeKeys.add(key);
        buckets.tree.push(sentence);
      }
    }

    if (categories.includes("capital")) {
      const key = capitalDedupeKey(sentence);
      if (!capitalKeys.has(key)) {
        capitalKeys.add(key);
        buckets.capital.push(sentence);
      }
    }

    if (categories.includes("action")) {
      const key = fingerprint(compressTitle(sentence));
      if (!actionKeys.has(key)) {
        actionKeys.add(key);
        buckets.action.push(sentence);
      }
    }

    if (categories.includes("communication")) {
      buckets.communication.push(sentence);
    }

    if (categories.includes("strategic")) {
      buckets.strategic.push(sentence);
    }

    if (categories.includes("decision")) {
      buckets.decision.push(sentence);
    }

    if (categories.includes("board")) {
      buckets.board.push(sentence);
    }

    if (
      boardRelated &&
      !categories.includes("board") &&
      !buckets.board.some((b) => fingerprint(b) === fp)
    ) {
      buckets.board.push(sentence);
    }
  }

  const decisionLines = dedupeLines([
    ...buckets.decision,
    ...buckets.board,
  ]);

  const decisions = bulletLines(decisionLines);

  const actionItems = dedupeByTitle(
    buckets.action.map((sentence) => ({
      title: compressTitle(sentence),
      owner: inferOwner(sentence),
      priority: inferPriority(sentence),
      category: "Operations",
      due_date: null,
      hole_or_area: inferHoleOrArea(sentence),
      board_relevance: extractBoardRelevance(sentence),
      notes: null,
    }))
  );

  const strategicProjects = dedupeByTitle(
    buckets.strategic.map((sentence) => ({
      title: compressTitle(sentence),
      hole_or_area: inferHoleOrArea(sentence),
      category: "Strategic Plan",
      priority_tier: null,
      strategic_rationale: compressTitle(sentence, 200),
      notes: null,
    }))
  );

  const treeItems = dedupeByTitle(
    buckets.tree.map((sentence) => buildTreeItemFromSentence(sentence))
  );

  const capitalItems = dedupeByTitle(
    buckets.capital.map((sentence) => buildCapitalItemFromSentence(sentence))
  );

  const memberFeedback = dedupeByTopic(
    buckets.communication.map((sentence) => ({
      topic: compressTitle(sentence, 80),
      category: "Member Communication",
      feedback_text: compressTitle(sentence, 200),
      source: null,
      status: "Open",
      owner: inferOwner(sentence),
      notes: null,
    }))
  );

  const summary = buildSummaryBullets(sentences, buckets);

  return {
    summary,
    decisions,
    actionItems,
    strategicProjects,
    treeItems,
    capitalItems,
    memberFeedback,
  };
}

export const DRAFT_SUMMARY_PLACEHOLDER = `## Draft Summary
Transcript saved. AI extraction pending.

## Key Discussion Topics
- TBD

## Decisions
- TBD

## Action Items
- TBD

## Board-Relevant Notes
- TBD`;
