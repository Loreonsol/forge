import type {
  IdeaInput,
  ProductBrief,
  BuildPlan,
  LandingPage,
  Scaffold,
  Tone,
  Platform,
} from "../types";
import type { IdeaEngine } from "./types";

/** Lightweight delay so the UI can show stage progress. */
function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function titleCase(s: string): string {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Extract noun-ish keywords from the idea for naming & copy. */
function extractKeywords(idea: string): string[] {
  const stop = new Set([
    "a",
    "an",
    "the",
    "for",
    "to",
    "and",
    "or",
    "of",
    "in",
    "on",
    "with",
    "that",
    "this",
    "app",
    "tool",
    "platform",
    "product",
    "service",
    "build",
    "create",
    "make",
    "help",
    "using",
    "based",
    "like",
    "our",
    "my",
    "we",
    "us",
    "who",
    "want",
    "need",
    "just",
    "from",
    "into",
    "about",
  ]);
  return idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w))
    .slice(0, 8);
}

function detectDomain(idea: string, keywords: string[]): string {
  const text = idea.toLowerCase();
  const domains: [RegExp, string][] = [
    [/housemate|roommate|flatmate|chore|household|shared.?house|split.?bill/, "household"],
    [/dinner|meal|food|recipe|nutrition|diet|cook|grocery|kitchen/, "food"],
    [/fitness|workout|gym|health|wellness/, "health"],
    [/finance|budget|money|invest|bank|pay/, "finance"],
    [/edu|learn|course|tutor|study|school/, "education"],
    [/market|crm|sales|lead|b2b|saas/, "saas"],
    [/social|community|chat|network|friend/, "social"],
    [/travel|trip|flight|hotel|booking/, "travel"],
    [/job|hire|recruit|career|resume/, "career"],
    [/ai|ml|llm|gpt|agent|automat/, "ai"],
    [/focus|timer|pomodoro|productivity|deep.?work|distraction/, "productivity"],
    [/shop|e-?commerce|store|retail/, "commerce"],
  ];
  for (const [re, d] of domains) {
    if (re.test(text) || keywords.some((k) => re.test(k))) return d;
  }
  return "general";
}

const NAME_SUFFIXES = [
  "ly",
  "ify",
  "hub",
  "kit",
  "lab",
  "forge",
  "spark",
  "nest",
  "flow",
  "pulse",
];

function inventNames(idea: string, keywords: string[]): string[] {
  const primary = keywords[0] || "nova";
  const secondary = keywords[1] || "spark";
  const base = titleCase(primary);
  const names: string[] = [];
  const push = (n: string) => {
    if (n && !names.includes(n)) names.push(n);
  };

  // Prefer domain-flavored brandables first (selectedName = names[0])
  const low = idea.toLowerCase();
  if (/housemate|roommate|flatmate|chore|household/.test(low)) {
    push("HouseSync");
    push("Roomly");
    push("FairShare");
    push("NestDuty");
  }
  if (/meal|food|recipe|dinner|cook|grocery/.test(low)) {
    push("PlatePilot");
    push("MealNest");
    push("DinnerForge");
    push("TableTurn");
  }
  if (/focus|timer|pomodoro|productivity|deep.?work/.test(low)) {
    push("FocusNest");
    push("QuietBlock");
    push("DeepHour");
  }
  if (/ai|automat/.test(low)) {
    push(`${base}AI`);
    push(`Auto${base}`);
  }

  push(`${base}${titleCase(NAME_SUFFIXES[0])}`);
  push(`${titleCase(secondary)}${titleCase(NAME_SUFFIXES[2])}`);
  push(`${base} ${titleCase(NAME_SUFFIXES[5])}`);
  push(`${titleCase(primary.slice(0, 4))}${titleCase(secondary.slice(0, 3))}`);
  push(`Open${base}`);

  return names.slice(0, 5);
}

