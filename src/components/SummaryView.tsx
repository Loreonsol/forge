"use client";

import type { ForgeRun } from "@/lib/types";
import { CopyButton } from "./CopyButton";
import { DownloadPdfButton } from "./DownloadPdfButton";
import { DeployPanel } from "./DeployPanel";

export function SummaryView({ run }: { run: ForgeRun }) {
  const brief = run.brief;
  const plan = run.plan;
  const brand = run.brandKit;
  const name = brief?.selectedName || brand?.name || "Your product";

  const pitch = brief?.oneLiner || run.input.idea;
  const bullets: string[] = [];
  if (brief) {
    bullets.push(`For: ${brief.targetUser}`);
    bullets.push(brief.problem.length > 140 ? `${brief.problem.slice(0, 137)}…` : brief.problem);
    bullets.push(brief.valueProp.length > 140 ? `${brief.valueProp.slice(0, 137)}…` : brief.valueProp);
  }
  if (plan?.v0Features?.[0]) {
    bullets.push(`v0 starts with: ${plan.v0Features[0]}`);
  }
  if (plan?.milestones?.[0]) {
    bullets.push(
      `First milestone: ${plan.milestones[0].title} (${plan.milestones[0].estimate})`
    );
  }

  const copyText = [
    `# ${name}`,
    pitch,
    "",
    ...bullets.map((b) => `- ${b}`),
    "",
    brief
      ? [
          `Value prop: ${brief.valueProp}`,
          `Names: ${brief.nameOptions.join(", ")}`,
        ].join("\n")
      : "",
    brand
      ? [
          "",
          "Brand kit:",
          `- Primary: ${brand.primary}`,
          `- Accent: ${brand.accent}`,
          `- Voice: ${brand.voiceAdjectives.join(", ")}`,
          `- Mark: ${brand.logoMarkLetter}`,
        ].join("\n")
      : "",
    plan
      ? [
          "",
          "Features:",
          ...plan.v0Features.map((f) => `- ${f}`),
        ].join("\n")
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ember">
            Summary
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-snow">
            {name}
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-relaxed text-mist">
            {pitch}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={copyText} label="Copy summary" />
          <DownloadPdfButton run={run} />
        </div>
      </div>

      {brand && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-ink"
            style={{ backgroundColor: brand.accent }}
            aria-hidden
          >
            {brand.logoMarkLetter}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-mist">
              Brand kit
            </p>
            <p className="text-sm text-snow">
              {brand.name} · {brand.voiceAdjectives.join(" · ")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-6 w-6 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: brand.primary }}
              title={`Primary ${brand.primary}`}
            />
            <span
              className="h-6 w-6 rounded-full ring-1 ring-white/20"
              style={{ backgroundColor: brand.accent }}
              title={`Accent ${brand.accent}`}
            />
            <span className="font-mono text-[10px] text-mist">
              {brand.primary} / {brand.accent}
            </span>
          </div>
        </div>
      )}

      {brief?.refineNotes && brief.refineNotes.length > 0 && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-mist">
            Refine notes
          </p>
          <ul className="mt-2 space-y-1.5">
            {brief.refineNotes.map((n) => (
              <li key={n} className="text-sm text-snow/85">
                · {n}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-ember/25 bg-gradient-to-br from-ember/10 via-white/[0.03] to-transparent p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-ember">
          Elevator pitch
        </p>
        <p className="mt-2 text-lg font-medium leading-snug tracking-tight text-snow">
          {brief?.valueProp || pitch}
        </p>
      </div>

      {bullets.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-mist">Key bullets</h3>
          <ul className="space-y-2">
            {bullets.map((b) => (
              <li
                key={b}
                className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-2.5 text-sm text-snow/90"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forge" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-mist">
            Brief
          </p>
          <p className="mt-1.5 text-sm text-snow">
            {brief ? "Ready — names, problem, value prop" : "Forging…"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-mist">
            Plan
          </p>
          <p className="mt-1.5 text-sm text-snow">
            {plan
              ? `${plan.v0Features.length} features · ${plan.milestones.length} milestones`
              : "Queued"}
          </p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-mist">
            Deliverables
          </p>
          <p className="mt-1.5 text-sm text-snow">
            {[
              run.landing ? "Landing" : null,
              run.scaffold ? "Scaffold ZIP" : null,
              brief ? "PDF summary" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "In progress"}
          </p>
        </div>
      </div>

      {run.scaffold && (
        <DeployPanel
          runId={run.id}
          projectName={run.scaffold.projectName}
        />
      )}

      <p className="text-xs text-mist/80">
        Tip: use <span className="text-snow/80">Download PDF</span> for a
        shareable brief+plan pack, or{" "}
        <span className="text-snow/80">Download scaffold ZIP</span> for the
        starter repo — both stay available. Deploy works with or without{" "}
        <span className="text-snow/80">VERCEL_TOKEN</span>.
      </p>
    </div>
  );
}
