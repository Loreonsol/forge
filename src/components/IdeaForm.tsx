"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform, Tone } from "@/lib/types";

const EXAMPLES = [
  "AI meal planner for busy parents",
  "Budget tracker for freelancers who hate spreadsheets",
  "Habit coach that adapts when you miss a day",
  "API for turning meeting notes into action items",
];

export function IdeaForm() {
  const router = useRouter();
  const [idea, setIdea] = useState("");
  const [audience, setAudience] = useState("");
  const [platform, setPlatform] = useState<Platform>("web");
  const [tone, setTone] = useState<Tone>("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMore, setShowMore] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          audience: audience || undefined,
          platform,
          tone,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start run");
      router.push(`/runs/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-2xl">
      <label className="sr-only" htmlFor="idea">
        Product idea
      </label>
      <div className="relative rounded-2xl border border-white/10 bg-panel/80 p-1 shadow-panel backdrop-blur-xl">
        <textarea
          id="idea"
          rows={3}
          required
          minLength={3}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="What should we build?"
          className="w-full resize-none rounded-xl bg-transparent px-4 py-3.5 text-lg text-snow placeholder:text-mist/70 focus:outline-none focus-visible:ring-1 focus-visible:ring-forge/40"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="text-xs font-medium text-mist transition hover:text-snow"
          >
            {showMore ? "Hide constraints" : "Add constraints"}
          </button>
          <button
            type="submit"
            disabled={loading || idea.trim().length < 3}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-ember to-forge px-5 py-2 text-sm font-semibold text-ink shadow-glow transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge"
          >
            {loading ? "Forging…" : "Forge it"}
            <span aria-hidden>↗</span>
          </button>
        </div>
      </div>

      {showMore && (
        <div className="mt-4 grid gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <label className="mb-1.5 block text-xs font-medium text-mist">
              Audience (optional)
            </label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. busy parents, indie founders"
              className="w-full rounded-xl border border-white/10 bg-ink/60 px-3 py-2 text-sm text-snow placeholder:text-mist/50 focus:border-forge/50 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-mist">
              Platform
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as Platform)}
              className="w-full rounded-xl border border-white/10 bg-ink/60 px-3 py-2 text-sm text-snow focus:border-forge/50 focus:outline-none"
            >
              <option value="web">Web</option>
              <option value="mobile">Mobile</option>
              <option value="api">API</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-mist">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as Tone)}
              className="w-full rounded-xl border border-white/10 bg-ink/60 px-3 py-2 text-sm text-snow focus:border-forge/50 focus:outline-none"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="playful">Playful</option>
              <option value="bold">Bold</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setIdea(ex)}
            className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-xs text-mist transition hover:border-white/15 hover:text-snow"
          >
            {ex}
          </button>
        ))}
      </div>
    </form>
  );
}
