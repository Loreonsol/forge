"use client";

import { useCallback, useRef, useState } from "react";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to legacy path
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export function CopyButton({
  text,
  label = "Copy",
  successLabel = "Copied!",
  className,
}: {
  text: string;
  label?: string;
  successLabel?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = useCallback(async () => {
    if (!text) return;
    const ok = await writeClipboard(text);
    setStatus(ok ? "ok" : "fail");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus("idle"), 1800);
  }, [text]);

  const shown =
    status === "ok" ? successLabel : status === "fail" ? "Copy failed" : label;

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-live="polite"
      className={
        className ||
        [
          "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forge",
          status === "ok"
            ? "border-forge/50 bg-forge/15 text-forge"
            : status === "fail"
              ? "border-red-400/40 bg-red-500/10 text-red-300"
              : "border-white/10 bg-white/5 text-mist hover:border-ember/40 hover:text-snow",
        ].join(" ")
      }
    >
      {status === "ok" ? (
        <span aria-hidden className="text-[10px]">
          ✓
        </span>
      ) : null}
      {shown}
    </button>
  );
}
