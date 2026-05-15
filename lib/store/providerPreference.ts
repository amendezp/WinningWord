import { create } from "zustand";
import type { ProviderId } from "@/lib/analyze/providers";

const PREF_KEY = "ww:provider:v1";

function loadInitial(): ProviderId {
  if (typeof window === "undefined") return "anthropic";
  try {
    const raw = window.localStorage.getItem(PREF_KEY);
    if (raw === "inception" || raw === "anthropic") return raw;
  } catch {
    // fall through
  }
  return "anthropic";
}

function save(id: ProviderId) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREF_KEY, id);
  } catch {
    // best effort
  }
}

type Store = {
  providerId: ProviderId;
  setProvider: (id: ProviderId) => void;
};

export const useProviderStore = create<Store>((set) => ({
  providerId: loadInitial(),
  setProvider: (id) => {
    save(id);
    set({ providerId: id });
  },
}));