function audienceFromInput(input: IdeaInput, keywords: string[]): string {
  if (input.audience?.trim()) return input.audience.trim();
  const idea = input.idea.toLowerCase();
  const match = idea.match(
    /(?:for|helping|serving)\s+([a-z0-9\s,&'-]{3,40}?)(?:\.|$|,|who|that)/i
  );
  if (match) return titleCase(match[1].trim());
  if (/housemate|roommate|flatmate/.test(idea))
    return "Housemates and roommates sharing a kitchen and chores";
  if (/dinner|weeknight|cook together/.test(idea))
    return "Households that want easier weeknight dinners together";
  if (keywords.includes("parents")) return "Busy parents juggling work and family";
  if (keywords.includes("students")) return "Students and lifelong learners";
  if (keywords.includes("founders") || keywords.includes("startups"))
    return "Early-stage founders and indie makers";
  if (keywords.includes("freelancers"))
    return "Freelancers who want less admin and more focus time";
  return "People looking for a smarter way to get this done";
}

function problemStatement(idea: string, audience: string, domain: string): string {
  const templates: Record<string, string> = {
    food: `${audience} waste hours deciding what to cook, shopping reactively, and defaulting to takeout — leaving nutrition and budget as afterthoughts.`,
    household: `${audience} lose evenings to "what's for dinner?", uneven chores, and group chats that never resolve — so resentment builds and takeout wins.`,
    health: `${audience} struggle to stay consistent with healthy habits because plans are generic, hard to stick to, and don't fit real schedules.`,
    finance: `${audience} lack a clear, low-friction view of money flowing in and out, so small leaks become big stress.`,
    education: `${audience} bounce between scattered resources and lose momentum without a structured, personalized path.`,
    saas: `${audience} cobble together tools that don't talk to each other, creating busywork instead of leverage.`,
    social: `${audience} want meaningful connection but get noise, feeds, and shallow engagement instead.`,
    travel: `${audience} spend too long researching and coordinating trips, then still miss better options.`,
    career: `${audience} face opaque hiring loops and outdated advice when trying to take the next career step.`,
    ai: `${audience} need AI that actually ships outcomes — not another chatbot that dumps walls of text.`,
    productivity: `${audience} lose deep-work blocks to notifications, fuzzy goals, and timers that don't respect real context.`,
    commerce: `${audience} fight friction between discovery, purchase, and fulfillment across too many tools.`,
    general: `${audience} face fragmented workflows around "${idea.slice(0, 60)}" with no single product that closes the loop from intent to done.`,
  };
  return templates[domain] || templates.general;
}

function valueProp(
  name: string,
  idea: string,
  audience: string,
  platform: Platform
): string {
  const surface =
    platform === "api"
      ? "an API-first product"
      : platform === "mobile"
        ? "a mobile-first experience"
        : "a focused web product";
  return `${name} turns "${idea}" into ${surface} that helps ${audience.toLowerCase()} go from intent to outcome in minutes — not hours.`;
}

function toneAccent(tone: Tone): {
  heroBg: string;
  accent: string;
  accentSoft: string;
  ctaLabel: string;
  vibe: string;
} {
  switch (tone) {
    case "playful":
      return {
        heroBg: "linear-gradient(135deg, #1a1033 0%, #0f172a 50%, #134e4a 100%)",
        accent: "#34d399",
        accentSoft: "rgba(52, 211, 153, 0.15)",
        ctaLabel: "Let's go →",
        vibe: "friendly and energetic",
      };
    case "bold":
      return {
        heroBg: "linear-gradient(135deg, #0c0a09 0%, #1c1917 40%, #7c2d12 100%)",
        accent: "#fb923c",
        accentSoft: "rgba(251, 146, 60, 0.18)",
        ctaLabel: "Start now",
        vibe: "confident and direct",
      };
    case "minimal":
      return {
        heroBg: "linear-gradient(180deg, #09090b 0%, #18181b 100%)",
        accent: "#e4e4e7",
        accentSoft: "rgba(228, 228, 231, 0.08)",
        ctaLabel: "Get started",
        vibe: "clean and precise",
      };
    case "friendly":
      return {
        heroBg: "linear-gradient(135deg, #1a0f0a 0%, #292524 40%, #9a3412 100%)",
        accent: "#fdba74",
        accentSoft: "rgba(253, 186, 116, 0.18)",
        ctaLabel: "Come say hi",
        vibe: "warm and approachable",
      };
    default:
      return {
        heroBg: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #1e3a5f 100%)",
        accent: "#38bdf8",
        accentSoft: "rgba(56, 189, 248, 0.16)",
        ctaLabel: "Get early access",
        vibe: "polished and trustworthy",
      };
  }
}

function featuresForDomain(domain: string, idea: string): string[] {
  const shared = [
    "Onboarding that captures goals and constraints in under 2 minutes",
    "Core workflow that delivers the first valuable result immediately",
    "Saved history + favorites so users can return and iterate",
    "Simple share / export of results",
  ];
  const byDomain: Record<string, string[]> = {
    food: [
      "Weekly meal plan generator from dietary prefs & pantry",
      "Auto-built shopping list grouped by aisle",
      "One-tap swap for allergies or picky eaters",
      "Prep-time and leftover-aware scheduling",
    ],
    household: [
      "Shared dinner vote + rotate-who-cooks calendar",
      "Chore board with fair rotation and gentle nudges",
      "Pantry + grocery list everyone can edit in real time",
      "Settle-up view for shared expenses (mock balances in v0)",
    ],
    health: [
      "Personalized plan from availability and fitness level",
      "Daily check-ins with streak and progress views",
      "Adaptive difficulty when users skip or crush sessions",
    ],
    finance: [
      "Linked accounts overview (mock / CSV import for v0)",
      "Budget envelopes with gentle overrun alerts",
      "Monthly insight summary in plain language",
    ],
    ai: [
      "Prompted workflows tuned to the user's goal",
      "Structured outputs (cards, plans, checklists) not raw chat",
      "Human-in-the-loop edit before finalizing",
    ],
    productivity: [
      "Focus sessions with gentle ambient cues (not guilt streaks)",
      "Context notes so you resume mid-thought after interruptions",
      "Cafe / noisy-environment presets for volume and duration",
    ],
    saas: [
      "Dashboard of the primary job-to-be-done",
      "Integrations stubs for email / calendar / Slack",
      "Role-aware empty states that teach the product",
    ],
  };
  const specific = byDomain[domain] || [
    `Primary flow that fulfills: ${idea.slice(0, 80)}`,
    "Settings for preferences and constraints",
    "Empty states that guide first success",
  ];
  return [...specific.slice(0, 4), ...shared.slice(0, 2)].slice(0, 6);
}

function techForPlatform(platform: Platform): BuildPlan["techStack"] {
  if (platform === "api") {
    return {
      frontend: ["Next.js (docs + playground)", "TypeScript", "Tailwind CSS"],
      backend: ["Next.js Route Handlers", "Zod validation", "OpenAPI stub"],
      infra: ["Vercel", "SQLite / Turso (later)", "GitHub Actions CI"],
    };
  }
  if (platform === "mobile") {
    return {
      frontend: ["Expo (React Native)", "TypeScript", "NativeWind"],
      backend: ["Next.js API routes (BFF)", "Zod", "JWT stubs"],
      infra: ["EAS Build", "Vercel for API", "SQLite locally"],
    };
  }
  return {
    frontend: ["Next.js App Router", "TypeScript", "Tailwind CSS", "React Server Components"],
    backend: ["Next.js Route Handlers", "Zod", "local JSON / SQLite persistence"],
    infra: ["Vercel", "GitHub", "optional Upstash Redis later"],
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildLandingHtml(
  brief: ProductBrief,
  plan: BuildPlan,
  input: IdeaInput
): LandingPage {
  const tone = input.tone || "professional";
  const accent = toneAccent(tone);
  const name = brief.selectedName;
  const features = plan.v0Features.slice(0, 4);
  const headline = brief.oneLiner;
  const subheadline = brief.valueProp;
  const cta = accent.ctaLabel;

  const featureCards = features
    .map(
      (f, i) => `
      <div class="card">
        <div class="card-num">0${i + 1}</div>
        <h3>${escapeHtml(f.split(" ").slice(0, 4).join(" "))}</h3>
        <p>${escapeHtml(f)}</p>
      </div>`
    )
    .join("");

  const css = `
    :root {
      --bg: #030712;
      --fg: #f8fafc;
      --muted: #94a3b8;
      --accent: ${accent.accent};
      --accent-soft: ${accent.accentSoft};
      --card: rgba(15, 23, 42, 0.72);
      --border: rgba(148, 163, 184, 0.16);
      --radius: 16px;
      --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font);
      background: #030712;
      color: var(--fg);
      line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    a { color: inherit; text-decoration: none; }
    .nav {
      display: flex; align-items: center; justify-content: space-between;
      padding: 1.1rem 1.5rem; max-width: 1100px; margin: 0 auto;
    }
    .logo {
      font-weight: 700; letter-spacing: -0.03em; font-size: 1.15rem;
      display: flex; gap: 0.5rem; align-items: center;
    }
    .logo-mark {
      width: 28px; height: 28px; border-radius: 8px;
      background: var(--accent); color: #020617;
      display: grid; place-items: center; font-size: 0.85rem; font-weight: 800;
    }
    .nav-cta {
      font-size: 0.875rem; padding: 0.55rem 1rem; border-radius: 999px;
      background: var(--accent-soft); color: var(--accent); border: 1px solid transparent;
    }
    .hero {
      background: ${accent.heroBg};
      border-bottom: 1px solid var(--border);
      padding: 4.5rem 1.5rem 5rem;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero::after {
      content: "";
      position: absolute; inset: auto -20% -40% -20%; height: 60%;
      background: radial-gradient(ellipse at center, var(--accent-soft), transparent 70%);
      pointer-events: none;
    }
    .badge {
      display: inline-flex; gap: 0.4rem; align-items: center;
      font-size: 0.75rem; letter-spacing: 0.04em; text-transform: uppercase;
      color: var(--accent); background: var(--accent-soft);
      padding: 0.35rem 0.75rem; border-radius: 999px; margin-bottom: 1.25rem;
      border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent);
    }
    .hero h1 {
      font-size: clamp(2.1rem, 5vw, 3.4rem);
      letter-spacing: -0.04em; line-height: 1.1;
      max-width: 18ch; margin: 0 auto 1rem;
    }
    .hero p.lead {
      color: var(--muted); font-size: 1.05rem; max-width: 42ch;
      margin: 0 auto 1.75rem;
    }
    .cta-row { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; position: relative; z-index: 1; }
    .btn-primary {
      background: var(--accent); color: #020617; font-weight: 650;
      padding: 0.85rem 1.35rem; border-radius: 999px; border: none; cursor: pointer;
      font-size: 0.95rem;
    }
    .btn-ghost {
      background: transparent; color: var(--fg);
      padding: 0.85rem 1.2rem; border-radius: 999px;
      border: 1px solid var(--border); font-size: 0.95rem; cursor: pointer;
    }
    .section { max-width: 1100px; margin: 0 auto; padding: 3.5rem 1.5rem; }
    .section h2 {
      font-size: 1.65rem; letter-spacing: -0.03em; margin-bottom: 0.5rem;
    }
    .section .sub { color: var(--muted); margin-bottom: 2rem; max-width: 48ch; }
    .grid {
      display: grid; gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    }
    .card {
      background: var(--card); border: 1px solid var(--border);
      border-radius: var(--radius); padding: 1.25rem 1.2rem;
      backdrop-filter: blur(8px);
    }
    .card-num {
      font-size: 0.75rem; color: var(--accent); font-weight: 700;
      margin-bottom: 0.65rem; letter-spacing: 0.06em;
    }
    .card h3 { font-size: 1rem; margin-bottom: 0.4rem; letter-spacing: -0.02em; }
    .card p { color: var(--muted); font-size: 0.9rem; }
    .problem {
      display: grid; gap: 1.5rem;
      grid-template-columns: 1.1fr 1fr; align-items: start;
    }
    @media (max-width: 720px) { .problem { grid-template-columns: 1fr; } }
    .quote {
      border-left: 3px solid var(--accent);
      padding-left: 1rem; color: var(--muted); font-size: 1rem;
    }
    .footer {
      border-top: 1px solid var(--border);
      padding: 2rem 1.5rem; text-align: center; color: var(--muted);
      font-size: 0.85rem;
    }
  `;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(name)} — ${escapeHtml(headline)}</title>
  <style>${css}</style>
</head>
<body>
  <nav class="nav">
    <div class="logo">
      <span class="logo-mark">${escapeHtml(name.charAt(0))}</span>
      ${escapeHtml(name)}
    </div>
    <a class="nav-cta" href="#cta">${escapeHtml(cta)}</a>
  </nav>

  <header class="hero">
    <div class="badge">Forged for ${escapeHtml(brief.targetUser.split(" ").slice(0, 3).join(" "))}</div>
    <h1>${escapeHtml(headline)}</h1>
    <p class="lead">${escapeHtml(subheadline)}</p>
    <div class="cta-row" id="cta">
      <button class="btn-primary">${escapeHtml(cta)}</button>
      <button class="btn-ghost">See how it works</button>
    </div>
  </header>

  <section class="section">
    <div class="problem">
      <div>
        <h2>The problem</h2>
        <p class="sub">${escapeHtml(brief.problem)}</p>
        <p class="quote">${escapeHtml(brief.valueProp)}</p>
      </div>
      <div class="card">
        <div class="card-num">WHY NOW</div>
        <h3>Built for real constraints</h3>
        <p>${escapeHtml(
          brief.differentiators[0] ||
            "Ships a complete core loop first — not a kitchen-sink roadmap."
        )}</p>
      </div>
    </div>
  </section>

  <section class="section">
    <h2>What you get in v0</h2>
    <p class="sub">A focused product surface — ${escapeHtml(accent.vibe)} — that proves the value prop immediately.</p>
    <div class="grid">${featureCards}</div>
  </section>

  <section class="section" style="text-align:center; padding-top:1rem;">
    <h2>Ready when you are</h2>
    <p class="sub" style="margin-left:auto;margin-right:auto;">Join the waitlist and be first to try ${escapeHtml(name)}.</p>
    <div class="cta-row">
      <button class="btn-primary">${escapeHtml(cta)}</button>
    </div>
  </section>

  <footer class="footer">
    © ${new Date().getFullYear()} ${escapeHtml(name)} · Generated by Forge
  </footer>
</body>
</html>`;

  return { html, css, headline, subheadline, cta };
}

function buildScaffold(
  brief: ProductBrief,
  plan: BuildPlan,
  input: IdeaInput
): Scaffold {
  const name = brief.selectedName;
  const slug = slugify(name) || "forge-app";
  const platform = input.platform || "web";
  const featuresList = plan.v0Features.map((f) => `- ${f}`).join("\n");

  const packageJson = JSON.stringify(
    {
      name: slug,
      version: "0.1.0",
      private: true,
      scripts: {
        dev: "next dev",
        build: "next build",
        start: "next start",
        lint: "next lint",
      },
      dependencies: {
        next: "^15.1.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
      devDependencies: {
        "@types/node": "^20",
        "@types/react": "^19",
        "@types/react-dom": "^19",
        typescript: "^5",
        tailwindcss: "^3.4.0",
        postcss: "^8",
        autoprefixer: "^10",
        eslint: "^9",
        "eslint-config-next": "^15.1.0",
      },
    },
    null,
    2
  );

  const readme = `# ${name}

${brief.oneLiner}

> Scaffolded by [Forge](https://github.com/Loreonsol/forge) from the idea:
> "${input.idea}"

## Value proposition

${brief.valueProp}

**Target user:** ${brief.targetUser}

## v0 features

${featuresList}

## Tech stack

- Frontend: ${plan.techStack.frontend.join(", ")}
- Backend: ${plan.techStack.backend.join(", ")}
- Infra: ${plan.techStack.infra.join(", ")}

## Getting started

\`\`\`bash
npm install
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000).

## Project structure

\`\`\`
app/
  layout.tsx
  page.tsx          # Marketing-style home
  globals.css
  dashboard/
    page.tsx        # Core product shell
lib/
  types.ts
  data.ts           # In-memory sample data
\`\`\`

## Next milestones

${plan.milestones.map((m) => `1. **${m.title}** (${m.estimate}) — ${m.description}`).join("\n")}

## Out of scope for v0

${plan.outOfScope.map((o) => `- ${o}`).join("\n")}
`;

  const layoutTsx = `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${name.replace(/"/g, '\\"')}",
  description: "${brief.oneLiner.replace(/"/g, '\\"')}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}
`;

  const globalsCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: dark;
}

body {
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
}
`;

  const featureBlocks = plan.v0Features
    .slice(0, 4)
    .map((f, i) => {
      const safe = f.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
      return `        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold text-sky-400">0${i + 1}</p>
          <h2 className="mt-2 font-medium text-white">${safe}</h2>
        </div>`;
    })
    .join("\n");

  const pageTsxClean = `import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-medium uppercase tracking-widest text-sky-400">
        ${name.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")}
      </p>
      <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        ${brief.oneLiner.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-400">
        ${brief.valueProp.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/dashboard"
          className="rounded-full bg-sky-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-sky-300"
        >
          Open app
        </Link>
        <a
          href="#features"
          className="rounded-full border border-slate-700 px-5 py-2.5 text-sm text-slate-200 hover:border-slate-500"
        >
          Features
        </a>
      </div>
      <section id="features" className="mt-16 grid gap-4 sm:grid-cols-2">
${featureBlocks}
      </section>
    </main>
  );
}
`;

  const dashboardTsx = `import { sampleItems } from "@/lib/data";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">Dashboard</p>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            ${name.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")}
          </h1>
        </div>
        <button className="rounded-full bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950">
          New
        </button>
      </header>
      <p className="mb-6 text-slate-400">
        Core loop stub for: ${input.idea.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$").slice(0, 120)}
      </p>
      <ul className="space-y-3">
        {sampleItems.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3"
          >
            <p className="font-medium text-white">{item.title}</p>
            <p className="text-sm text-slate-400">{item.subtitle}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
`;

  const dataTs = `export const sampleItems = [
  {
    id: "1",
    title: "First saved result",
    subtitle: "Replace with your core entity — plans, projects, or jobs.",
  },
  {
    id: "2",
    title: "Second saved result",
    subtitle: "Wire this list to persistence when you leave the scaffold.",
  },
  {
    id: "3",
    title: "Empty-state hint",
    subtitle: "Delete these stubs once real data lands.",
  },
];
`;

  const typesTs = `export type Platform = ${JSON.stringify(platform)};

export interface AppUserPrefs {
  audience: string;
  tone: string;
}
`;

  const tsconfig = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2
  );

  const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {};
module.exports = nextConfig;
`;

  const postcss = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

  const tailwind = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
};
`;

  const gitignore = `node_modules
.next
out
.env*.local
.DS_Store
*.tsbuildinfo
next-env.d.ts
`;

  const files = [
    { path: "package.json", content: packageJson + "\n" },
    { path: "README.md", content: readme },
    { path: "tsconfig.json", content: tsconfig + "\n" },
    { path: "next.config.mjs", content: nextConfig },
    { path: "postcss.config.mjs", content: postcss },
    { path: "tailwind.config.ts", content: `import type { Config } from "tailwindcss";\n\nconst config: Config = ${tailwind.replace("module.exports = ", "").replace(/;$/, "")};\n\nexport default config;\n` },
    { path: ".gitignore", content: gitignore },
    { path: "app/layout.tsx", content: layoutTsx },
    { path: "app/globals.css", content: globalsCss },
    { path: "app/page.tsx", content: pageTsxClean },
    { path: "app/dashboard/page.tsx", content: dashboardTsx },
    { path: "lib/data.ts", content: dataTs },
    { path: "lib/types.ts", content: typesTs },
  ];

  // Fix tailwind config - the replace is fragile. Write a clean one:
  files[5] = {
    path: "tailwind.config.ts",
    content: `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: {} },
  plugins: [],
};

export default config;
`,
  };

  // Use .js for postcss to avoid mjs/cjs confusion in scaffold
  files[4] = {
    path: "postcss.config.js",
    content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`,
  };
  files[3] = {
    path: "next.config.mjs",
    content: `/** @type {import('next').NextConfig} */
const nextConfig = {};
export default nextConfig;
`,
  };

  return {
    projectName: slug,
    files,
    readme,
  };
}

