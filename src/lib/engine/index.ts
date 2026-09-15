import type { IdeaEngine } from "./types";
import { MockIdeaEngine } from "./mock-engine";
import { LlmIdeaEngine } from "./llm-stub";

export type { IdeaEngine } from "./types";
export { MockIdeaEngine } from "./mock-engine";
export { LlmIdeaEngine } from "./llm-stub";

/**
 * Resolve the active IdeaEngine.
 * Default: MockIdeaEngine (zero API keys).
 * Optional: FORGE_ENGINE=llm + FORGE_LLM_API_KEY for a future LLM impl.
 */
export function getIdeaEngine(): IdeaEngine {
  const mode = (process.env.FORGE_ENGINE || "mock").toLowerCase();
  if (mode === "llm") {
    const key = process.env.FORGE_LLM_API_KEY || "";
    return new LlmIdeaEngine(key);
  }
  return new MockIdeaEngine();
}
