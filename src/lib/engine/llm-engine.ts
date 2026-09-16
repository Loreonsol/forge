import type {
  IdeaInput,
  ProductBrief,
  BuildPlan,
  LandingPage,
  Scaffold,
} from "../types";
import type { IdeaEngine } from "./types";
import { MockIdeaEngine } from "./mock-engine";
import {
  chatCompletion,
  parseJsonLoose,
  type LlmClientConfig,
} from "./llm-client";
import {
  ProductBriefSchema,
  BuildPlanSchema,
  LandingPageSchema,
  RefineResultSchema,
} from "./schemas";

export type LlmIdeaEngineOptions = {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  timeoutMs?: number;
};

function logFallback(step: string, reason: unknown) {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.warn(`[Forge LlmIdeaEngine] ${step} failed — falling back to mock: ${msg}`);
}

function ensureSelectedName(brief: ProductBrief): ProductBrief {
  const selected =
    brief.selectedName?.trim() ||
    brief.nameOptions?.[0]?.trim() ||
    "Nova";
  const nameOptions =
    brief.nameOptions?.length > 0
      ? brief.nameOptions
      : [selected];
  if (!nameOptions.includes(selected)) {
    nameOptions.unshift(selected);
  }
  return { ...brief, selectedName: selected, nameOptions };
}

function landingLooksValid(html: string): boolean {
  const lower = html.toLowerCase();
  return (
    html.length > 80 &&
    (lower.includes("<html") || lower.includes("<!doctype")) &&
    (lower.includes("<body") || lower.includes("<h1"))
  );
}

/**
 * OpenAI-compatible LLM IdeaEngine (OpenAI + xAI Grok).
 * On any step failure, falls back to MockIdeaEngine so the pipeline never crashes
 * with an opaque 500 when mock can finish.
 */
export class LlmIdeaEngine implements IdeaEngine {
  private readonly config: LlmClientConfig;
  private readonly mock = new MockIdeaEngine();

  readonly model: string;
  readonly baseUrl: string;

  constructor(opts: LlmIdeaEngineOptions | string) {
    const normalized =
      typeof opts === "string"
        ? { apiKey: opts }
        : opts;
    if (!normalized.apiKey) {
      throw new Error(
        "LlmIdeaEngine requires an API key. Set FORGE_LLM_API_KEY or use MockIdeaEngine."
      );
    }
    this.baseUrl =
      normalized.baseUrl?.replace(/\/+$/, "") ||
      process.env.FORGE_LLM_BASE_URL?.replace(/\/+$/, "") ||
      "https://api.openai.com/v1";
    this.model =
      normalized.model ||
      process.env.FORGE_LLM_MODEL ||
      "gpt-4o-mini";
    this.config = {
      apiKey: normalized.apiKey,
      baseUrl: this.baseUrl,
      model: this.model,
      timeoutMs: normalized.timeoutMs ?? 45_000,
      retries: 1,
    };
  }

