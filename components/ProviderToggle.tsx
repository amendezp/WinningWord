"use client";

import { useProviderStore, type ProviderMode } from "@/lib/store/providerPreference";

const OPTIONS: Array<{ id: ProviderMode; label: string; title: string }> = [
  {
    id: "anthropic",
    label: "Claude",
    title: "Anthropic Claude (autoregressive). Highest accuracy on the eval suite.",
  },
  {
    id: "inception",
    label: "Mercury",
    title:
      "Inception Labs Mercury 2 (diffusion). Much faster end-to-end; sometimes under-flags multi-issue paragraphs.",
  },
];

/**
 * Two-option pill in the top bar: autoregressive vs diffusion.
 * Persisted to localStorage. Latency badges on suggestion cards make the
 * comparison visible as the user writes.
 */
export function ProviderToggle() {
  const providerMode = useProviderStore((s) => s.providerMode);
  const setProvider = useProviderStore((s) => s.setProvider);

  return (
    <div
      role="radiogroup"
      aria-label="Analysis provider"
      className="flex items-center rounded-full border border-stone-300 bg-paper p-0.5 text-xs"
    >
      {OPTIONS.map((opt) => {
        const active = providerMode === opt.id;
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
