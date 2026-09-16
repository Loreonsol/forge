import type { EngineInfo } from "../types";
import type { IdeaEngine } from "./types";
import { MockIdeaEngine } from "./mock-engine";
import { LlmIdeaEngine } from "./llm-engine";

export type { IdeaEngine } from "./types";
export { MockIdeaEngine } from "./mock-engine";
export { LlmIdeaEngine } from "./llm-engine";

function envSetting(): "auto" | "mock" | "llm" {
  const raw = (process.env.FORGE_ENGINE || "auto").toLowerCase().trim();
  if (raw === "mock" || raw === "llm" || raw === "auto") return raw;
  return "auto";
}

function llmEnv() {
  return {
    apiKey: (process.env.FORGE_LLM_API_KEY || "").trim(),
    baseUrl: (
      process.env.FORGE_LLM_BASE_URL || "https://api.openai.com/v1"
    ).replace(/\/+$/, ""),
    model: process.env.FORGE_LLM_MODEL || "gpt-4o-mini",
  };
}

/**
 * Resolve which engine will run — never throws when key is missing in auto mode.
 */
export function getEngineInfo(): EngineInfo {
  const setting = envSetting();
  const { apiKey, baseUrl, model } = llmEnv();

  if (setting === "mock") {
    return { mode: "mock", setting, label: "Engine: Mock" };
  }

  if (setting === "llm") {
    if (!apiKey) {
      return {
        mode: "mock",
        setting,
        label: "Engine: Mock",
      };
    }
    return {
      mode: "llm",
      setting,
      model,
      baseUrl,
      label: `Engine: LLM (${model})`,
    };
  }

  // auto
  if (apiKey) {
    return {
      mode: "llm",
      setting: "auto",
      model,
      baseUrl,
      label: `Engine: LLM (${model})`,
    };
  }
  return { mode: "mock", setting: "auto", label: "Engine: Mock" };
}

/**
 * Resolve the active IdeaEngine.
 * Default (auto): LLM when FORGE_LLM_API_KEY is set, otherwise MockIdeaEngine.
 * FORGE_ENGINE=mock|llm|auto still supported.
 * Never throws at construction when key missing in auto mode — uses mock.
 */
export function getIdeaEngine(): IdeaEngine {
  const info = getEngineInfo();
  if (info.mode === "llm") {
    const { apiKey } = llmEnv();
    // Defensive: getEngineInfo only returns llm when key exists
    if (!apiKey) {
      console.warn(
        "[Forge] FORGE_ENGINE requested llm but FORGE_LLM_API_KEY is missing; using MockIdeaEngine"
      );
      return new MockIdeaEngine();
    }
    try {
      return new LlmIdeaEngine({
        apiKey,
        baseUrl: info.baseUrl,
        model: info.model,
      });
    } catch (err) {
      console.warn(
        "[Forge] Failed to construct LlmIdeaEngine; using MockIdeaEngine:",
        err instanceof Error ? err.message : err
      );
      return new MockIdeaEngine();
    }
  }
  return new MockIdeaEngine();
}
