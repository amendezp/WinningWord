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
  const isIssue = s.kind === "issue";
  const accent = isIssue
    ? "border-rose-300 bg-rose-50/60"
    : "border-emerald-300 bg-emerald-50/60";
  const ringClass = isFocused
    ? isIssue
      ? "ring-2 ring-rose-400"
      : "ring-2 ring-emerald-400"
    : "";
  return (
    <div
      onClick={onFocus}
      className={`rounded-lg border ${accent} ${ringClass} p-4 mb-3 cursor-pointer transition-shadow hover:shadow-sm`}
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
    </div>
  );
}
