import type {
  IdeaInput,
  ProductBrief,
  BuildPlan,
  LandingPage,
  Scaffold,
} from "../types";

/**
 * IdeaEngine — pluggable interface for idea → product generation.
 *
 * Swap MockIdeaEngine for an LLM-backed implementation (OpenAI, Anthropic, etc.)
 * without changing the pipeline or UI.
 */
export interface IdeaEngine {
  clarify(input: IdeaInput): Promise<ProductBrief>;
  plan(input: IdeaInput, brief: ProductBrief): Promise<BuildPlan>;
  landing(
    input: IdeaInput,
    brief: ProductBrief,
    plan: BuildPlan
  ): Promise<LandingPage>;
  scaffold(
    input: IdeaInput,
    brief: ProductBrief,
    plan: BuildPlan
  ): Promise<Scaffold>;
}

export type IdeaEngineFactory = () => IdeaEngine;
