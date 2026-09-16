# Forge

**Idea → product engine.** Drop in an idea; Forge clarifies a product brief, drafts a build plan, generates a **live** marketing landing page (rendered HTML preview), and packs a downloadable Next.js starter repo.

> Build a company that builds companies.

Zero API keys required by default. The pipeline runs entirely on a heuristic/template `MockIdeaEngine`.

## Quick start

```bash
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

No secrets or `.env` files are required.

## What you get per run

| Stage | Output |
|-------|--------|
| **Clarify** | Name options, one-liner, target user, problem, value prop |
| **Plan** | v0 features, tech stack, milestones, out-of-scope |
| **Landing** | Full HTML/CSS landing page with in-app iframe preview + fullscreen |
| **Scaffold** | ZIP of a minimal Next.js app aligned to the plan |
| **PDF summary** | Client-side multi-page PDF (brief + plan + next steps) — no paid APIs |

Each run has an id and a results page with tabs: **Summary** · Brief · Plan · Landing · Scaffold. Actions include copy summary/brief/plan, copy shareable run link, fullscreen landing, **Download PDF**, and **Download scaffold ZIP** (both kept).

## Architecture

```
src/
  app/
    page.tsx                 # Home — “What should we build?”
    runs/[id]/page.tsx      # Results + live pipeline progress
    api/runs/                # POST create, GET list / by id
    api/runs/[id]/scaffold/  # ZIP download
  components/                # Form, progress, tabs, previews, PDF button
  lib/
    types.ts                 # Shared domain types
    store.ts                 # In-memory + data/runs.json persistence
    pipeline.ts              # Orchestrates Clarify → Plan → Landing → Scaffold
    zip.ts                   # JSZip packaging
    pdf-summary.ts           # Client-side jsPDF summary export
    engine/
      types.ts               # IdeaEngine interface
      mock-engine.ts         # Default heuristic engine (no keys)
      llm-stub.ts            # Stub showing how to plug in a real LLM
      index.ts               # getIdeaEngine() resolver
```

### Pipeline flow

1. `POST /api/runs` creates a run (`stage: queued`) and starts the pipeline asynchronously.
2. The UI polls `GET /api/runs/:id` while stages advance.
3. Persistence is file-backed JSON under `data/runs.json` (gitignored) with an in-memory cache.

### IdeaEngine interface

```ts
interface IdeaEngine {
  clarify(input): Promise<ProductBrief>;
  plan(input, brief): Promise<BuildPlan>;
  landing(input, brief, plan): Promise<LandingPage>;
  scaffold(input, brief, plan): Promise<Scaffold>;
}
```

`getIdeaEngine()` returns `MockIdeaEngine` unless `FORGE_ENGINE=llm`.

## Swapping in a real LLM

1. Implement the four methods in `src/lib/engine/llm-stub.ts` (or a new file) with structured prompts / JSON schema outputs matching `ProductBrief`, `BuildPlan`, `LandingPage`, and `Scaffold`.
2. Set environment variables:

```bash
FORGE_ENGINE=llm
FORGE_LLM_API_KEY=sk-...
```

3. Keep return shapes identical so the UI and ZIP download need no changes.
4. Optionally keep `MockIdeaEngine` as a fallback when the key is missing.

## PDF export

On a completed (or brief-ready) run, click **Download PDF** near the results header or on the Summary tab. Forge builds `{product-name}-forge-summary.pdf` in the browser with [jsPDF](https://github.com/parallax/jsPDF) — product name, one-liner, brief, build plan, and next steps. No external paid APIs or secrets. The scaffold **ZIP** download remains available separately.

## Tech stack

- Next.js App Router + TypeScript
- Tailwind CSS v4
- JSZip (scaffold ZIP download)
- jsPDF (client-side summary PDF)
- Local JSON persistence (no database required)

## Out of scope (by design)

Auth, payments, multi-tenant SaaS, and auto-deploy of generated products.

## License

Private repository — all rights reserved unless otherwise noted.
