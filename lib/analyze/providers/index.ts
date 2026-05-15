import { anthropicProvider } from "./anthropic";
import { inceptionProvider } from "./inception";
import type { AnalysisProvider, ProviderId } from "./types";

const REGISTRY: Record<ProviderId, AnalysisProvider> = {
  anthropic: anthropicProvider,
  inception: inceptionProvider,
};

export function getProvider(id: ProviderId | undefined): AnalysisProvider {
  if (!id) return REGISTRY.anthropic;
  return REGISTRY[id] ?? REGISTRY.anthropic;
}

export const PROVIDER_IDS: ProviderId[] = ["anthropic", "inception"];

export type { AnalysisProvider, ProviderId } from "./types";
