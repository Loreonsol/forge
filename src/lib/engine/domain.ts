import type { ProductDomain } from "../types";

export type FineDomain =
  | ProductDomain
  | "health"
  | "finance"
  | "education"
  | "saas"
  | "social"
  | "career"
  | "ai"
  | "commerce";

const STOP = new Set([
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

/** Extract noun-ish keywords from the idea for naming & copy. */
export function extractKeywords(idea: string): string[] {
  return idea
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))
    .slice(0, 8);
}

/**
 * Coarse product domain for anti-drift templates.
 * Order matters: tips before finance/pay; travel before generic.
 */
export function classifyDomain(idea: string, keywords: string[] = []): FineDomain {
  const text = `${idea} ${keywords.join(" ")}`.toLowerCase();

  // tips / payroll / gratuity — MUST beat generic "pay"/finance
  if (
    /tip\b|tips\b|tipping|gratuity|tip.?jar|tip.?pool|tip.?split|split.?tip|payroll|wage.?split|server.?tip|bartender.?tip/.test(
      text
    )
  ) {
    return "tips";
  }

  if (
    /travel|trip|trips|flight|flights|hotel|hotels|itinerary|vacation|journey|passport|booking|backpacking|road.?trip|getaway/.test(
      text
    )
  ) {
    return "travel";
  }

  if (
    /housemate|roommate|flatmate|chore|household|shared.?house|split.?bill|room.?mate/.test(
      text
    )
  ) {
    return "household";
  }

  if (
    /dinner|meal|food|recipe|nutrition|diet|cook|grocery|kitchen|pantry/.test(text)
  ) {
    return "food";
  }

  if (
    /focus|timer|pomodoro|productivity|deep.?work|distraction|habit.?track/.test(
      text
    )
  ) {
    return "productivity";
  }

  if (/fitness|workout|gym|health|wellness/.test(text)) return "health";

  // finance only when clearly about money management — not tips
  if (
    /finance|budget|budget.?track|invest|banking|invoice|spreadsheet|expense.?track|money.?manag/.test(
      text
    )
  ) {
    return "finance";
  }

  if (/edu|learn|course|tutor|study|school/.test(text)) return "education";
  if (/market|crm|sales|lead|b2b|saas/.test(text)) return "saas";
  if (/social|community|chat|network|friend/.test(text)) return "social";
  if (/job|hire|recruit|career|resume/.test(text)) return "career";
  if (/ai|ml|llm|gpt|agent|automat/.test(text)) return "ai";
  if (/shop|e-?commerce|store|retail/.test(text)) return "commerce";

  return "generic";
}

/** Map fine domain → coarse ProductDomain for UI / templates. */
export function toProductDomain(d: FineDomain): ProductDomain {
  if (d === "travel") return "travel";
  if (d === "tips") return "tips";
  if (d === "food" || d === "household") return d;
  if (d === "productivity") return "productivity";
  return "generic";
}

/** Off-domain tropes that must not appear unless the idea is about them. */
export const OFF_DOMAIN_TROPES: {
  re: RegExp;
  label: string;
  /** Allowed only when idea matches this OR domain is in list */
  ideaAllows: RegExp;
  domainsOk: FineDomain[];
}[] = [
  {
    re: /spreadsheet/i,
    label: "spreadsheet",
    ideaAllows: /spreadsheet|excel|csv|workbook/i,
    domainsOk: ["finance", "saas"],
  },
  {
    re: /\bfreelancers?\b/i,
    label: "freelancers",
    ideaAllows: /freelance/i,
    domainsOk: [],
  },
  {
    re: /\binvoices?\b/i,
    label: "invoice",
    ideaAllows: /invoice|billing|accounts.?receivable/i,
    domainsOk: ["finance", "saas"],
  },
  {
    re: /budget.?track|linked accounts|budget envelopes/i,
    label: "budget-tracker-as-core",
    ideaAllows: /budget|expense|finance|money manag/i,
    domainsOk: ["finance"],
  },
  {
    re: /meal plan|pantry|grocery list|recipe/i,
    label: "food-trope",
    ideaAllows: /meal|food|recipe|dinner|cook|grocery|pantry/i,
    domainsOk: ["food", "household"],
  },
  {
    re: /housemate|roommate|chore board/i,
    label: "household-trope",
    ideaAllows: /housemate|roommate|flatmate|chore|household/i,
    domainsOk: ["household"],
  },
  {
    re: /deep.?work|pomodoro|focus nest/i,
    label: "productivity-trope",
    ideaAllows: /focus|timer|pomodoro|productivity|deep.?work/i,
    domainsOk: ["productivity"],
  },
];

