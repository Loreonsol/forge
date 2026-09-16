"use client";

import { useState } from "react";
import type { ForgeRun } from "@/lib/types";

export function DownloadPdfButton({
  run,
  className,
}: {
  run: ForgeRun;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);
  const ready = !!run.brief;

  async function onClick() {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const { downloadSummaryPdf } = await import("@/lib/pdf-summary");
      downloadSummaryPdf(run);
    } catch {
      // User can retry; keep UI quiet
    } finally {
      setTimeout(() => setBusy(false), 400);
    }
  }

  return (
    <button
      type="button"
      disabled={!ready || busy}
      onClick={onClick}
      title={
        ready
          ? "Download a multi-page PDF of the brief, plan, and next steps"
          : "PDF available once the brief is ready"
      }
      className={
        className ||
        "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-snow transition hover:border-ember/50 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
      }
    >
      {busy ? "Preparing PDF…" : "Download PDF"}
    </button>
  );
}
