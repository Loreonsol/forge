import type { BuildPlan } from "@/lib/types";
import { CopyButton } from "./CopyButton";

export function PlanView({ plan }: { plan: BuildPlan }) {
  const copyText = [
    "# Build plan",
    "",
    "## v0 features",
    ...plan.v0Features.map((f) => `- ${f}`),
    "",
    "## Tech stack",
    `Frontend: ${plan.techStack.frontend.join(", ")}`,
    `Backend: ${plan.techStack.backend.join(", ")}`,
    `Infra: ${plan.techStack.infra.join(", ")}`,
    "",
    "## Milestones",
    ...plan.milestones.map(
      (m) => `- ${m.title} (${m.estimate}): ${m.description}`
    ),
    "",
    "## Out of scope",
    ...plan.outOfScope.map((o) => `- ${o}`),
  ].join("\n");

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-forge">
            Build plan
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-snow">
            Path to v0
          </h2>
        </div>
        <CopyButton text={copyText} label="Copy plan" />
      </div>

      <section>
        <h3 className="mb-3 text-sm font-medium text-mist">v0 features</h3>
        <ol className="space-y-2">
          {plan.v0Features.map((f, i) => (
            <li
              key={f}
              className="flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5 text-sm text-snow"
            >
              <span className="font-mono text-xs text-ember">
                {String(i + 1).padStart(2, "0")}
              </span>
              {f}
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {(
          [
            ["Frontend", plan.techStack.frontend],
            ["Backend", plan.techStack.backend],
            ["Infra", plan.techStack.infra],
          ] as const
        ).map(([label, items]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
          >
            <h3 className="text-xs font-medium uppercase tracking-wider text-mist">
              {label}
            </h3>
            <ul className="mt-2 space-y-1">
              {items.map((item) => (
                <li key={item} className="text-sm text-snow">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-medium text-mist">Milestones</h3>
        <div className="relative space-y-0 border-l border-white/10 pl-5">
          {plan.milestones.map((m) => (
            <div key={m.title} className="relative pb-6 last:pb-0">
              <span className="absolute -left-[1.4rem] top-1 h-2.5 w-2.5 rounded-full bg-forge shadow-glow" />
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className="font-medium text-snow">{m.title}</h4>
                <span className="text-xs text-mist">{m.estimate}</span>
              </div>
              <p className="mt-1 text-sm text-mist">{m.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-medium text-mist">Out of scope</h3>
        <ul className="flex flex-wrap gap-2">
          {plan.outOfScope.map((o) => (
            <li
              key={o}
              className="rounded-full border border-white/5 px-3 py-1 text-xs text-mist"
            >
              {o}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
