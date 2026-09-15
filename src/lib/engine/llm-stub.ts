import type {
  IdeaInput,
  ProductBrief,
  BuildPlan,
  LandingPage,
  Scaffold,
} from "../types";
import type { IdeaEngine } from "./types";

/**
 * Stub for a real LLM-backed IdeaEngine.
 *
 * To plug in OpenAI / Anthropic / etc:
 * 1. Set FORGE_ENGINE=llm and provide FORGE_LLM_API_KEY
 * 2. Implement the four methods below with structured prompts
 * 3. Keep return types identical so the pipeline/UI stay unchanged
 *
 * This stub always throws — it is documentation + type scaffolding only.
 */
export class LlmIdeaEngine implements IdeaEngine {
  constructor(private readonly apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "LlmIdeaEngine requires an API key. Set FORGE_LLM_API_KEY or use MockIdeaEngine."
      );
    }
  }

  async clarify(_input: IdeaInput): Promise<ProductBrief> {
    throw new Error(
      "LlmIdeaEngine.clarify is not implemented. Use MockIdeaEngine or implement your LLM calls here."
    );
  }

  async plan(_input: IdeaInput, _brief: ProductBrief): Promise<BuildPlan> {
    throw new Error("LlmIdeaEngine.plan is not implemented.");
  }

  async landing(
    _input: IdeaInput,
    _brief: ProductBrief,
    _plan: BuildPlan
  ): Promise<LandingPage> {
    throw new Error("LlmIdeaEngine.landing is not implemented.");
  }

  async scaffold(
    _input: IdeaInput,
    _brief: ProductBrief,
    _plan: BuildPlan
  ): Promise<Scaffold> {
    throw new Error("LlmIdeaEngine.scaffold is not implemented.");
  }
}