export function hasOffDomainTropes(
  copy: string,
  idea: string,
  domain: FineDomain
): string[] {
  const hits: string[] = [];
  for (const t of OFF_DOMAIN_TROPES) {
    if (!t.re.test(copy)) continue;
    if (t.ideaAllows.test(idea)) continue;
    if (t.domainsOk.includes(domain)) continue;
    hits.push(t.label);
  }
  return hits;
}

/**
 * Assert topical overlap: at least one strong keyword from the idea
 * must appear in oneLiner, valueProp, or problem.
 */
export function topicalOverlapScore(
  ideaKeywords: string[],
  oneLiner: string,
  valueProp: string,
  problem: string
): { ok: boolean; hits: string[] } {
  const blob = `${oneLiner} ${valueProp} ${problem}`.toLowerCase();
  // Prefer longer / more distinctive keywords
  const ranked = [...ideaKeywords].sort((a, b) => b.length - a.length);
  const hits = ranked.filter(
    (k) => k.length >= 3 && (blob.includes(k) || blob.includes(k.slice(0, 5)))
  );
  // Need ≥1 hit when we have keywords; prefer ≥2 if ≥4 keywords
  const need = ideaKeywords.length >= 4 ? 2 : 1;
  return { ok: ideaKeywords.length === 0 || hits.length >= need, hits };
}

