"use client";

import { useEffect, useState } from "react";

type EnginePayload = {
  mode: "mock" | "llm";
  label: string;
  model?: string | null;
};

export function EngineBadge({
  initialLabel,
  className = "",
}: {
  /** Optional label from SSR / run payload — avoids flash. */
  initialLabel?: string;
  className?: string;
}) {
  const [label, setLabel] = useState(initialLabel || "Engine: …");

  useEffect(() => {
    if (initialLabel) {
      setLabel(initialLabel);
      return;
    }
    let cancelled = false;
    fetch("/api/engine", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: EnginePayload | null) => {
        if (!cancelled && data?.label) setLabel(data.label);
      })
      .catch(() => {
        if (!cancelled) setLabel("Engine: Mock");
      });
    return () => {
      cancelled = true;
    };
  }, [initialLabel]);

  const isLlm = /LLM/i.test(label);

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        isLlm
          ? "border-forge/40 bg-forge/10 text-forge"
          : "border-white/10 bg-white/[0.04] text-mist",
        className,
      ].join(" ")}
      title="Active IdeaEngine"
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          isLlm ? "bg-forge" : "bg-mist/70",
        ].join(" ")}
      />
      {label}
    </span>
  );
}
