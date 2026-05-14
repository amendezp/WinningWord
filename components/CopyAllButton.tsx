"use client";

import { useState } from "react";

export function CopyAllButton() {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle");

  const handleClick = async () => {
    const w = window as unknown as { __wwCopyAll?: () => Promise<boolean> };
    const ok = (await w.__wwCopyAll?.()) ?? false;
    setState(ok ? "copied" : "error");
    setTimeout(() => setState("idle"), 1600);
  };

  return (
    <button
      onClick={handleClick}
      className="text-sm text-stone-500 hover:text-stone-900 underline-offset-2 hover:underline transition"
      title="Copy the entire document to your clipboard"
    >
      {state === "copied" ? "✓ Copied" : state === "error" ? "Couldn't copy" : "Copy all"}
    </button>
  );
}
