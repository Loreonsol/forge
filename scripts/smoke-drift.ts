import { MockIdeaEngine } from "../src/lib/engine/mock-engine";
import {
  classifyDomain,
  extractKeywords,
  hasOffDomainTropes,
  type FineDomain,
} from "../src/lib/engine/domain";
import { deriveBrandKit } from "../src/lib/brand-kit";

const engine = new MockIdeaEngine();

async function check(
  label: string,
  idea: string,
  expectDomain: string,
  forbid: RegExp[]
) {
  const keywords = extractKeywords(idea);
  const domain = classifyDomain(idea, keywords);
  console.log(`\n=== ${label} ===`);
  console.log("domain:", domain, "(expected", expectDomain + ")");
  if (domain !== expectDomain) {
    console.error("FAIL domain mismatch");
    process.exitCode = 1;
  }
  const input = {
    idea,
    platform: "web" as const,
    tone: "professional" as const,
  };
  let brief = await engine.clarify(input);
  brief = await engine.refine(input, brief);
  console.log("name:", brief.selectedName);
  console.log("oneLiner:", brief.oneLiner);
  console.log("valueProp:", brief.valueProp.slice(0, 140));
  console.log("problem:", brief.problem.slice(0, 140));
  console.log("refineNotes:", brief.refineNotes);
  const blob = `${brief.oneLiner} ${brief.valueProp} ${brief.problem}`;
  for (const re of forbid) {
    if (re.test(blob)) {
      console.error("FAIL forbidden pattern", re, "in copy");
      process.exitCode = 1;
    }
  }
  const tropes = hasOffDomainTropes(blob, idea, domain as FineDomain);
  if (tropes.length) {
    console.error("FAIL tropes still present:", tropes);
    process.exitCode = 1;
  }
  const hits = keywords.filter(
    (k) =>
      blob.toLowerCase().includes(k) ||
      brief.oneLiner.toLowerCase().includes(k.slice(0, 5))
  );
  console.log("keyword hits:", hits);
  if (hits.length < 1) {
    console.error("FAIL no keyword overlap");
    process.exitCode = 1;
  }
  const brand = deriveBrandKit(input, brief);
  console.log(
    "brand:",
    brand.name,
    brand.accent,
    brand.logoMarkLetter,
    brand.voiceAdjectives.join("/")
  );
}

async function main() {
  await check(
    "trip planner",
    "AI trip planner for friends who want shared itineraries",
    "travel",
    [/spreadsheet/i, /\binvoice/i, /budget envelopes/i, /freelancers/i]
  );

  await check(
    "tip split",
    "Tip jar splitter for restaurant servers sharing nightly tips",
    "tips",
    [/spreadsheet/i, /budget envelopes/i, /meal plan/i, /linked accounts/i]
  );

  await check(
    "meal planner control",
    "AI meal planner for busy parents",
    "food",
    [/spreadsheet/i, /tip pool/i]
  );

  if (process.exitCode) {
    console.error("\nSMOKE FAILED");
  } else {
    console.log("\nSMOKE PASSED");
  }
}

main();
