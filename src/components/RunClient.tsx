"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ForgeRun } from "@/lib/types";
import { PipelineProgress } from "./PipelineProgress";
import { ResultsTabs } from "./ResultsTabs";

export function RunClient({
  initialRun,
  runId,
}: {
  initialRun: ForgeRun;
  runId: string;
}) {
  const [run, setRun] = useState<ForgeRun>(initialRun);

  useEffect(() => {
    if (run.stage === "complete" || run.stage === "error") return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as ForgeRun;
        if (!cancelled) setRun(data);
      } catch {
        // ignore transient errors
      }
    };

    const id = setInterval(tick, 600);
    void tick();
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [run.stage, runId]);

  const done = run.stage === "complete";
  const errored = run.stage === "error";

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs font-medium text-mist transition hover:text-snow"
          >
            ← New idea
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-snow sm:text-3xl">
            {run.brief?.selectedName || "Forging your product"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-mist">{run.input.idea}</p>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-1 font-mono text-[11px] text-mist">
          {run.id.slice(0, 8)}
        </div>
      </div>

      <div className="mb-8">
        <PipelineProgress stage={run.stage} />
        {!done && !errored && (
          <p className="mt-3 text-xs text-mist">
            Running pipeline — Clarify → Plan → Landing → Scaffold
          </p>
        )}
        {errored && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {run.error || "Pipeline failed"}
          </p>
        )}
      </div>

      {(run.brief || done) && <ResultsTabs run={run} />}
    </div>
  );
}
