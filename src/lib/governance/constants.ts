export const GOVERNANCE_CATEGORIES = {
  standards: "Institutional standards",
  procedures: "Operating procedures",
  meeting_governance: "Meeting governance",
  onboarding: "Onboarding",
  offboarding: "Offboarding",
  transition: "Chair transition",
  strategic_continuity: "Strategic continuity",
  archive: "Historical archive",
} as const;

export type GovernanceCategory = keyof typeof GOVERNANCE_CATEGORIES;

export const CHECKLIST_TYPES = {
  incoming_member: "New committee member",
  incoming_chair: "Incoming chair",
  outgoing_chair: "Outgoing chair",
} as const;
