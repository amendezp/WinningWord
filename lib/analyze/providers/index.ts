import { anthropicProvider } from "./anthropic";
import { inceptionProvider } from "./inception";
import type { AnalysisProvider, ProviderId } from "./types";

const REGISTRY: Record<ProviderId, AnalysisProvider> = {
  anthropic: anthropicProvider,
  inception: inceptionProvider,
};

/**
 * Returns the requested provider, falling back to Anthropic for any
 * unrecognised id or missing argument. The fallback is intentional —
 * the routes accept a `provider` field from the client; we'd rather
 * silently use the safe default than throw.
 */
export function getProvider(id?: ProviderId): AnalysisProvider {
  if (!id) return REGISTRY.anthropic;
  return REGISTRY[id] ?? REGISTRY.anthropic;
}

export const PROVIDER_IDS: ProviderId[] = ["anthropic", "inception"];

export type { AnalysisProvider, ProviderId } from "./types";
