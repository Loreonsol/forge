"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ForgeRun } from "@/lib/types";
import { PipelineProgress } from "./PipelineProgress";
import { ResultsTabs } from "./ResultsTabs";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { CopyButton } from "./CopyButton";

export function RunClient({
  initialRun,
  runId,
}: {
  initialRun: ForgeRun | null;
  runId: string;
}) {
  const [run, setRun] = useState<ForgeRun | null>(initialRun);
  const [loading, setLoading] = useState(!initialRun);
  const [notFound, setNotFound] = useState(false);
  const [shareUrl, setShareUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(`${window.location.origin}/runs/${runId}`);
    }
  }, [runId]);

  useEffect(() => {
    let cancelled = false;
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const res = await fetch(`/api/runs/${runId}`, { cache: "no-store" });
        if (cancelled) return;
        if (res.status === 404) {
          setLoading(false);
          setNotFound(true);
          return;
        }
        if (!res.ok) return;
        const data = (await res.json()) as ForgeRun;
        setRun(data);
        setLoading(false);
        setNotFound(false);
        if (data.stage === "complete" || data.stage === "error") {
          if (interval) {
            clearInterval(interval);
            interval = null;
          }
        }
      } catch {
        // ignore transient errors while loading
      }
    };

    // Always fetch once (covers SSR miss); poll while in progress
    void tick();
    interval = setInterval(tick, 600);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [runId]);

  const zipReady = !!run?.scaffold;

  if (loading && !run) {
    return (
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-xs font-medium text-mist transition hover:text-snow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
          >
            ← New idea
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-snow sm:text-3xl">
            Loading run…
          </h1>
          <p className="mt-2 text-sm text-mist">Fetching forged output from the API.</p>
        </div>
        <div className="h-16 animate-pulse rounded-xl border border-white/5 bg-white/[0.03]" />
      </div>
    );
  }

  if (notFound && !run) {
    return (
      <div className="mx-auto flex max-w-lg flex-col px-5 py-16">
        <p className="font-mono text-xs font-medium uppercase tracking-widest text-ember">
          Run missing
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-snow">
          Couldn&apos;t find this run
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          No run with id{" "}
          <span className="font-mono text-snow/90">{runId.slice(0, 8)}</span>{" "}
          showed up. It may have failed to persist — try forging again.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="inline-flex rounded-full bg-gradient-to-r from-ember to-forge px-5 py-2.5 text-sm font-semibold text-ink shadow-glow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
          >
            Back home
          </Link>
          <Link
            href="/#recent"
            className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-snow transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
          >
            View recent runs
          </Link>
        </div>
      </div>
    );
  }

  if (!run) return null;

  const done = run.stage === "complete";
  const errored = run.stage === "error";

  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="text-xs font-medium text-mist transition hover:text-snow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
          >
            ← New idea
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-snow sm:text-3xl">
            {run.brief?.selectedName || "Forging your product"}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-mist">{run.input.idea}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 font-mono text-[11px] text-snow/80">
            {run.id.slice(0, 8)}
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            {shareUrl ? (
              <CopyButton text={shareUrl} label="Copy link" successLabel="Link copied" />
            ) : null}
            <DownloadPdfButton run={run} />
            {zipReady ? (
              <a
                href={`/api/runs/${run.id}/scaffold`}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ember to-forge px-4 py-2 text-xs font-semibold text-ink shadow-glow transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
              >
                Download ZIP
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mb-6">
        <PipelineProgress stage={run.stage} />
        {errored && (
          <div
            className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            role="alert"
          >
            {run.error || "Pipeline failed"}
          </div>
        )}
      </div>

      {(run.brief || done || errored) && <ResultsTabs run={run} />}

      {!run.brief && !done && !errored && (
        <div className="rounded-2xl border border-white/5 bg-panel/40 p-6 text-sm text-mist">
          Clarifying your idea — brief lands in a moment.
        </div>
      )}
    </div>
  );
}