/**
 * Heuristic / template engine — zero API keys.
 * Produces coherent brief → plan → landing → scaffold from the idea text.
 */
export class MockIdeaEngine implements IdeaEngine {
  async clarify(input: IdeaInput): Promise<ProductBrief> {
    await delay(400);
    const keywords = extractKeywords(input.idea);
    const domain = detectDomain(input.idea, keywords);
    const nameOptions = inventNames(input.idea, keywords);
    const selectedName = nameOptions[0];
    const audience = audienceFromInput(input, keywords);
    const platform = input.platform || "web";
    const problem = problemStatement(input.idea, audience, domain);
    const value = valueProp(selectedName, input.idea, audience, platform);

    const differentiators = [
      "Outcome-first UX: users get a concrete result on first session",
      "Constraints-aware defaults (time, audience, platform) baked into the core loop",
      domain === "ai"
        ? "Structured AI outputs instead of open-ended chat walls"
        : domain === "household"
          ? "Built for shared living — fairness and low-drama coordination, not another to-do dump"
          : domain === "food"
            ? "Plans that respect pantry, prefs, and real weeknight time boxes"
            : "Opinionated v0 scope so you can ship and learn fast",
      "Generated landing + scaffold keep marketing and product aligned",
    ];

    const oneLiner =
      domain === "food"
        ? `${selectedName} plans weeknight meals for busy households in minutes`
        : domain === "household"
          ? `${selectedName} helps housemates decide dinner, share chores, and stay fair`
          : domain === "finance"
            ? `${selectedName} makes money clear for people who hate spreadsheets`
            : domain === "productivity"
              ? `${selectedName} protects deep focus for people who work anywhere`
              : `${selectedName} — ${input.idea.replace(/\.$/, "")}`.slice(0, 110);

    return {
      nameOptions,
      selectedName,
      oneLiner,
      targetUser: audience,
      problem,
      valueProp: value,
      differentiators,
    };
  }

