# Forge

**Idea → product engine.** Drop in an idea; Forge clarifies a product brief, **refines** it for topical drift, drafts a build plan, generates a **live** marketing landing page (rendered HTML preview), and packs a downloadable Next.js starter repo.

> Build a company that builds companies.

Zero API keys required by default. The pipeline runs on a heuristic/template `MockIdeaEngine`, and automatically switches to a real LLM when `FORGE_LLM_API_KEY` is set.

## Quick start (Mac / Linux)

```bash
cd ~/forge   # or wherever you cloned the repo
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Try: *"AI meal planner for busy parents"*

Production build:

```bash
npm install
npm run build
npm start
```

No secrets or `.env` files are required for mock mode.

## What you get per run

| Stage | Output |
|-------|--------|
| **Clarify** | Name options, one-liner, target user, problem, value prop |
| **Refine** | Critique pass that fixes off-topic naming/tagline drift; refined brief is used downstream |
| **Plan** | v0 features, tech stack, milestones, out-of-scope |
| **Landing** | Full HTML/CSS landing page with in-app iframe preview + fullscreen |
| **Scaffold** | ZIP of a minimal Next.js app aligned to the plan |
| **PDF summary** | Client-side multi-page PDF (brief + plan + next steps) — no paid APIs |

Each run has an id and a results page with tabs: **Summary** · Brief · Plan · Landing · Scaffold. The home and results pages show an **Engine: Mock** or **Engine: LLM (model)** badge.

## IdeaEngine modes

| `FORGE_ENGINE` | Behavior |
|----------------|----------|
| `auto` (default) | Use LLM if `FORGE_LLM_API_KEY` is set; otherwise mock |
| `mock` | Always heuristic engine (zero keys) |
| `llm` | Prefer LLM; if the key is missing, fall back to mock (never crash construction) |

On any LLM step failure (timeout, HTTP error, bad JSON), Forge **falls back to `MockIdeaEngine` for that step**, logs the reason, and continues — so the pipeline does not die with an opaque 500 when mock can finish.

### Enable OpenAI

```bash
cp .env.example .env.local
# edit .env.local:
FORGE_ENGINE=auto
FORGE_LLM_API_KEY=sk-...
FORGE_LLM_BASE_URL=https://api.openai.com/v1
FORGE_LLM_MODEL=gpt-4o-mini
```

Then `npm run dev`.

### Enable xAI Grok

Same OpenAI-compatible Chat Completions client — only base URL + model change:

```bash
FORGE_ENGINE=auto
FORGE_LLM_API_KEY=xai-...
FORGE_LLM_BASE_URL=https://api.x.ai/v1
FORGE_LLM_MODEL=grok-2-latest
```

Check [xAI docs](https://docs.x.ai) for the latest model ids if `grok-2-latest` is renamed.

### Mac (`~/forge`) one-liner with env

```bash
cd ~/forge
export FORGE_LLM_API_KEY=sk-...   # or xai-...
export FORGE_LLM_BASE_URL=https://api.openai.com/v1
export FORGE_LLM_MODEL=gpt-4o-mini
npm run dev
```

Or put the same vars in `~/forge/.env.local` (gitignored).

## Architecture

```
src/
  app/
    page.tsx                 # Home — “What should we build?”
    runs/[id]/page.tsx      # Results + live pipeline progress
    api/runs/                # POST create, GET list / by id
    api/runs/[id]/scaffold/  # ZIP download
    api/engine/              # GET engine badge info (no secrets)
  components/                # Form, progress, tabs, previews, PDF, EngineBadge
  lib/
    types.ts                 # Shared domain types (incl. refine stage)
    store.ts                 # In-memory + data/runs.json persistence
    pipeline.ts              # Clarify → Refine → Plan → Landing → Scaffold
    zip.ts                   # JSZip packaging
    pdf-summary.ts           # Client-side jsPDF summary export
    engine/
      types.ts               # IdeaEngine interface (+ refine)
      mock-engine.ts         # Default heuristic engine (no keys)
      llm-engine.ts          # OpenAI-compatible LLM engine + mock fallback
      llm-client.ts          # Chat Completions client (timeout + 1 retry)
      schemas.ts             # Zod validators for structured JSON
      index.ts               # getIdeaEngine() / getEngineInfo()
```

### Pipeline flow

1. `POST /api/runs` creates a run (`stage: queued`) and starts the pipeline asynchronously.
2. Stages: **clarify → refine → plan → landing → scaffold → complete**.
3. The UI polls `GET /api/runs/:id` while stages advance (`refine` is a visible progress step).
4. Persistence is file-backed JSON under `data/runs.json` (gitignored) with an in-memory cache.

### IdeaEngine interface

```ts
interface IdeaEngine {
  clarify(input): Promise<ProductBrief>;
  refine(input, brief): Promise<ProductBrief>;
  plan(input, brief): Promise<BuildPlan>;
  landing(input, brief, plan): Promise<LandingPage>;
  scaffold(input, brief, plan): Promise<Scaffold>;
}
```

Scaffold stays template-based (seeded from the brief/plan). Clarify, refine, plan, and landing are the quality-critical LLM paths.

## Env vars

See [`.env.example`](./.env.example):

| Variable | Default | Notes |
|----------|---------|-------|
| `FORGE_ENGINE` | `auto` | `auto` \| `mock` \| `llm` |
| `FORGE_LLM_API_KEY` | — | Required for LLM |
| `FORGE_LLM_BASE_URL` | `https://api.openai.com/v1` | xAI: `https://api.x.ai/v1` |
| `FORGE_LLM_MODEL` | `gpt-4o-mini` | e.g. `grok-2-latest` on xAI |

Never commit `.env` / `.env.local` — only `.env.example` is tracked.

## PDF export

On a completed (or brief-ready) run, click **Download PDF** near the results header or on the Summary tab. Forge builds `{product-name}-forge-summary.pdf` in the browser with [jsPDF](https://github.com/parallax/jsPDF) — product name, one-liner, brief, build plan, and next steps. No external paid APIs or secrets. The scaffold **ZIP** download remains available separately.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- Zod (LLM JSON validation)
- JSZip (scaffold ZIP download)
- jsPDF (client-side summary PDF)
- Local JSON persistence (no database required)

## Out of scope (by design)

Auth, payments, multi-tenant SaaS, and auto-deploy of generated products.

## License

Private repository — all rights reserved unless otherwise noted.
