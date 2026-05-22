export const MEETING_TYPES = [
  "Greens Committee",
  "Strategic Planning",
  "Board",
  "Town Hall",
  "Superintendent Sync",
  "Other",
] as const;

export const MEETING_STATUSES = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
] as const;

export const ACTION_STATUSES = [
  "Open",
  "In Progress",
  "Waiting",
  "Completed",
  "Deferred",
] as const;

export const ACTION_PRIORITIES = ["High", "Medium", "Low"] as const;

export const ACTION_CATEGORIES = [
  "Strategic Plan",
  "Committee Operations",
  "Tree Management",
  "Capital Planning",
  "Communications",
  "Member Experience",
  "Course Operations",
  "Equipment Planning",
  "Governance",
  "Course Improvements",
  "Institutional Knowledge",
] as const;

export const ACTION_OWNERS = [
  "Ryan",
  "Dwayne",
  "Committee",
  "Mike",
  "Stacey",
] as const;

export const PROJECT_CATEGORIES = [
  "Tee Complex",
  "Bunker",
  "Tree Management",
  "Cart Path",
  "Drainage",
  "Irrigation",
  "Greens Expansion",
  "Playability",
  "Safety",
  "Member Experience",
  "Maintenance Efficiency",
  "Strategic Architecture",
  "Shot Value",
] as const;

export const PROJECT_STATUSES = [
  "Concept",
  "In Review",
  "GC Feedback",
  "Strategic Committee Review",
  "Board Review",
  "Approved",
  "Deferred",
  "In Progress",
  "Completed",
] as const;

export const PRIORITY_TIERS = [
  "Tier 1 Foundational",
  "Tier 2 High Member Visibility",
  "Tier 3 Signature Transformational",
] as const;

export const COST_CLASSES = [
  "Under $10k",
  "$10k–$50k",
  "$50k–$150k",
  "$150k–$500k",
  "$500k+",
] as const;

export const LABOR_TYPES = ["In-House", "Contracted", "Mixed"] as const;

export const DISRUPTION_LEVELS = [
  "Minimal",
  "Moderate",
  "Significant",
  "Major",
] as const;

export const MEMBER_VISIBILITY = ["Low", "Medium", "High", "Very High"] as const;

export const TREE_TYPES = [
  "Oak",
  "Maple",
  "Pine",
  "Evergreen",
  "Ornamental",
  "Deadwood",
  "Other",
] as const;

export const TREE_ISSUES = [
  "Removal",
  "Pruning",
  "Planting",
  "Disease",
  "Storm damage",
  "Sight line",
  "Other",
] as const;

export const PERMIT_STATUSES = [
  "Not Required",
  "Pending",
  "Approved",
  "Denied",
] as const;

export const TREE_COMMITTEE_STATUSES = [
  "Open",
  "In Review",
  "Approved",
  "Deferred",
  "Completed",
] as const;

export const TREE_BOARD_STATUSES = [
  "Not Required",
  "Pending",
  "Approved",
  "Denied",
] as const;

export const TARGET_SEASONS = [
  "Spring",
  "Summer",
  "Fall",
  "Winter",
  "Off-season",
] as const;

export const CAPITAL_ITEM_TYPES = [
  "Equipment",
  "Infrastructure",
  "Irrigation",
  "Renovation",
  "Technology",
  "Other",
] as const;

export const CAPITAL_STATUSES = [
  "Under Review",
  "Approved",
  "In Progress",
  "Purchased",
  "Deferred",
  "Cancelled",
] as const;

export const COMMITTEE_MEMBER_STATUSES = ["Active", "Inactive", "Alumni"] as const;

export const FEEDBACK_CATEGORIES = [
  "Course Conditions",
  "Pace of Play",
  "Trees",
  "Bunkers",
  "Greens",
  "Cart Paths",
  "General",
] as const;

export const FEEDBACK_SOURCES = [
  "Member Survey",
  "Email",
  "Walk-through",
  "Board",
  "Committee",
  "Other",
] as const;

export const FEEDBACK_STATUSES = [
  "Open",
  "In Review",
  "Addressed",
  "Closed",
  "Deferred",
] as const;

export const MEETING_FILES_BUCKET = "meeting-files" as const;
