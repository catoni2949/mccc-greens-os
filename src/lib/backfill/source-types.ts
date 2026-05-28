export const BACKFILL_SOURCE_TYPES = {
  meeting_minutes: "Meeting minutes",
  meeting_agenda: "Meeting agenda",
  email_thread: "Email thread",
  transcript: "Transcript",
  usga_report: "USGA / report / reference document",
  chair_note: "Chair note",
  board_prep_note: "Board prep note",
} as const;

export type BackfillSourceType = keyof typeof BACKFILL_SOURCE_TYPES;

export const BACKFILL_SESSION_KEY = "mccc_backfill_review_v1";
