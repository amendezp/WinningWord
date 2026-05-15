"use client";

import { useProviderStore, type ProviderMode } from "@/lib/store/providerPreference";

const OPTIONS: Array<{ id: ProviderMode; label: string; title: string }> = [
  {
    id: "anthropic",
    label: "Claude",
    title: "Anthropic Claude on both passes (highest accuracy)",
  },
  {
    id: "hybrid",
    label: "Hybrid",
    title:
      "Best of both: Claude for paragraph coaching (100% accuracy), Mercury for whole-document review (8× faster)",
  },
  {
    id: "inception",
    label: "Mercury",
    title: "Inception Labs Mercury on both passes (fastest, lower paragraph accuracy)",
  },
];

/**
 * Three-option pill in the top bar. Default is "Hybrid" — evals show it's
 * the strict best of both: same accuracy as Claude on every rule, with
 * Mercury's 8× speedup on the document pass.
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