export function domainCopyTemplates(
  domain: FineDomain,
  name: string,
  idea: string,
  audience: string
): { oneLiner: string; problem: string; valueProp: string; differentiators: string[] } {
  const shortIdea = idea.replace(/\.$/, "").slice(0, 80);
  const aud = audience.toLowerCase();

  switch (domain) {
    case "travel":
      return {
        oneLiner: `${name} plans trips and itineraries without the chaos`,
        problem: `${audience} burn evenings tab-hopping flights, stays, and day plans — then still miss better routes and shared notes.`,
        valueProp: `${name} turns trip ideas into a clear itinerary and packing-ready plan so ${aud} go from daydream to booked days faster.`,
        differentiators: [
          "Itinerary-first UX: destinations, days, and must-sees in one view",
          "Built for travelers — not expense trackers or generic task lists",
          "Shareable trip brief so companions stay aligned",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    case "tips":
      return {
        oneLiner: `${name} splits tips and payouts fairly for service teams`,
        problem: `${audience} lose trust when tip pools, shifts, and payouts live in group chats and sticky notes — disputes follow every closing shift.`,
        valueProp: `${name} makes tip splits and payroll handoffs transparent so ${aud} see who earned what without the drama.`,
        differentiators: [
          "Tip-pool and shift-aware splits as the core loop",
          "Clear payout summaries — not a generic money dashboard",
          "Fairness rules the team can audit in seconds",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    case "food":
      return {
        oneLiner: `${name} plans weeknight meals for busy households in minutes`,
        problem: `${audience} waste hours deciding what to cook, shopping reactively, and defaulting to takeout — leaving nutrition and time as afterthoughts.`,
        valueProp: `${name} turns meal prefs and pantry reality into a plan ${aud} can cook tonight.`,
        differentiators: [
          "Plans that respect pantry, prefs, and real weeknight time boxes",
          "Outcome-first UX: a concrete meal plan on first session",
          "Shopping list that matches the plan",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    case "household":
      return {
        oneLiner: `${name} helps housemates decide dinner, share chores, and stay fair`,
        problem: `${audience} lose evenings to "what's for dinner?", uneven chores, and group chats that never resolve — so resentment builds and takeout wins.`,
        valueProp: `${name} coordinates shared living so ${aud} get fair chores and fewer awkward conversations.`,
        differentiators: [
          "Built for shared living — fairness and low-drama coordination",
          "Dinner votes + chore rotation in one place",
          "Outcome-first UX on first session",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    case "productivity":
      return {
        oneLiner: `${name} protects deep focus for people who work anywhere`,
        problem: `${audience} lose deep-work blocks to notifications, fuzzy goals, and timers that don't respect real context.`,
        valueProp: `${name} helps ${aud} start and finish focused sessions without guilt streaks.`,
        differentiators: [
          "Focus sessions with gentle cues — not shameful streak pressure",
          "Context notes so you resume mid-thought",
          "Outcome-first UX on first session",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    case "finance":
      return {
        oneLiner: `${name} makes money clear without drowning in admin`,
        problem: `${audience} lack a clear, low-friction view of money flowing in and out, so small leaks become big stress.`,
        valueProp: `${name} gives ${aud} a simple money picture they will actually open weekly.`,
        differentiators: [
          "Plain-language money overview first",
          "Constraints-aware defaults baked into the core loop",
          "Outcome-first UX on first session",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    case "health":
      return {
        oneLiner: `${name} helps ${aud} stick to healthy habits that fit real life`,
        problem: `${audience} struggle to stay consistent because plans are generic and don't fit real schedules.`,
        valueProp: `${name} turns intent into a plan ${aud} can keep this week.`,
        differentiators: [
          "Schedules that bend with real life",
          "Outcome-first UX on first session",
          "Adaptive when users skip or crush sessions",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    case "ai":
      return {
        oneLiner: `${name} — AI that ships outcomes for ${aud}`.slice(0, 110),
        problem: `${audience} need AI that actually ships outcomes — not another chatbot that dumps walls of text.`,
        valueProp: `${name} turns "${shortIdea}" into structured results ${aud} can use immediately.`,
        differentiators: [
          "Structured AI outputs instead of open-ended chat walls",
          "Human-in-the-loop edit before finalizing",
          "Outcome-first UX on first session",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
    default:
      return {
        oneLiner: `${name} — ${shortIdea}`.slice(0, 110),
        problem: `${audience} face fragmented workflows around "${shortIdea}" with no single product that closes the loop from intent to done.`,
        valueProp: `${name} helps ${aud} go from intent to outcome in minutes — tightly scoped to: ${shortIdea}.`,
        differentiators: [
          "Outcome-first UX: users get a concrete result on first session",
          "Constraints-aware defaults baked into the core loop",
          "Copy and features stay anchored to the original idea",
          "Opinionated v0 scope so you can ship and learn fast",
        ],
      };
  }
}

/** Ensure core copy fields contain idea keywords (inject if missing). */
export function injectKeywordsIntoCopy(
  keywords: string[],
  oneLiner: string,
  valueProp: string,
  problem: string
): { oneLiner: string; valueProp: string; problem: string; injected: string[] } {
  const top = keywords.filter((k) => k.length >= 4).slice(0, 3);
  const injected: string[] = [];
  let ol = oneLiner;
  let vp = valueProp;
  let pr = problem;
  const blob = () => `${ol} ${vp} ${pr}`.toLowerCase();

  for (const k of top) {
    if (blob().includes(k)) continue;
    // Prefer oneLiner for the strongest keyword
    if (!ol.toLowerCase().includes(k) && injected.length === 0) {
      ol = `${ol.replace(/\.$/, "")} — built around ${k}`.slice(0, 120);
      injected.push(k);
    } else if (!vp.toLowerCase().includes(k)) {
      vp = `${vp.replace(/\.$/, "")} Centered on ${k}.`;
      injected.push(k);
    } else if (!pr.toLowerCase().includes(k)) {
      pr = `${pr.replace(/\.$/, "")} Especially around ${k}.`;
      injected.push(k);
    }
  }
  return { oneLiner: ol, valueProp: vp, problem: pr, injected };
}
