"use client";

import { useState } from "react";
import type { ForgeRun } from "@/lib/types";
import { BriefView } from "./BriefView";
import { PlanView } from "./PlanView";
import { LandingPreview } from "./LandingPreview";
import { ScaffoldView } from "./ScaffoldView";

const TABS = [
  { id: "brief", label: "Brief" },
  { id: "plan", label: "Plan" },
  { id: "landing", label: "Landing" },
  { id: "scaffold", label: "Scaffold" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function ResultsTabs({ run }: { run: ForgeRun }) {
  const [tab, setTab] = useState<TabId>("brief");

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-1 rounded-xl border border-white/5 bg-white/[0.02] p-1">
        {TABS.map((t) => {
          const ready =
            (t.id === "brief" && run.brief) ||
            (t.id === "plan" && run.plan) ||
            (t.id === "landing" && run.landing) ||
            (t.id === "scaffold" && run.scaffold);
          return (
            <button
              key={t.id}
              type="button"
              disabled={!ready}
              onClick={() => setTab(t.id)}
              className={[
                "rounded-lg px-3.5 py-2 text-sm font-medium transition",
                tab === t.id
                  ? "bg-white/10 text-snow shadow-sm"
                  : ready
                    ? "text-mist hover:text-snow"
                    : "cursor-not-allowed text-mist/40",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-white/5 bg-panel/40 p-5 sm:p-6">
        {tab === "brief" && run.brief && <BriefView brief={run.brief} />}
        {tab === "plan" && run.plan && <PlanView plan={run.plan} />}
        {tab === "landing" && run.landing && (
          <LandingPreview landing={run.landing} />
        )}
        {tab === "scaffold" && run.scaffold && (
          <ScaffoldView scaffold={run.scaffold} runId={run.id} />
        )}
        {tab === "brief" && !run.brief && (
          <p className="text-sm text-mist">Waiting for brief…</p>
        )}
      </div>
    </div>
  );
}
