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

export function PipelineProgress({ stage }: { stage: PipelineStage }) {
  const current = indexOf(stage);
  const isError = stage === "error";

  return (
    <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {STEPS.map((step, i) => {
        const stepIdx = ORDER.indexOf(step.key);
        const done = !isError && current > stepIdx;
        const active = !isError && current === stepIdx;
        return (
          <li
            key={step.key}
            className={[
              "relative overflow-hidden rounded-xl border px-3 py-3",
              done
                ? "border-ember/30 bg-ember/10"
                : active
                  ? "border-forge/40 bg-forge/10 shadow-glow"
                  : "border-white/5 bg-white/[0.02]",
            ].join(" ")}
          >
            <div className="flex items-center gap-2">
              <span
                className={[
                  "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold",
                  done
                    ? "bg-ember text-ink"
                    : active
                      ? "bg-forge text-ink animate-pulse"
                      : "bg-white/10 text-mist",
                ].join(" ")}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={[
                  "text-sm font-medium",
                  done || active ? "text-snow" : "text-mist",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {active && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-forge to-transparent" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
