import { z } from "zod";

const prioritySchema = z.enum(["High", "Medium", "Low"]);

const confidenceSchema = z.number().min(0).max(1);

export const extractedActionItemSchema = z.object({
  title: z.string().min(1),
  owner: z.string().nullable(),
  priority: prioritySchema,
  category: z.string().nullable(),
  due_date: z.string().nullable(),
  hole_or_area: z.string().nullable(),
  board_relevance: z.boolean(),
  notes: z.string().nullable(),
  confidence: confidenceSchema,
});

export const extractedStrategicProjectSchema = z.object({
  title: z.string().min(1),
  hole_or_area: z.string().nullable(),
  category: z.string().nullable(),
  priority_tier: z.string().nullable(),
  strategic_rationale: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: confidenceSchema,
});

export const extractedTreeItemSchema = z.object({
  title: z.string().min(1),
  hole_or_area: z.string().nullable(),
  tree_type: z.string().nullable(),
  rationale: z.string().nullable(),
  permit_status: z.string().nullable(),
  committee_status: z.string().nullable(),
  board_status: z.string().nullable(),
  target_season: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: confidenceSchema,
});

export const extractedCapitalItemSchema = z.object({
  title: z.string().min(1),
  item_type: z.string().nullable(),
  estimated_cost: z.number().nullable(),
  target_year: z.number().nullable(),
  priority: prioritySchema,
  status: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: confidenceSchema,
});

export const extractedMemberFeedbackSchema = z.object({
  topic: z.string().min(1),
  category: z.string().nullable(),
  feedback_text: z.string().nullable(),
  source: z.string().nullable(),
  status: z.string().nullable(),
  owner: z.string().nullable(),
  notes: z.string().nullable(),
  confidence: confidenceSchema,
});

export const meetingExtractionResultSchema = z.object({
  summary: z.string(),
  decisions: z.string(),
  actionItems: z.array(extractedActionItemSchema).max(12),
  strategicProjects: z.array(extractedStrategicProjectSchema).max(8),
  treeItems: z.array(extractedTreeItemSchema).max(8),
  capitalItems: z.array(extractedCapitalItemSchema).max(8),
  memberFeedback: z.array(extractedMemberFeedbackSchema).max(8),
});

export type MeetingExtractionResultParsed = z.infer<
  typeof meetingExtractionResultSchema
>;
