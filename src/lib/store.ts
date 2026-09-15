import { promises as fs } from "fs";
import path from "path";
import type { ForgeRun } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "runs.json");

/**
 * In-memory cache backed by data/runs.json.
 *
 * Next.js can load this module in separate instances (API route vs RSC).
 * Disk is the source of truth: every read reloads from disk so a run
 * persisted by one instance is visible to another.
 */
const memory = new Map<string, ForgeRun>();

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/** Always re-read runs.json into memory (cross-instance safe). */
async function reloadFromDisk(): Promise<void> {
  await ensureDir();
  try {
    const raw = await fs.readFile(STORE_FILE, "utf-8");
    const runs = JSON.parse(raw) as ForgeRun[];
    memory.clear();
    for (const run of runs) {
      memory.set(run.id, run);
    }
  } catch (err) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === "ENOENT") {
      memory.clear();
      return;
    }
    // Corrupt / unreadable — keep current memory; next persist may repair
  }
}

async function persist(): Promise<void> {
  await ensureDir();
  const runs = Array.from(memory.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  // Write atomically via temp file so readers never see partial JSON
  const tmp = `${STORE_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(runs, null, 2), "utf-8");
  await fs.rename(tmp, STORE_FILE);
}

export async function saveRun(run: ForgeRun): Promise<ForgeRun> {
  await reloadFromDisk();
  memory.set(run.id, run);
  await persist();
  return run;
}

export async function getRun(id: string): Promise<ForgeRun | null> {
  await reloadFromDisk();
  return memory.get(id) ?? null;
}

export async function listRuns(limit = 20): Promise<ForgeRun[]> {
  await reloadFromDisk();
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
  await reloadFromDisk();
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
