import { anthropicProvider } from "./anthropic";
import type { AnalysisProvider } from "./types";

/**
 * Only Anthropic ships today. The provider interface is kept so a second
 * backend (Mercury, OpenAI, local) can be plugged in later without touching
 * the routes, the store, or the UI.
 */
export function getProvider(): AnalysisProvider {
  return anthropicProvider;
}

export type { AnalysisProvider, ProviderId } from "./types";
