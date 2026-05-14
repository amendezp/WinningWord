"use client";

import { useState } from "react";

/**
 * Floating Copy-all icon button. Anchored in the lower-right of the editor area
 * by the parent (EditorWorkspace), so we only render the button itself.
 */
export function CopyAllButton() {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  const handleClick = async () => {
    const w = window as unknown as { __wwCopyAll?: () => Promise<boolean> };
    const ok = (await w.__wwCopyAll?.()) ?? false;
    setState(ok ? "copied" : "error");
    setTimeout(() => setState("idle"), 1600);
  };

  const title =
    state === "copied"
      ? "Copied"
      : state === "error"
      ? "Couldn't copy"
      : "Copy entire document";

  const showLabel = state !== "idle";
  const labelText = state === "copied" ? "Copied to clipboard" : "Couldn't copy";

  return (
    <button
      onClick={handleClick}
      title={title}
      aria-label={title}
      className={`group flex items-center gap-2 h-11 rounded-full
        bg-paper/95 border shadow-sm transition-all duration-200
        ${showLabel ? "px-4" : "w-11 justify-center"}
        ${
          state === "copied"
            ? "border-emerald-400 text-emerald-700"
            : state === "error"
            ? "border-rose-400 text-rose-700"
            : "border-stone-300 text-stone-600 hover:text-stone-900 hover:border-stone-500"
        }`}
    >
      {state === "copied" ? <CheckIcon /> : <ClipboardIcon />}
      {showLabel && (
        <span className="text-sm font-medium whitespace-nowrap">{labelText}</span>
      )}
    </button>
  );
}

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="4" rx="1.5" />
      <path d="M9 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5 12 10 17 19 7" />
    </svg>
  );
}
