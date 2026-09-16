"use client";

import { useEffect, useState } from "react";
import type { ForgeRun } from "@/lib/types";
import { SummaryView } from "./SummaryView";
import { BriefView } from "./BriefView";
import { PlanView } from "./PlanView";
import { LandingPreview } from "./LandingPreview";
import { ScaffoldView } from "./ScaffoldView";

const TABS = [
  { id: "summary", label: "Summary" },
  { id: "brief", label: "Brief" },
  { id: "plan", label: "Plan" },
  { id: "landing", label: "Landing" },
  { id: "scaffold", label: "Scaffold" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function latestReadyTab(run: ForgeRun): TabId {
  // Prefer Summary once brief exists so the overview is the landing surface
  if (run.brief) return "summary";
  return "brief";
}

function isReady(run: ForgeRun, id: TabId): boolean {
  return (
    (id === "summary" && !!run.brief) ||
    (id === "brief" && !!run.brief) ||
    (id === "plan" && !!run.plan) ||
    (id === "landing" && !!run.landing) ||
    (id === "scaffold" && !!run.scaffold)
  );
}

export function ResultsTabs({ run }: { run: ForgeRun }) {
  const [tab, setTab] = useState<TabId>(() => latestReadyTab(run));
  const [userPicked, setUserPicked] = useState(false);

  // Follow pipeline progress until the user picks a tab
  useEffect(() => {
    if (userPicked) return;
    setTab(latestReadyTab(run));
  }, [run.brief, run.plan, run.landing, run.scaffold, userPicked, run]);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Result sections"
        className="mb-5 flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1"
      >
        {TABS.map((t) => {
          const ready = isReady(run, t.id);
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={selected}
              disabled={!ready}
              onClick={() => {
                setUserPicked(true);
                setTab(t.id);
              }}
              className={[
                "rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge",
                selected
                  ? "bg-white/12 text-snow shadow-sm"
                  : ready
                    ? "text-mist hover:bg-white/5 hover:text-snow"
                    : "cursor-not-allowed text-mist/45",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        className={[
          "rounded-2xl border border-white/10 bg-panel/50",
          tab === "landing" ? "p-4 sm:p-5" : "p-5 sm:p-6",
        ].join(" ")}
      >
        {tab === "summary" && run.brief && <SummaryView run={run} />}
        {tab === "brief" && run.brief && <BriefView brief={run.brief} />}
        {tab === "plan" && run.plan && <PlanView plan={run.plan} />}
        {tab === "landing" && run.landing && (
          <LandingPreview landing={run.landing} />
        )}
        {tab === "scaffold" && run.scaffold && (
          <ScaffoldView scaffold={run.scaffold} runId={run.id} />
        )}
        {tab === "summary" && !run.brief && (
          <p className="text-sm text-mist">Waiting for summary…</p>
        )}
        {tab === "brief" && !run.brief && (
          <p className="text-sm text-mist">Waiting for brief…</p>
        )}
      </div>
    </div>
  );
}