  /**
   * Heuristic critique → refine: fix off-topic naming/tagline drift
   * (e.g. tip app saying "spreadsheets") using idea keywords.
   */
  async refine(input: IdeaInput, brief: ProductBrief): Promise<ProductBrief> {
    await delay(250);
    const keywords = extractKeywords(input.idea);
    const domain = detectDomain(input.idea, keywords);
    const ideaLower = input.idea.toLowerCase();

    // Phrases that often leak from wrong-domain templates
    const driftPhrases: [RegExp, string[]][] = [
      [/spreadsheet/i, ["finance", "saas"]],
      [/meal plan|pantry|grocery|recipe/i, ["food"]],
      [/housemate|roommate|chore board/i, ["household"]],
      [/deep.?work|pomodoro|focus nest/i, ["productivity"]],
      [/workout|fitness|streak/i, ["health"]],
    ];

    let drifted = false;
    const combined = `${brief.oneLiner} ${brief.valueProp} ${brief.problem} ${brief.differentiators.join(" ")}`;
    for (const [re, allowed] of driftPhrases) {
      if (re.test(combined) && !allowed.includes(domain) && !re.test(ideaLower)) {
        drifted = true;
        break;
      }
    }

    // Name / one-liner must share at least one idea keyword (loose check)
    const nameBlob = `${brief.selectedName} ${brief.oneLiner}`.toLowerCase();
    const keywordHit =
      keywords.length === 0 ||
      keywords.some((k) => nameBlob.includes(k) || brief.selectedName.toLowerCase().includes(k.slice(0, 4)));
    if (!keywordHit) drifted = true;

    if (!drifted) {
      // Light polish: ensure selectedName is in nameOptions
      const nameOptions = [...brief.nameOptions];
      if (!nameOptions.includes(brief.selectedName)) {
        nameOptions.unshift(brief.selectedName);
      }
      return { ...brief, nameOptions: nameOptions.slice(0, 5) };
    }

    // Rebuild from heuristics while preserving any on-topic name options
    const fresh = await this.clarify(input);
    const mergedNames = Array.from(
      new Set([
        ...fresh.nameOptions,
        ...brief.nameOptions.filter((n) =>
          keywords.some((k) => n.toLowerCase().includes(k.slice(0, 4)))
        ),
      ])
    ).slice(0, 5);

    return {
      ...fresh,
      nameOptions: mergedNames.length ? mergedNames : fresh.nameOptions,
      selectedName: mergedNames[0] || fresh.selectedName,
      // Prefer fresh on-topic copy; keep differentiators length
      differentiators: fresh.differentiators,
    };
  }

