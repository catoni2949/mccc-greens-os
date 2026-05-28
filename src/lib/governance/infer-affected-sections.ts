import { BIBLE_FRAMEWORK_SECTIONS } from "@/lib/governance/bible-framework";

export type InferInput = {
  text?: string;
  actionTitles?: string[];
  treeTitles?: string[];
  projectTitles?: string[];
  capitalTitles?: string[];
  feedbackTopics?: string[];
  hasBoardRelevance?: boolean;
  hasTranscript?: boolean;
};

type Rule = {
  slug: string;
  patterns: RegExp[];
};

const RULES: Rule[] = [
  {
    slug: "tree-management-philosophy",
    patterns: [/tree/i, /removal/i, /airflow/i, /sunlight/i, /corridor/i, /species/i],
  },
  {
    slug: "board-liaison-update-process",
    patterns: [/board/i, /liaison/i, /approval/i, /awareness/i],
  },
  {
    slug: "chair-role-expectations",
    patterns: [/chair/i, /agenda/i, /minutes/i],
  },
  {
    slug: "meeting-cadence-agenda-structure",
    patterns: [/meeting/i, /agenda/i, /minutes/i, /cadence/i],
  },
  {
    slug: "strategic-plan-governance",
    patterns: [/strategic/i, /master plan/i, /town hall/i, /tier/i],
  },
  {
    slug: "ted-robinson-design-restoration",
    patterns: [/robinson/i, /restoration/i, /design intent/i, /sympathetic/i],
  },
  {
    slug: "forward-family-tee-philosophy",
    patterns: [/tee/i, /forward/i, /family/i, /junior/i, /pace of play/i, /scorecard/i],
  },
  {
    slug: "capital-equipment-planning",
    patterns: [/capital/i, /equipment/i, /mower/i, /budget/i, /funding/i],
  },
  {
    slug: "bunker-program-sand-strategy",
    patterns: [/bunker/i, /sand/i],
  },
  {
    slug: "irrigation-water-management",
    patterns: [/irrigation/i, /water/i, /pump/i],
  },
  {
    slug: "member-communication-standards",
    patterns: [
      /member/i,
      /newsletter/i,
      /communication/i,
      /education/i,
      /ball mark/i,
      /bunker rake/i,
    ],
  },
  {
    slug: "committee-member-onboarding",
    patterns: [/onboard/i, /new member/i, /ally/i, /open seat/i],
  },
  {
    slug: "committee-member-offboarding",
    patterns: [/offboard/i, /depart/i, /step down/i, /lucinda/i],
  },
  {
    slug: "chair-succession-plan",
    patterns: [/succession/i, /handoff/i, /incoming chair/i, /outgoing chair/i],
  },
  {
    slug: "superintendent-coordination",
    patterns: [/superintendent/i, /agronom/i, /maintenance/i],
  },
  {
    slug: "historical-decisions-rationale",
    patterns: [/decision/i, /rationale/i, /resolved/i],
  },
  {
    slug: "committee-mission-operating-philosophy",
    patterns: [/mission/i, /philosophy/i, /operating/i],
  },
  {
    slug: "annual-planning-calendar",
    patterns: [/annual/i, /calendar/i, /fall approval/i],
  },
];

const SLUG_TO_TITLE = new Map<string, string>(
  BIBLE_FRAMEWORK_SECTIONS.map((s) => [s.slug, s.title])
);

export function inferAffectedGovernanceSections(
  input: InferInput
): { slugs: string[]; titles: string[] } {
  const blob = [
    input.text ?? "",
    ...(input.actionTitles ?? []),
    ...(input.treeTitles ?? []),
    ...(input.projectTitles ?? []),
    ...(input.capitalTitles ?? []),
    ...(input.feedbackTopics ?? []),
  ].join("\n");

  if (input.hasBoardRelevance) {
    // always consider board + chair sections
  }

  const slugs = new Set<string>();

  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(blob))) {
      slugs.add(rule.slug);
    }
  }

  if (input.hasBoardRelevance) {
    slugs.add("board-liaison-update-process");
    slugs.add("chair-role-expectations");
  }
  if ((input.treeTitles?.length ?? 0) > 0) {
    slugs.add("tree-management-philosophy");
  }
  if ((input.projectTitles?.length ?? 0) > 0) {
    slugs.add("strategic-plan-governance");
  }
  if ((input.feedbackTopics?.length ?? 0) > 0) {
    slugs.add("member-communication-standards");
  }
  if (input.hasTranscript) {
    slugs.add("meeting-cadence-agenda-structure");
    slugs.add("historical-decisions-rationale");
  }

  const slugList = Array.from(slugs).slice(0, 6);
  return {
    slugs: slugList,
    titles: slugList.map((s) => SLUG_TO_TITLE.get(s) ?? s),
  };
}