  private async jsonCall<T>(
    step: string,
    system: string,
    user: string,
    parse: (data: unknown) => T
  ): Promise<T> {
    const raw = await chatCompletion(this.config, [
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    const data = parseJsonLoose(raw);
    return parse(data);
  }

  async clarify(input: IdeaInput): Promise<ProductBrief> {
    try {
      const brief = await this.jsonCall(
        "clarify",
        `You are Forge, a product ideation engine. Return ONLY valid JSON matching this shape:
{
  "nameOptions": string[3-5] brandable product names tightly tied to the idea,
  "selectedName": string (best of nameOptions),
  "oneLiner": string (≤110 chars, names the product and what it does for whom),
  "targetUser": string,
  "problem": string (2-3 sentences, concrete pain),
  "valueProp": string,
  "differentiators": string[3-5]
}
Rules: Stay on-topic for the user's idea. Do NOT invent unrelated domains (e.g. no "spreadsheets" for a tip jar app). Names and tagline must clearly match the idea.`,
        JSON.stringify({
          idea: input.idea,
          audience: input.audience || null,
          platform: input.platform || "web",
          tone: input.tone || "professional",
        }),
        (data) => ensureSelectedName(ProductBriefSchema.parse(data))
      );
      return brief;
    } catch (err) {
      logFallback("clarify", err);
      return this.mock.clarify(input);
    }
  }

  async refine(input: IdeaInput, brief: ProductBrief): Promise<ProductBrief> {
    try {
      const result = await this.jsonCall(
        "refine",
        `You critique and refine a product brief for topical fidelity.
Return ONLY JSON:
{
  "critique": string (short notes on any drift),
  "brief": { same ProductBrief fields as clarify }
}
Fix: off-topic naming, tagline drift, wrong audience metaphors, generic filler that contradicts the idea.
Keep strong parts. Names/oneLiner/valueProp MUST clearly match the original idea.`,
        JSON.stringify({
          idea: input.idea,
          audience: input.audience || null,
          platform: input.platform || "web",
          tone: input.tone || "professional",
          brief,
        }),
        (data) => {
          const parsed = RefineResultSchema.parse(data);
          if (parsed.critique) {
            console.info(`[Forge refine] ${parsed.critique}`);
          }
          return ensureSelectedName(parsed.brief);
        }
      );
      return result;
    } catch (err) {
      logFallback("refine", err);
      return this.mock.refine(input, brief);
    }
  }

  async plan(input: IdeaInput, brief: ProductBrief): Promise<BuildPlan> {
    try {
      return await this.jsonCall(
        "plan",
        `You draft a crisp v0 build plan. Return ONLY JSON:
{
  "v0Features": string[4-6] concrete features for first ship,
  "techStack": { "frontend": string[], "backend": string[], "infra": string[] },
  "milestones": [{ "title": string, "description": string, "estimate": string }] (3-5),
  "outOfScope": string[3-5]
}
Align features with the brief. Prefer Next.js / TypeScript for web unless platform says otherwise.
Platform hint: ${input.platform || "web"}.`,
        JSON.stringify({ idea: input.idea, brief, platform: input.platform || "web" }),
        (data) => BuildPlanSchema.parse(data)
      );
    } catch (err) {
      logFallback("plan", err);
      return this.mock.plan(input, brief);
    }
  }

  async landing(
    input: IdeaInput,
    brief: ProductBrief,
    plan: BuildPlan
  ): Promise<LandingPage> {
    try {
      const landing = await this.jsonCall(
        "landing",
        `You write a single-file marketing landing page as JSON:
{
  "html": string — FULL HTML document (doctype, head with <style>, body) suitable for iframe srcdoc preview,
  "css": string — the CSS also embedded in html (may duplicate; can be empty if fully inline),
  "headline": string,
  "subheadline": string,
  "cta": string
}
Design: dark modern aesthetic, responsive, no external scripts/fonts/CDNs.
Tone: ${input.tone || "professional"}. Product: ${brief.selectedName}.
Use brief + plan features for copy. Escape content safely inside HTML.`,
        JSON.stringify({
          idea: input.idea,
          brief,
          features: plan.v0Features.slice(0, 4),
          tone: input.tone || "professional",
        }),
        (data) => LandingPageSchema.parse(data)
      );

      if (!landingLooksValid(landing.html)) {
        throw new Error("LLM landing HTML failed validation");
      }
      // Prefer CSS extracted from <style> if css field empty
      if (!landing.css) {
        const m = landing.html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
        if (m) landing.css = m[1];
      }
      return landing;
    } catch (err) {
      logFallback("landing", err);
      return this.mock.landing(input, brief, plan);
    }
  }

  async scaffold(
    input: IdeaInput,
    brief: ProductBrief,
    plan: BuildPlan
  ): Promise<Scaffold> {
    // Template-based scaffold seeded from LLM brief/plan — more reliable than LLM-emitted files.
    try {
      return await this.mock.scaffold(input, brief, plan);
    } catch (err) {
      logFallback("scaffold", err);
      return this.mock.scaffold(input, brief, plan);
    }
  }
}