  async plan(input: IdeaInput, brief: ProductBrief): Promise<BuildPlan> {
    await delay(350);
    const keywords = extractKeywords(input.idea);
    const domain = detectDomain(input.idea, keywords);
    const platform = input.platform || "web";

    return {
      v0Features: featuresForDomain(domain, input.idea),
      techStack: techForPlatform(platform),
      milestones: [
        {
          title: "Validate core loop",
          description: `Ship a clickable flow that delivers "${brief.oneLiner}" for one happy-path user.`,
          estimate: "1 week",
        },
        {
          title: "Persist & polish",
          description: "Add local persistence, empty states, and basic settings for preferences.",
          estimate: "1 week",
        },
        {
          title: "Distribution surface",
          description: "Publish the landing page, collect waitlist emails, and instrument activation.",
          estimate: "3–5 days",
        },
        {
          title: "Iterate from usage",
          description: "Tighten the top drop-off step; expand features only after retention signal.",
          estimate: "ongoing",
        },
      ],
      outOfScope: [
        "Auth / multi-tenant SaaS billing",
        "Native mobile store submission (unless platform=mobile)",
        "Full ML training pipeline",
        "Complex admin / roles matrix",
      ],
    };
  }

  async landing(
    input: IdeaInput,
    brief: ProductBrief,
    plan: BuildPlan
  ): Promise<LandingPage> {
    await delay(300);
    return buildLandingHtml(brief, plan, input);
  }

  async scaffold(
    input: IdeaInput,
    brief: ProductBrief,
    plan: BuildPlan
  ): Promise<Scaffold> {
    await delay(300);
    return buildScaffold(brief, plan, input);
  }
}
