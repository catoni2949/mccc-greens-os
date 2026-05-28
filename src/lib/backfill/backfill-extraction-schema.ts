import { z } from "zod";
import {
  extractedActionItemSchema,
  extractedCapitalItemSchema,
  extractedMemberFeedbackSchema,
  extractedStrategicProjectSchema,
  extractedTreeItemSchema,
} from "@/lib/meeting-extraction-schema";

const confidence = z.number().min(0).max(1);

export const extractedMeetingSchema = z.object({
  clientKey: z.string(),
  title: z.string().min(1),
  meeting_date: z.string().nullable(),
  meeting_type: z.string().nullable(),
  status: z.string().nullable(),
  attendees: z.string().nullable(),
  agenda: z.string().nullable(),
  summary: z.string().nullable(),
  decisions: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: confidence,
});

export const extractedCommitteeMemberSchema = z.object({
  clientKey: z.string(),
  full_name: z.string().min(1),
  role: z.string().nullable(),
  status: z.string().nullable(),
  email: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: confidence,
});

export const extractedGovernanceSectionSchema = z.object({
  clientKey: z.string(),
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().nullable(),
  summary: z.string().nullable(),
  body: z.string().nullable(),
  appendToExisting: z.boolean().optional(),
  confidence: confidence,
});

export const extractedInstitutionalDecisionSchema = z.object({
  clientKey: z.string(),
  title: z.string().min(1),
  decision_date: z.string().nullable(),
  category: z.string().nullable(),
  rationale: z.string().nullable(),
  implementation_notes: z.string().nullable(),
  governance_section_slug: z.string().nullable(),
  confidence: confidence,
});

export const extractedMeetingTopicSchema = z.object({
  clientKey: z.string(),
  meetingClientKey: z.string().nullable(),
  topic_label: z.string().min(1),
  category: z.string().nullable(),
  hole_number: z.number().nullable(),
  board_relevant: z.boolean(),
  notes: z.string().nullable(),
  confidence: confidence,
});

export const extractedDiscussionMentionSchema = z.object({
  clientKey: z.string(),
  meetingClientKey: z.string().nullable(),
  mention_label: z.string().min(1),
  entity_type: z.string().nullable(),
  excerpt: z.string().nullable(),
  board_relevant: z.boolean(),
  confidence: confidence,
});

export const extractedEntityLinkSchema = z.object({
  clientKey: z.string(),
  source_label: z.string().min(1),
  target_label: z.string().min(1),
  link_type: z.string().nullable(),
  confidence: confidence,
});

export const backfillExtractionResultSchema = z.object({
  sourceSummary: z.string(),
  meetings: z.array(extractedMeetingSchema).max(5),
  actionItems: z.array(extractedActionItemSchema).max(20),
  strategicProjects: z.array(extractedStrategicProjectSchema).max(12),
  treeItems: z.array(extractedTreeItemSchema).max(12),
  capitalItems: z.array(extractedCapitalItemSchema).max(12),
  memberFeedback: z.array(extractedMemberFeedbackSchema).max(12),
  committeeMembers: z.array(extractedCommitteeMemberSchema).max(10),
  governanceSections: z.array(extractedGovernanceSectionSchema).max(12),
  institutionalDecisions: z.array(extractedInstitutionalDecisionSchema).max(15),
  meetingTopics: z.array(extractedMeetingTopicSchema).max(20),
  discussionMentions: z.array(extractedDiscussionMentionSchema).max(25),
  entityLinks: z.array(extractedEntityLinkSchema).max(15),
});

export type BackfillExtractionResult = z.infer<typeof backfillExtractionResultSchema>;
