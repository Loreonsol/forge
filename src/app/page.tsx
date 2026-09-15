import { IdeaForm } from "@/components/IdeaForm";
import { listRuns } from "@/lib/store";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const recent = await listRuns(5);

  return (
    <div className="relative overflow-hidden">
      <section className="mx-auto flex max-w-4xl flex-col items-center px-5 pb-20 pt-16 text-center sm:pt-24">
        <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-mist">
          <span className="h-1.5 w-1.5 rounded-full bg-ember" />
          Company that builds companies
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-snow sm:text-6xl sm:leading-[1.05]">
          Drop in an idea.
          <span className="block bg-gradient-to-r from-ember via-orange-300 to-forge bg-clip-text text-transparent">
            Walk out with a product.
          </span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-mist sm:text-lg">
          Forge clarifies the brief, drafts a build plan, generates a live
          marketing landing page, and packs a starter Next.js repo — all without
          API keys.
        </p>

        <div className="mt-10 w-full">
          <IdeaForm />
        </div>

        <div className="mt-16 grid w-full max-w-3xl gap-3 text-left sm:grid-cols-4">
          {[
            ["01", "Clarify", "Names, one-liner, problem, value"],
            ["02", "Plan", "v0 features, stack, milestones"],
            ["03", "Landing", "Rendered HTML preview in-app"],
            ["04", "Scaffold", "Downloadable Next.js ZIP"],
          ].map(([n, t, d]) => (
            <div
              key={n}
              className="rounded-2xl border border-white/5 bg-white/[0.02] p-4"
            >
              <p className="font-mono text-[11px] text-ember">{n}</p>
              <p className="mt-1 text-sm font-medium text-snow">{t}</p>
              <p className="mt-1 text-xs text-mist">{d}</p>
            </div>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="mt-16 w-full max-w-2xl text-left">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-mist">
              Recent runs
            </h2>
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/runs/${r.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm transition hover:border-white/15"
                  >
                    <span className="truncate text-snow">
                      {r.brief?.selectedName || r.input.idea}
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase text-mist">
                      {r.stage}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
