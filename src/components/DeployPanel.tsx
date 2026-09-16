"use client";

import { useCallback, useState } from "react";
import { CopyButton } from "./CopyButton";

type DeployResponse = {
  mode: "manual" | "vercel" | "error";
  reason?: string;
  instructions?: string[];
  commands?: string[];
  downloadUrl?: string;
  vercelNewUrl?: string;
  vercelImportHint?: string;
  url?: string;
  inspectorUrl?: string;
  message?: string;
  error?: string;
  fallback?: {
    instructions: string[];
    commands: string[];
    downloadUrl: string;
    vercelNewUrl: string;
    vercelImportHint: string;
    reason: string;
  };
};

const NPX_VERCEL = `npm install
npx vercel
# production:
npx vercel --prod`;

export function DeployPanel({
  runId,
  projectName,
  compact = false,
}: {
  runId: string;
  projectName?: string;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<DeployResponse | null>(null);
  const [guideOpen, setGuideOpen] = useState(false);

  const deploy = useCallback(async () => {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch(`/api/runs/${runId}/deploy`, { method: "POST" });
      const data = (await res.json()) as DeployResponse;
      setResult(data);
      if (data.mode === "manual" || data.mode === "error") {
        setGuideOpen(true);
      }
    } catch (err) {
      setResult({
        mode: "error",
        error: err instanceof Error ? err.message : "Deploy request failed",
        fallback: {
          reason: "Network error",
          instructions: [
            "Download the scaffold ZIP, unzip, then run npx vercel from that folder.",
          ],
          commands: ["npm install", "npx vercel"],
          downloadUrl: `/api/runs/${runId}/scaffold`,
          vercelNewUrl: "https://vercel.com/new",
          vercelImportHint: "Import the unzipped folder at vercel.com/new.",
        },
      });
      setGuideOpen(true);
    } finally {
      setBusy(false);
    }
  }, [runId]);

  const guide =
    result?.mode === "manual"
      ? result
      : result?.mode === "error"
        ? result.fallback
        : null;

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4"
      }
    >
      {!compact && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-forge">
            Deploy
          </p>
          <p className="mt-1 text-sm text-mist">
            Ship {projectName || "your scaffold"} without Cloud Agents — Vercel
            API when configured, or one-command CLI.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={deploy}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ember to-forge px-4 py-2 text-xs font-semibold text-ink shadow-glow transition hover:brightness-110 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
        >
          {busy ? "Deploying…" : "Deploy with Vercel"}
        </button>
        <button
          type="button"
          onClick={() => setGuideOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-mist transition hover:border-ember/40 hover:text-snow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
        >
          {guideOpen ? "Hide deploy guide" : "Open deploy guide"}
        </button>
        <a
          href={`/api/runs/${runId}/scaffold`}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-mist transition hover:border-ember/40 hover:text-snow"
        >
          Download ZIP
        </a>
        <CopyButton text={NPX_VERCEL} label="Copy npx vercel" />
      </div>

      {result?.mode === "vercel" && (
        <div className="rounded-xl border border-forge/30 bg-forge/10 px-3.5 py-3 text-sm text-snow">
          <p className="font-medium text-forge">Vercel deployment started</p>
          <p className="mt-1 text-mist">{result.message}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            {result.url && (
              <a
                href={result.url}
                target="_blank"
                rel="noreferrer"
                className="text-ember underline-offset-2 hover:underline"
              >
                Open deployment
              </a>
            )}
            {result.inspectorUrl && (
              <a
                href={result.inspectorUrl}
                target="_blank"
                rel="noreferrer"
                className="text-ember underline-offset-2 hover:underline"
              >
                Vercel inspector
              </a>
            )}
          </div>
        </div>
      )}

      {result?.mode === "error" && (
        <p className="text-xs text-red-300">
          Deploy API error: {result.error}. Use the guide below.
        </p>
      )}

      {(guideOpen || result?.mode === "manual") && (
        <div className="space-y-2 rounded-xl border border-white/5 bg-ink/40 p-3.5">
          <p className="text-xs font-medium uppercase tracking-wider text-mist">
            Deploy guide
          </p>
          {guide?.reason && (
            <p className="text-xs text-mist/90">{guide.reason}</p>
          )}
          <ol className="list-decimal space-y-1 pl-4 text-sm text-snow/90">
            {(guide?.instructions || [
              "Download the scaffold ZIP and unzip it.",
              "From the project folder run npm install && npx vercel.",
              "Or import the folder at https://vercel.com/new.",
            ]).map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <pre className="overflow-auto rounded-lg border border-white/5 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-mist">
            {(guide?.commands || ["npm install", "npx vercel"]).join("\n")}
          </pre>
          <div className="flex flex-wrap gap-2 pt-1">
            <a
              href={guide?.vercelNewUrl || "https://vercel.com/new"}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-ember underline-offset-2 hover:underline"
            >
              Open vercel.com/new
            </a>
            <span className="text-xs text-mist/70">
              {guide?.vercelImportHint ||
                "Import GitHub repo or upload the unzipped scaffold."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
