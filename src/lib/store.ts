import { promises as fs } from "fs";
import path from "path";
import type { ForgeRun } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "runs.json");

const memory = new Map<string, ForgeRun>();
let hydrated = false;

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    await ensureDir();
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const runs = JSON.parse(raw) as ForgeRun[];
    for (const run of runs) {
      memory.set(run.id, run);
    }
  } catch {
    // No file yet — start empty
  }
}

async function persist() {
  await ensureDir();
  const runs = Array.from(memory.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  await fs.writeFile(STORE_FILE, JSON.stringify(runs, null, 2), "utf-8");
}

export async function saveRun(run: ForgeRun): Promise<ForgeRun> {
  await hydrate();
  memory.set(run.id, run);
  await persist();
  return run;
}

export async function getRun(id: string): Promise<ForgeRun | null> {
  await hydrate();
  return memory.get(id) ?? null;
}

export async function listRuns(limit = 20): Promise<ForgeRun[]> {
  await hydrate();
  return Array.from(memory.values())
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, limit);
}

export async function updateRun(
  id: string,
  patch: Partial<ForgeRun>
): Promise<ForgeRun | null> {
  await hydrate();
  const existing = memory.get(id);
  if (!existing) return null;
  const updated: ForgeRun = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  memory.set(id, updated);
  await persist();
  return updated;
}
