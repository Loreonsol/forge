import type { Scaffold } from "@/lib/types";

export function ScaffoldView({
  scaffold,
  runId,
}: {
  scaffold: Scaffold;
  runId: string;
}) {
  const tree = scaffold.files.map((f) => f.path).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-forge">
            Code scaffold
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-snow">
            {scaffold.projectName}
          </h2>
          <p className="mt-1 text-sm text-mist">
            Minimal Next.js starter matching the build plan — download and run
            locally.
          </p>
        </div>
        <a
          href={`/api/runs/${runId}/scaffold`}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ember to-forge px-4 py-2 text-xs font-semibold text-ink shadow-glow transition hover:brightness-110"
        >
          Download ZIP
        </a>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-mist">
            Files ({scaffold.files.length})
          </h3>
          <ul className="max-h-80 space-y-1 overflow-auto font-mono text-xs text-snow/90">
            {tree.map((p) => (
              <li key={p} className="truncate rounded px-1.5 py-0.5 hover:bg-white/5">
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
          <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-mist">
            README preview
          </h3>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-mist">
            {scaffold.readme.slice(0, 1800)}
            {scaffold.readme.length > 1800 ? "…" : ""}
          </pre>
        </div>
      </div>
    </div>
  );
}
