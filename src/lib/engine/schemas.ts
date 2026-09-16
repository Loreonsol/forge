import { z } from "zod";

export const ProductBriefSchema = z.object({
  nameOptions: z.array(z.string().min(1)).min(1).max(8),
  selectedName: z.string().min(1),
  oneLiner: z.string().min(1),
  targetUser: z.string().min(1),
  problem: z.string().min(1),
  valueProp: z.string().min(1),
  differentiators: z.array(z.string().min(1)).min(1).max(8),
  refineNotes: z.array(z.string()).optional(),
});

export const MilestoneSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimate: z.string().min(1),
});

export const BuildPlanSchema = z.object({
  v0Features: z.array(z.string().min(1)).min(3).max(10),
  techStack: z.object({
    frontend: z.array(z.string().min(1)).min(1),
    backend: z.array(z.string().min(1)).min(1),
    infra: z.array(z.string().min(1)).min(1),
  }),
  milestones: z.array(MilestoneSchema).min(2).max(8),
  outOfScope: z.array(z.string().min(1)).min(1).max(10),
});

export const LandingPageSchema = z.object({
  html: z.string().min(40),
  css: z.string().optional().default(""),
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  cta: z.string().min(1),
});

export const RefineResultSchema = z.object({
  critique: z.string().optional(),
  brief: ProductBriefSchema,
});
