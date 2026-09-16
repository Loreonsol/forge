export type Platform = "web" | "mobile" | "api";
export type Tone = "professional" | "playful" | "bold" | "minimal" | "friendly";

export type PipelineStage =
  | "queued"
  | "clarify"
  | "refine"
  | "plan"
  | "landing"
  | "scaffold"
  | "complete"
  | "error";

export type EngineMode = "mock" | "llm";

/** Coarse domains used by mock anti-drift templates. */
export type ProductDomain =
  | "travel"
  | "tips"
  | "food"
  | "household"
  | "productivity"
  | "generic";

export interface EngineInfo {
  mode: EngineMode;
  /** Resolved FORGE_ENGINE setting (auto|mock|llm). */
  setting: "auto" | "mock" | "llm";
  /** Present when mode is llm. */
  model?: string;
  baseUrl?: string;
  label: string;
}

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
  /** What refine changed (mock or LLM critique). */
  refineNotes?: string[];
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

/** Brand continuity threaded into landing + scaffold. */
export interface BrandKit {
  name: string;
  primary: string;
  accent: string;
  voiceAdjectives: string[];
  logoMarkLetter: string;
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
  /** Derived once after refine. */
  brandKit?: BrandKit;
  /** Which engine produced this run (set at pipeline start). */
  engine?: EngineInfo;
}

export interface CreateRunRequest {
  idea: string;
  audience?: string;
  platform?: Platform;
  tone?: Tone;
}
