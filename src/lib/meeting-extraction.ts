export const CONFIDENCE_THRESHOLD = 0.65;

/** Auto-select checkboxes on review when confidence is at or above this. */
export const RECOMMENDED_SELECTION_THRESHOLD = 0.8;

export type ExtractionMode = "openai" | "heuristic";

export type MeetingExtractionApiResponse = MeetingExtractionResult & {
  extractionMode: ExtractionMode;
  warning?: string;
};

export type ExtractedActionItem = {
  title: string;
  owner: string | null;
  priority: "High" | "Medium" | "Low";
  category: string | null;
  due_date: string | null;
  hole_or_area: string | null;
  board_relevance: boolean;
  notes: string | null;
  confidence: number;
};

export type ExtractedStrategicProject = {
  title: string;
  hole_or_area: string | null;
  category: string | null;
  priority_tier: string | null;
  strategic_rationale: string | null;
  notes: string | null;
  confidence: number;
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
  confidence: number;
};

export type ExtractedCapitalItem = {
  title: string;
  item_type: string | null;
  estimated_cost: number | null;
  target_year: number | null;
  priority: "High" | "Medium" | "Low";
  status: string | null;
  notes: string | null;
  confidence: number;
};

export type ExtractedMemberFeedback = {
  topic: string;
  category: string | null;
  feedback_text: string | null;
  source: string | null;
  status: string | null;
  owner: string | null;
  notes: string | null;
  confidence: number;
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

const STRONG_ACTION_VERBS = [
  /follow[- ]?up/i,
  /\bconfirm\b/i,
  /\bsend\b/i,
  /\bschedule\b/i,
  /\bvote\b/i,
  /\bapprove\b/i,
  /\bsubmit\b/i,
  /\bprepare\b/i,
  /\breview\b/i,
  /coordinate/i,
  /\bcontact\b/i,
  /\bwrite\b/i,
  /\border\b/i,
  /\bbudget\b/i,
  /add to agenda/i,
  /\bobtain\b/i,
  /\bask\b/i,
];

const ACTION_PATTERNS = [
  ...STRONG_ACTION_VERBS,
  /will follow up/i,
  /assigned to/i,
  /action item/i,
  /dwayne will/i,
  /ryan will/i,
  /committee agreed to/i,
  /mike will/i,
  /stacey will/i,
  /next meeting/i,
];

const VAGUE_PHRASE_PATTERNS = [
  /need to think/i,
  /\bwe need to\b/i,
  /\bi think\b/i,
  /\bmaybe\b/i,
  /\bprobably\b/i,
  /do we want/i,
  /it would be/i,
];

const STRONG_STRATEGIC_PATTERNS = [
  /implementation/i,
  /sequence/i,
  /reroute/i,
  /cart path/i,
  /tee complex/i,
  /green expansion/i,
  /master plan/i,
  /approval path/i,
  /member vote/i,
  /cost range/i,
];

const WEAK_STRATEGIC_PATTERNS = [
  /strategic plan is exciting/i,
  /when we see (?:the )?strategic plan/i,
  /strategic plan.{0,20}$/i,
];

const CONCRETE_CAPITAL_PATTERNS = [
  /\w+\s+mower/i,
  /fairway mower/i,
  /rough mower/i,
  /pump service/i,
  /irrigation heads?/i,
  /bunker sand/i,
  /track mats?/i,
  /equipment replacement/i,
  /controller/i,
  /\$\d/,
];

const GENERIC_CAPITAL_REJECT = [
  /whole entire thing/i,
  /june budget/i,
  /champagne course on beer budget/i,
  /doesn'?t cost \w+ that much/i,
  /^pump this\b/i,
];

const GENERIC_TREE_REJECT = [
  /\bthat tree\b/i,
  /tree health/i,
  /tree management/i,
  /\bturf\b/i,
  /these areas/i,
];

const STRONG_FEEDBACK_PATTERNS = [
  /newsletter/i,
  /town hall/i,
  /member communication/i,
  /member survey/i,
  /complaints?/i,
  /visibility issue/i,
  /member education/i,
  /update members/i,
  /social media/i,
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

const STRATEGIC_PATTERNS = STRONG_STRATEGIC_PATTERNS;

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

function hasStrongActionVerb(sentence: string): boolean {
  return sentenceContainsAny(sentence, STRONG_ACTION_VERBS);
}

function isVaguePhrase(sentence: string): boolean {
  return sentenceContainsAny(sentence, VAGUE_PHRASE_PATTERNS);
}

export function hasSpecificTreeLocation(sentence: string): boolean {
  if (extractHoleNumber(sentence) != null) return true;
  if (/\b(?:hole|#)\s*\d+\b/i.test(sentence) && isTreeEntity(sentence)) {
    return true;
  }
  if (/\b(?:back|behind)\s+(?:of\s+)?\d+\s+green\b/i.test(sentence)) {
    return true;
  }
  if (/\b\d+\s+green\b.*\b(?:tree|oak|removal|corridor)\b/i.test(sentence)) {
    return true;
  }
  if (/\bhole\s*\d+\s+corridor\b/i.test(sentence)) return true;
  if (
    /\b(?:permit|removal)\b/i.test(sentence) &&
    /\b(?:hole|green|corridor|\d+)\b/i.test(sentence)
  ) {
    return true;
  }
  return false;
}

function passesTreeFilter(sentence: string): boolean {
  if (sentenceContainsAny(sentence, GENERIC_TREE_REJECT) && !hasSpecificTreeLocation(sentence)) {
    return false;
  }
  if (!isTreeEntity(sentence)) return false;
  return hasSpecificTreeLocation(sentence);
}

function passesCapitalFilter(sentence: string): boolean {
  if (sentenceContainsAny(sentence, GENERIC_CAPITAL_REJECT)) {
    if (!sentenceContainsAny(sentence, CONCRETE_CAPITAL_PATTERNS)) return false;
  }
  return sentenceContainsAny(sentence, CONCRETE_CAPITAL_PATTERNS);
}

function passesStrategicFilter(sentence: string): boolean {
  if (sentenceContainsAny(sentence, WEAK_STRATEGIC_PATTERNS)) return false;
  if (!sentenceContainsAny(sentence, STRONG_STRATEGIC_PATTERNS)) return false;
  if (
    /strategic plan/i.test(sentence) &&
    sentenceScore(sentence, STRONG_STRATEGIC_PATTERNS) < 2
  ) {
    return false;
  }
  return true;
}

function passesActionFilter(sentence: string): boolean {
  if (sentenceContainsAny(sentence, GENERIC_CAPITAL_REJECT)) return false;
  if (sentenceContainsAny(sentence, GENERIC_TREE_REJECT) && !hasSpecificTreeLocation(sentence)) {
    return false;
  }

  const owner = inferOwner(sentence);
  const strong = hasStrongActionVerb(sentence);
  const vague = isVaguePhrase(sentence);
  const hasSignal =
    strong ||
    owner != null ||
    /\bwill\b/i.test(sentence) ||
    /action item/i.test(sentence);

  if (!hasSignal) return false;
  if (vague && !(strong && owner)) return false;
  if (/^we need to\b/i.test(sentence) && !strong) return false;
  if (/\bbudget\b/i.test(sentence) && !owner && !/\bwill\b/i.test(sentence)) {
    return false;
  }
  return true;
}

function passesFeedbackFilter(sentence: string): boolean {
  return sentenceContainsAny(sentence, STRONG_FEEDBACK_PATTERNS);
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function scoreActionConfidence(sentence: string): number {
  if (!passesActionFilter(sentence)) return 0;
  let s = 0.45;
  if (inferOwner(sentence)) s += 0.22;
  if (hasStrongActionVerb(sentence)) s += 0.2;
  if (extractBoardRelevance(sentence)) s += 0.05;
  if (isVaguePhrase(sentence)) s -= 0.25;
  if (/\bwill\b/i.test(sentence) && inferOwner(sentence)) s += 0.08;
  return clamp01(s);
}

function scoreTreeConfidence(sentence: string): number {
  if (!passesTreeFilter(sentence)) return 0;
  let s = 0.55;
  if (extractHoleNumber(sentence) != null) s += 0.2;
  if (extractTreeSpecies(sentence)) s += 0.12;
  if (/\bremoval\b/i.test(sentence)) s += 0.08;
  if (extractBoardRelevance(sentence)) s += 0.05;
  return clamp01(s);
}

function scoreCapitalConfidence(sentence: string): number {
  if (!passesCapitalFilter(sentence)) return 0;
  let s = 0.5;
  if (/\$\d/.test(sentence)) s += 0.15;
  if (/\bmower\b/i.test(sentence)) s += 0.18;
  if (/\breplacement\b/i.test(sentence)) s += 0.1;
  return clamp01(s);
}

function scoreStrategicConfidence(sentence: string): number {
  if (!passesStrategicFilter(sentence)) return 0;
  let s = 0.55;
  s += Math.min(0.25, sentenceScore(sentence, STRONG_STRATEGIC_PATTERNS) * 0.08);
  return clamp01(s);
}

function scoreFeedbackConfidence(sentence: string): number {
  if (!passesFeedbackFilter(sentence)) return 0;
  let s = 0.6;
  if (/town hall|newsletter/i.test(sentence)) s += 0.12;
  return clamp01(s);
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
    return titleCasePhrase(t.slice(0, 72).replace(/\s+\S*$/, "").trim());
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
    return titleCasePhrase(t.slice(0, 55).replace(/\s+\S*$/, "").trim());
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

  if (passesTreeFilter(sentence)) categories.push("tree");

  if (passesCapitalFilter(sentence)) categories.push("capital");

  if (passesFeedbackFilter(sentence)) categories.push("communication");

  if (passesStrategicFilter(sentence)) categories.push("strategic");

  if (passesActionFilter(sentence)) categories.push("action");

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

function compressActionTitle(sentence: string, max = 100): string {
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
  t = t.replace(
    /\bask\s+(\w+)\s+to\s+give\s+a\s+[\w-]*\s*update\s+on\s+the\s+board\b/i,
    "ask $1 for board update"
  );
  t = t.replace(/\bfive to ten minute\b/i, "");
  t = t.replace(/\s+/g, " ").trim();

  if (owner && !/^\w+ to\b/i.test(t)) {
    t = `${owner} to ${t.replace(new RegExp(`^${owner}\\s*:?\\s*`, "i"), "")}`;
  }

  if (t.length > max) {
    t = t.slice(0, max).replace(/\s+\S*$/, "").trim();
  }
  return t;
}

function compressTitle(sentence: string, max = 110): string {
  return compressActionTitle(sentence, max);
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

function buildTreeItemFromSentence(sentence: string): ExtractedTreeItem | null {
  const confidence = scoreTreeConfidence(sentence);
  if (confidence < 0.35) return null;
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
    confidence,
  };
}

function buildCapitalItemFromSentence(sentence: string): ExtractedCapitalItem | null {
  const costMatch = sentence.match(/\$[\d,]+(?:\.\d+)?/);
  let estimated_cost: number | null = null;
  if (costMatch) {
    estimated_cost = parseFloat(costMatch[0].replace(/[$,]/g, ""));
  }

  const title = compressCapitalTitle(sentence);
  const lower = sentence.toLowerCase();

  const confidence = scoreCapitalConfidence(sentence);
  if (confidence < 0.35) return null;

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
    confidence,
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

type SummaryTopic = { label: string; score: number; text: string };

function topicFromSentence(sentence: string): SummaryTopic | null {
  const lower = sentence.toLowerCase();
  if (/superintendent|course update|taylor|dwayne.*update/i.test(lower)) {
    return { label: "superintendent", score: 0.9, text: "Superintendent and course operations update" };
  }
  if (passesStrategicFilter(sentence)) {
    return {
      label: "strategic",
      score: 0.85,
      text: "Strategic plan implementation and approvals",
    };
  }
  if (/family tee|tee complex/i.test(lower)) {
    return { label: "tees", score: 0.82, text: "Family tees and tee complex planning" };
  }
  if (passesTreeFilter(sentence)) {
    const t = compressTreeTitle(sentence);
    return { label: "trees", score: 0.8, text: `Tree management: ${t}` };
  }
  if (passesCapitalFilter(sentence)) {
    return {
      label: "capital",
      score: 0.78,
      text: `Capital and equipment: ${compressCapitalTitle(sentence)}`,
    };
  }
  if (passesFeedbackFilter(sentence)) {
    return {
      label: "communication",
      score: 0.75,
      text: "Member communication and visibility",
    };
  }
  if (/committee membership|new member|greens committee/i.test(lower)) {
    return { label: "committee", score: 0.7, text: "Greens committee membership and roles" };
  }
  return null;
}

function buildSummaryBullets(
  sentences: string[],
  buckets: Record<string, string[]>
): string {
  const topics: SummaryTopic[] = [];
  const seen = new Set<string>();

  for (const s of sentences) {
    const t = topicFromSentence(s);
    if (!t || seen.has(t.label)) continue;
    seen.add(t.label);
    topics.push(t);
  }

  for (const s of [
    ...(buckets.action ?? []).filter((x) => scoreActionConfidence(x) >= 0.65),
    ...(buckets.tree ?? []).filter((x) => scoreTreeConfidence(x) >= 0.65),
    ...(buckets.capital ?? []).filter((x) => scoreCapitalConfidence(x) >= 0.65),
  ]) {
    const t = topicFromSentence(s);
    if (t && !seen.has(t.label)) {
      seen.add(t.label);
      topics.push(t);
    }
  }

  topics.sort((a, b) => b.score - a.score);
  const bullets = topics.slice(0, 5).map((t) => t.text.replace(/…/g, ""));

  const boardNotes = dedupeLines([
    ...(buckets.board ?? []),
    ...(buckets.decision ?? []).filter((s) => extractBoardRelevance(s)),
  ])
    .map((s) => compressActionTitle(s, 85))
    .filter((t) => t.length > 12 && !t.includes("…"))
    .slice(0, 4);

  return `## Draft Summary
${bullets.map((b) => `- ${b}`).join("\n") || "- Meeting discussion captured; review items below."}

## Key Discussion Topics
${bullets.map((b) => `- ${b}`).join("\n") || "- TBD"}

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

    if (passesTreeFilter(sentence)) {
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

  const actionCandidates: ExtractedActionItem[] = [];
  for (const sentence of buckets.action) {
    const confidence = scoreActionConfidence(sentence);
    if (confidence < 0.35) continue;
    actionCandidates.push({
      title: compressActionTitle(sentence),
      owner: inferOwner(sentence),
      priority: inferPriority(sentence),
      category: "Operations",
      due_date: null,
      hole_or_area: inferHoleOrArea(sentence),
      board_relevance: extractBoardRelevance(sentence),
      notes: null,
      confidence,
    });
  }
  const actionItems = dedupeByTitle(actionCandidates);

  const strategicCandidates: ExtractedStrategicProject[] = [];
  for (const sentence of buckets.strategic) {
    const confidence = scoreStrategicConfidence(sentence);
    if (confidence < 0.35) continue;
    strategicCandidates.push({
      title: compressActionTitle(sentence, 90),
      hole_or_area: inferHoleOrArea(sentence),
      category: "Strategic Plan",
      priority_tier: null,
      strategic_rationale: compressActionTitle(sentence, 120),
      notes: null,
      confidence,
    });
  }
  const strategicProjects = dedupeByTitle(strategicCandidates);

  const treeItems = dedupeByTitle(
    buckets.tree
      .map((sentence) => buildTreeItemFromSentence(sentence))
      .filter((x): x is ExtractedTreeItem => x != null)
  );

  const capitalItems = dedupeByTitle(
    buckets.capital
      .map((sentence) => buildCapitalItemFromSentence(sentence))
      .filter((x): x is ExtractedCapitalItem => x != null)
  );

  const feedbackCandidates: ExtractedMemberFeedback[] = [];
  for (const sentence of buckets.communication) {
    const confidence = scoreFeedbackConfidence(sentence);
    if (confidence < 0.35) continue;
    feedbackCandidates.push({
      topic: compressActionTitle(sentence, 80),
      category: "Member Communication",
      feedback_text: compressActionTitle(sentence, 120),
      source: null,
      status: "Open",
      owner: inferOwner(sentence),
      notes: null,
      confidence,
    });
  }
  const memberFeedback = dedupeByTopic(feedbackCandidates);

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
