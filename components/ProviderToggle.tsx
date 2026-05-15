"use client";

import { useProviderStore } from "@/lib/store/providerPreference";
import type { ProviderId } from "@/lib/analyze/providers";

const OPTIONS: Array<{ id: ProviderId; label: string; title: string }> = [
  { id: "anthropic", label: "Claude", title: "Anthropic Claude (autoregressive)" },
  { id: "inception", label: "Mercury", title: "Inception Labs Mercury (diffusion)" },
];

/**
 * Two-option pill in the top bar to switch between the autoregressive
 * (Anthropic) and diffusion (Inception Mercury) providers. Persisted to
 * localStorage. Latency badges on suggestion cards make the comparison
 * visible as the user writes.
 */
export function ProviderToggle() {
  const providerId = useProviderStore((s) => s.providerId);
  const setProvider = useProviderStore((s) => s.setProvider);

  return (
    <div
      role="radiogroup"
      aria-label="Analysis provider"
      className="flex items-center rounded-full border border-stone-300 bg-paper p-0.5 text-xs"
    >
      {OPTIONS.map((opt) => {
        const active = providerId === opt.id;
        return (
          <button
            key={opt.id}
            role="radio"
            aria-checked={active}
            title={opt.title}
            onClick={() => setProvider(opt.id)}
            className={`px-2.5 py-0.5 rounded-full transition
              ${
                active
                  ? "bg-stone-800 text-stone-50"
                  : "text-stone-600 hover:text-stone-900"
              }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
