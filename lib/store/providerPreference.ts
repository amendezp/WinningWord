import { create } from "zustand";
import type { ProviderId } from "@/lib/analyze/providers";

/**
 * Two-option toggle: Claude (autoregressive) vs Mercury (diffusion).
 *
 * Storage key bumped to v3 so any stale "hybrid" value left over from
 * earlier three-pill versions is ignored. Default is "anthropic" —
 * the user can opt into Mercury via the top-bar toggle.
 */
export type ProviderMode = ProviderId;

const PREF_KEY = "ww:provider:v3";

function loadInitial(): ProviderMode {
  if (typeof window === "undefined") return "anthropic";
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (raw === "anthropic" || raw === "inception") return raw;
  } catch {
    // fall through
  }
  return "anthropic";
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
