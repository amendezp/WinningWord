"use client";

import type { ParagraphSuggestion } from "@/lib/store/suggestions";
import { ruleById } from "@/lib/rules/catalog";

export function SuggestionCard({
  s,
  isFocused,
  onFocus,
  onDismiss,
}: {
  s: ParagraphSuggestion;
  isFocused: boolean;
  onFocus: () => void;
  onDismiss: () => void;
}) {
  const rule = ruleById(s.ruleId);

  // Per-tier styling. Issue = rose, improve = amber, praise = emerald.
  const themed = {
    issue: {
      border: "border-rose-300 bg-rose-50/60",
      ring: "ring-2 ring-rose-400",
      buttonBorder: "border-rose-400 text-rose-700 hover:bg-rose-100",
      buttonLabel: "Apply rewrite",
    },
    improve: {
      border: "border-amber-300 bg-amber-50/60",
      ring: "ring-2 ring-amber-400",
      buttonBorder: "border-amber-500 text-amber-800 hover:bg-amber-100",
      buttonLabel: "Try this",
    },
    praise: {
      border: "border-emerald-300 bg-emerald-50/60",
      ring: "ring-2 ring-emerald-400",
      buttonBorder: "border-emerald-400 text-emerald-700 hover:bg-emerald-100",
      buttonLabel: "🎉 Nice",
    },
  }[s.kind];

  const ringClass = isFocused ? themed.ring : "";
  const isPraise = s.kind === "praise";
  const canApply = !isPraise && typeof s.suggestion === "string" && s.suggestion.length > 0;

  const handleApply = () => {
    const w = window as unknown as {
      __wwApplySuggestion?: (
        paragraphIndex: number,
        phrase: string,
        replacement: string
      ) => boolean;
    };
    w.__wwApplySuggestion?.(s.paragraphIndex, s.phrase, s.suggestion ?? "");
    onDismiss();
  };

  return (
    <div
      onClick={onFocus}
      className={`rounded-lg border ${themed.border} ${ringClass} p-4 mb-3 cursor-pointer transition-shadow hover:shadow-sm`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm uppercase tracking-wide text-stone-500">
          {rule?.name ?? s.ruleId}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-base text-stone-400 hover:text-stone-700"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      <div className="font-serif italic text-stone-700 mt-1.5 text-lg">“{s.phrase}”</div>
      <div className="text-base text-stone-800 mt-1.5">{s.rationale}</div>

      {s.suggestion && (
        <div className="text-base mt-2.5">
          <span className="text-stone-500 text-xs uppercase tracking-wide mr-1">Try:</span>
          <span className="font-serif text-stone-900 text-lg">“{s.suggestion}”</span>
        </div>
      )}

      <div className="mt-3 flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            isPraise ? onDismiss() : handleApply();
          }}
          disabled={!isPraise && !canApply}
          className={`text-sm px-3 py-1 rounded-full border transition
            ${
              (!isPraise && !canApply)
                ? "border-stone-200 text-stone-300 cursor-not-allowed"
                : themed.buttonBorder
            }`}
          title={
            isPraise
              ? "Celebrate this and move on"
              : canApply
              ? "Replace the phrase in the document"
              : "No rewrite to apply"
          }
        >
          {themed.buttonLabel}
        </button>
      </div>
    </div>
  );
}
