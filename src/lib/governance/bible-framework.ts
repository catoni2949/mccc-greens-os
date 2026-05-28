export const BIBLE_FRAMEWORK_SECTIONS = [
  {
    slug: "committee-mission-operating-philosophy",
    title: "Committee Mission and Operating Philosophy",
  },
  { slug: "chair-role-expectations", title: "Chair Role and Expectations" },
  {
    slug: "meeting-cadence-agenda-structure",
    title: "Meeting Cadence and Agenda Structure",
  },
  {
    slug: "board-liaison-update-process",
    title: "Board Liaison and Board Update Process",
  },
  { slug: "superintendent-coordination", title: "Superintendent Coordination" },
  { slug: "strategic-plan-governance", title: "Strategic Plan Governance" },
  {
    slug: "ted-robinson-design-restoration",
    title: "Ted Robinson Design Intent and Restoration Philosophy",
  },
  { slug: "tree-management-philosophy", title: "Tree Management Philosophy" },
  {
    slug: "forward-family-tee-philosophy",
    title: "Forward/Family Tee Philosophy",
  },
  { slug: "capital-equipment-planning", title: "Capital and Equipment Planning" },
  { slug: "bunker-program-sand-strategy", title: "Bunker Program and Sand Strategy" },
  {
    slug: "irrigation-water-management",
    title: "Irrigation and Water Management Constraints",
  },
  {
    slug: "member-communication-standards",
    title: "Member Communication Standards",
  },
  { slug: "committee-member-onboarding", title: "Committee Member Onboarding" },
  { slug: "committee-member-offboarding", title: "Committee Member Offboarding" },
  { slug: "chair-succession-plan", title: "Chair Succession Plan" },
  { slug: "annual-planning-calendar", title: "Annual Planning Calendar" },
  {
    slug: "historical-decisions-rationale",
    title: "Historical Decisions and Rationale",
  },
] as const;

export const BIBLE_SECTION_SLUGS = BIBLE_FRAMEWORK_SECTIONS.map((s) => s.slug);
