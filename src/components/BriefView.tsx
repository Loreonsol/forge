import type { ProductBrief } from "@/lib/types";
import { CopyButton } from "./CopyButton";

export function BriefView({ brief }: { brief: ProductBrief }) {
  const copyText = [
    `# ${brief.selectedName}`,
    brief.oneLiner,
    "",
    `Target user: ${brief.targetUser}`,
    "",
    `Problem: ${brief.problem}`,
    "",
    `Value prop: ${brief.valueProp}`,
    "",
    "Name options:",
    ...brief.nameOptions.map((n) => `- ${n}`),
    "",
    "Differentiators:",
    ...brief.differentiators.map((d) => `- ${d}`),
  ].join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ember">
            Product brief
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-snow">
            {brief.selectedName}
          </h2>
          <p className="mt-2 text-mist">{brief.oneLiner}</p>
        </div>
        <CopyButton text={copyText} label="Copy brief" />
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <dt className="text-xs font-medium text-mist">Target user</dt>
          <dd className="mt-1.5 text-sm text-snow">{brief.targetUser}</dd>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <dt className="text-xs font-medium text-mist">Value proposition</dt>
          <dd className="mt-1.5 text-sm text-snow">{brief.valueProp}</dd>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:col-span-2">
          <dt className="text-xs font-medium text-mist">Problem</dt>
          <dd className="mt-1.5 text-sm leading-relaxed text-snow">
            {brief.problem}
          </dd>
        </div>
      </dl>

      <div>
        <h3 className="mb-2 text-sm font-medium text-mist">Name options</h3>
        <div className="flex flex-wrap gap-2">
          {brief.nameOptions.map((n) => (
            <span
              key={n}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                n === brief.selectedName
                  ? "bg-ember/20 text-ember ring-1 ring-ember/40"
                  : "bg-white/5 text-mist",
              ].join(" ")}
            >
              {n}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-mist">Differentiators</h3>
        <ul className="space-y-2">
          {brief.differentiators.map((d) => (
            <li
              key={d}
              className="flex gap-2 text-sm text-snow/90 before:mt-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:bg-forge"
            >
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
