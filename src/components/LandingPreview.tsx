"use client";

import { useState } from "react";
import type { LandingPage } from "@/lib/types";

export function LandingPreview({ landing }: { landing: LandingPage }) {
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ember">
            Landing page
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-snow">
            Live preview
          </h2>
          <p className="mt-1 text-sm text-mist">{landing.headline}</p>
        </div>
        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-snow/80 transition hover:border-ember/40 hover:text-snow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
        >
          Fullscreen
        </button>
      </div>

      {/* Single scroll surface: chrome + tall iframe, no nested page scroll */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black shadow-panel">
        <div className="flex items-center gap-1.5 border-b border-white/10 bg-white/[0.04] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 truncate font-mono text-[11px] text-snow/70">
            preview · generated landing
          </span>
        </div>
        <iframe
          title="Landing page preview"
          srcDoc={landing.html}
          className="block h-[min(78vh,820px)] w-full bg-slate-950"
          sandbox="allow-scripts"
        />
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-ink">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-snow">Landing preview</p>
            <button
              type="button"
              onClick={() => setFullscreen(false)}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-snow hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
            >
              Close
            </button>
          </div>
          <iframe
            title="Landing page fullscreen"
            srcDoc={landing.html}
            className="h-full w-full flex-1 bg-slate-950"
            sandbox="allow-scripts"
          />
        </div>
      )}
    </div>
  );
}
