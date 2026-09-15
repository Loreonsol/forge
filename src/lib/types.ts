export type Platform = "web" | "mobile" | "api";
export type Tone = "professional" | "playful" | "bold" | "minimal";

export type PipelineStage =
  | "queued"
  | "clarify"
  | "plan"
  | "landing"
  | "scaffold"
  | "complete"
  | "error";

export interface IdeaInput {
  idea: string;
  audience?: string;
  platform?: Platform;
  tone?: Tone;
}

export interface ProductBrief {
  nameOptions: string[];
  selectedName: string;
  oneLiner: string;
  targetUser: string;
  problem: string;
  valueProp: string;
  differentiators: string[];
}

export interface Milestone {
  title: string;
  description: string;
  estimate: string;
}

export interface BuildPlan {
  v0Features: string[];
  techStack: {
    frontend: string[];
    backend: string[];
    infra: string[];
  };
  milestones: Milestone[];
  outOfScope: string[];
}

export interface LandingPage {
  html: string;
  css: string;
  headline: string;
  subheadline: string;
  cta: string;
}

export interface ScaffoldFile {
  path: string;
  content: string;
}

export interface Scaffold {
  projectName: string;
  files: ScaffoldFile[];
  readme: string;
}

export interface ForgeRun {
  id: string;
  createdAt: string;
  updatedAt: string;
  input: IdeaInput;
  stage: PipelineStage;
  error?: string;
  brief?: ProductBrief;
  plan?: BuildPlan;
  landing?: LandingPage;
  scaffold?: Scaffold;
}

export interface CreateRunRequest {
  idea: string;
  audience?: string;
  platform?: Platform;
  tone?: Tone;
}
