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
| **Scaffold** | ZIP of a minimal Next.js app aligned to the plan (+ brand CSS vars) |
| **Brand kit** | Name, primary/accent colours, voice adjectives, logo mark — on Summary + threaded into landing/scaffold |
| **Deploy** | One-click Vercel when `VERCEL_TOKEN` is set; otherwise ZIP + `npx vercel` / vercel.com/new guide |
| **PDF summary** | Client-side multi-page PDF (brief + plan + next steps) — no paid APIs |

Each run has an id and a results page with tabs: **Summary** · Brief · Plan · Landing · Scaffold. The home and results pages show an **Engine: Mock** or **Engine: LLM (model)** badge. Mock refine is domain-aware (travel, tips/payroll, food/household, productivity, generic) to stop copy drifting into spreadsheet/finance tropes.

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
    api/runs/[id]/deploy/    # Vercel API deploy or manual instructions
    api/engine/              # GET engine badge info (no secrets)
  components/                # Form, progress, tabs, previews, PDF, Deploy, EngineBadge
  lib/
    types.ts                 # Shared domain types (incl. BrandKit, refine)
    brand-kit.ts             # deriveBrandKit() after refine
    store.ts                 # In-memory + data/runs.json persistence
    pipeline.ts              # Clarify → Refine → Brand → Plan → Landing → Scaffold
    zip.ts                   # JSZip packaging
    pdf-summary.ts           # Client-side jsPDF summary export
    engine/
      types.ts               # IdeaEngine interface (+ refine)
      domain.ts              # Domain classifier + anti-drift helpers
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
| `VERCEL_TOKEN` | — | Optional. Enables API deploy from Summary/Scaffold |
| `VERCEL_ORG_ID` | — | Optional Vercel team id |
| `VERCEL_PROJECT_ID` | — | Optional existing Vercel project id |

Never commit `.env` / `.env.local` — only `.env.example` is tracked.

## Deploy (generated products)

On **Summary** or **Scaffold**, use **Deploy with Vercel**:

1. **With `VERCEL_TOKEN`** on the Forge host — `POST /api/runs/:id/deploy` uploads scaffold files to the [Vercel Deployments API](https://vercel.com/docs/rest-api/endpoints/deployments) and returns the deployment URL when available.
2. **Without a token** — same button returns a manual guide: download ZIP → `npm install` → `npx vercel`, or import at [vercel.com/new](https://vercel.com/new). **Open deploy guide** and **Copy npx vercel** always work.

No Cloud Agents required. StackBlitz/github.dev import is skipped for generated ZIPs (no public git URL).

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

Auth, payments, and multi-tenant SaaS. Deploy is optional via VERCEL_TOKEN or manual `npx vercel` — not Cloud Agents.

## License

Private repository — all rights reserved unless otherwise noted.
