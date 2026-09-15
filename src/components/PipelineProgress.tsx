"use client";

import type { PipelineStage } from "@/lib/types";

const STEPS: { key: PipelineStage; label: string }[] = [
  { key: "clarify", label: "Clarify" },
  { key: "plan", label: "Plan" },
  { key: "landing", label: "Landing" },
  { key: "scaffold", label: "Scaffold" },
];

const ORDER: PipelineStage[] = [
  "queued",
  "clarify",
  "plan",
  "landing",
  "scaffold",
  "complete",
];

function indexOf(stage: PipelineStage) {
  if (stage === "error") return -1;
  if (stage === "complete") return ORDER.length;
  return ORDER.indexOf(stage);
}

/** Slim progress strip — content navigation lives in ResultsTabs. */
export function PipelineProgress({ stage }: { stage: PipelineStage }) {
  const current = indexOf(stage);
  const isError = stage === "error";
  const complete = stage === "complete";

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 sm:px-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-widest text-mist">
          Pipeline
        </p>
        <p className="text-[11px] font-medium text-snow/70">
          {isError
            ? "Failed"
            : complete
              ? "Complete"
              : stage === "queued"
                ? "Queued"
                : `Running · ${STEPS.find((s) => s.key === stage)?.label ?? stage}`}
        </p>
      </div>
      <ol className="flex items-center gap-1.5 sm:gap-2">
        {STEPS.map((step, i) => {
          const stepIdx = ORDER.indexOf(step.key);
          const done = !isError && current > stepIdx;
          const active = !isError && current === stepIdx;
          return (
            <li key={step.key} className="flex min-w-0 flex-1 items-center gap-1.5">
              <div
                className={[
                  "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5",
                  done
                    ? "bg-ember/15 text-snow"
                    : active
                      ? "bg-forge/15 text-snow ring-1 ring-forge/40"
                      : "text-mist",
                ].join(" ")}
                title={step.label}
              >
                <span
                  className={[
                    "grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold",
                    done
                      ? "bg-ember text-ink"
                      : active
                        ? "bg-forge text-ink animate-pulse"
                        : isError
                          ? "bg-red-500/30 text-red-200"
                          : "bg-white/10 text-mist",
                  ].join(" ")}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span className="truncate text-xs font-medium">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={[
                    "hidden h-px w-2 shrink-0 sm:block",
                    done ? "bg-ember/50" : "bg-white/10",
                  ].join(" ")}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
