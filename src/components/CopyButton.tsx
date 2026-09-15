"use client";

import { useState } from "react";

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [done, setDone] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-mist transition hover:border-ember/40 hover:text-snow"
    >
      {done ? "Copied" : label}
    </button>
  );
}
