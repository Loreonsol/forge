import { v4 as uuidv4 } from "uuid";
import type { CreateRunRequest, ForgeRun } from "./types";
import { getEngineInfo, getIdeaEngine } from "./engine";
import { saveRun, updateRun } from "./store";

export async function createAndRunPipeline(
  request: CreateRunRequest
): Promise<ForgeRun> {
  const idea = request.idea?.trim();
  if (!idea || idea.length < 3) {
    throw new Error("Idea must be at least 3 characters.");
  }

  const engineInfo = getEngineInfo();
  const now = new Date().toISOString();
  const run: ForgeRun = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    input: {
      idea,
      audience: request.audience?.trim() || undefined,
      platform: request.platform || "web",
      tone: request.tone || "professional",
    },
    stage: "queued",
    engine: engineInfo,
  };

  await saveRun(run);

  // Fire-and-forget pipeline; client polls GET /api/runs/:id
  void executePipeline(run.id).catch(async (err) => {
    await updateRun(run.id, {
      stage: "error",
      error: err instanceof Error ? err.message : "Pipeline failed",
    });
  });

  return run;
}

async function executePipeline(id: string) {
  const engine = getIdeaEngine();
  const current = await import("./store").then((m) => m.getRun(id));
  if (!current) return;

  const input = current.input;

  await updateRun(id, { stage: "clarify", engine: getEngineInfo() });
  let brief = await engine.clarify(input);
  await updateRun(id, { brief });

  await updateRun(id, { stage: "refine" });
  brief = await engine.refine(input, brief);
  await updateRun(id, { brief });

  await updateRun(id, { stage: "plan" });
  const plan = await engine.plan(input, brief);
  await updateRun(id, { plan });

  await updateRun(id, { stage: "landing" });
  const landing = await engine.landing(input, brief, plan);
  await updateRun(id, { landing });

  await updateRun(id, { stage: "scaffold" });
  const scaffold = await engine.scaffold(input, brief, plan);
  await updateRun(id, { scaffold, stage: "complete" });
}

/** Synchronous full run — useful for tests / scripts. */
export async function runPipelineSync(
  request: CreateRunRequest
): Promise<ForgeRun> {
  const idea = request.idea?.trim();
  if (!idea || idea.length < 3) {
    throw new Error("Idea must be at least 3 characters.");
  }

  const engine = getIdeaEngine();
  const engineInfo = getEngineInfo();
  const now = new Date().toISOString();
  let run: ForgeRun = {
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
    input: {
      idea,
      audience: request.audience?.trim() || undefined,
      platform: request.platform || "web",
      tone: request.tone || "professional",
    },
    stage: "clarify",
    engine: engineInfo,
  };
  await saveRun(run);

  let brief = await engine.clarify(run.input);
  run = (await updateRun(run.id, { brief, stage: "refine" }))!;

  brief = await engine.refine(run.input, brief);
  run = (await updateRun(run.id, { brief, stage: "plan" }))!;

  const plan = await engine.plan(run.input, brief);
  run = (await updateRun(run.id, { plan, stage: "landing" }))!;

  const landing = await engine.landing(run.input, brief, plan);
  run = (await updateRun(run.id, { landing, stage: "scaffold" }))!;

  const scaffold = await engine.scaffold(run.input, brief, plan);
  run = (await updateRun(run.id, { scaffold, stage: "complete" }))!;

  return run;
}
