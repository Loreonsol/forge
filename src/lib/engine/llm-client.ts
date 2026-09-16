/**
 * Minimal OpenAI-compatible Chat Completions client.
 * Works with OpenAI (`https://api.openai.com/v1`) and xAI Grok (`https://api.x.ai/v1`).
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmClientConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  /** Per-request timeout (ms). Default 45s. */
  timeoutMs?: number;
  /** Extra attempts after the first failure. Default 1. */
  retries?: number;
};

export class LlmRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly body?: string
  ) {
    super(message);
    this.name = "LlmRequestError";
  }
}

function joinUrl(base: string, path: string): string {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

export async function chatCompletion(
  config: LlmClientConfig,
  messages: ChatMessage[],
  opts?: { temperature?: number; jsonMode?: boolean }
): Promise<string> {
  const timeoutMs = config.timeoutMs ?? 45_000;
  const retries = config.retries ?? 1;
  const url = joinUrl(config.baseUrl, "chat/completions");

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const body: Record<string, unknown> = {
        model: config.model,
        messages,
        temperature: opts?.temperature ?? 0.4,
      };
      // response_format is supported by OpenAI and many compatible APIs
      if (opts?.jsonMode !== false) {
        body.response_format = { type: "json_object" };
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await res.text();
      if (!res.ok) {
        throw new LlmRequestError(
          `LLM HTTP ${res.status}: ${text.slice(0, 400)}`,
          res.status,
          text
        );
      }

      let parsed: {
        choices?: { message?: { content?: string | null } }[];
      };
      try {
        parsed = JSON.parse(text) as typeof parsed;
      } catch {
        throw new LlmRequestError("LLM returned non-JSON envelope", res.status, text);
      }

      const content = parsed.choices?.[0]?.message?.content;
      if (!content || typeof content !== "string") {
        throw new LlmRequestError("LLM response missing message content", res.status, text);
      }
      return content;
    } catch (err) {
      lastError = err;
      const aborted =
        err instanceof Error &&
        (err.name === "AbortError" || /aborted/i.test(err.message));
      const retryable =
        aborted ||
        (err instanceof LlmRequestError &&
          (!err.status || err.status >= 500 || err.status === 429));
      if (attempt < retries && retryable) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      if (aborted) {
        throw new LlmRequestError(`LLM request timed out after ${timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new LlmRequestError("LLM request failed");
}

/** Strip markdown fences and extract a JSON object/array from model output. */
export function extractJsonText(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const startObj = s.indexOf("{");
  const startArr = s.indexOf("[");
  let start = -1;
  if (startObj >= 0 && (startArr < 0 || startObj < startArr)) start = startObj;
  else if (startArr >= 0) start = startArr;
  if (start < 0) return s;
  const open = s[start];
  const close = open === "{" ? "}" : "]";
  const end = s.lastIndexOf(close);
  if (end > start) return s.slice(start, end + 1);
  return s.slice(start);
}

export function parseJsonLoose(raw: string): unknown {
  const text = extractJsonText(raw);
  try {
    return JSON.parse(text);
  } catch {
    // Light repair: trailing commas
    const repaired = text.replace(/,\s*([}\]])/g, "$1");
    return JSON.parse(repaired);
  }
}
