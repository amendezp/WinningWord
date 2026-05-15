import { create } from "zustand";
import type { ProviderId } from "@/lib/analyze/providers";

/**
 * The user-facing selection. Three options:
 *   - "anthropic" — both passes use Claude
 *   - "inception" — both passes use Mercury
 *   - "hybrid"   — best of both: Pass A on Claude (paragraph quality),
 *                   Pass B on Mercury (8× speed-up on the bigger payload)
 *
 * Evals back this: Claude is 100% on every paragraph rule; Mercury matches
 * Claude on every document rule while running ~8× faster.
 */
export type ProviderMode = "anthropic" | "inception" | "hybrid";

const PREF_KEY = "ww:provider:v2"; // v2 — added "hybrid"

function loadInitial(): ProviderMode {
  if (typeof window === "undefined") return "hybrid";
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (raw === "anthropic" || raw === "inception" || raw === "hybrid") return raw;
  } catch {
    // fall through
  }
  return "hybrid";
}

function save(mode: ProviderMode) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, mode);
  } catch {
    // best effort
  }
}

type Store = {
  providerMode: ProviderMode;
  setProvider: (mode: ProviderMode) => void;
};

export const useProviderStore = create<Store>((set) => ({
  providerMode: loadInitial(),
  setProvider: (mode) => {
    save(mode);
    set({ providerMode: mode });
  },
}));

/**
 * Convert the user's selection into per-pass provider routing. Pass A
 * (paragraph) and Pass B (document) can target different providers.
 */
export function deriveProviders(mode: ProviderMode): {
  paragraph: ProviderId;
  document: ProviderId;
} {
  if (mode === "hybrid") return { paragraph: "anthropic", document: "inception" };
  return { paragraph: mode, document: mode };
}
