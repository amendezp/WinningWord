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

  const canApply = isIssue && typeof s.suggestion === "string" && s.suggestion.length > 0;

  const handleApply = () => {
    const w = window as unknown as {
      __wwApplySuggestion?: (
        paragraphIndex: number,
        phrase: string,
        replacement: string
      ) => boolean;
    };
    const applied = w.__wwApplySuggestion?.(s.paragraphIndex, s.phrase, s.suggestion ?? "");
    // Whether the replacement landed or not, drop the card from view so it
    // doesn't sit stale. If it didn't land, the next analysis pass will resurface
    // it (or its successor) on the new paragraph state.
    onDismiss();
    return applied;
  };

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

      <div className="mt-3 flex justify-end">
        {isIssue ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleApply();
            }}
            disabled={!canApply}
            className={`text-sm px-3 py-1 rounded-full border transition
              ${canApply
                ? "border-rose-400 text-rose-700 hover:bg-rose-100"
                : "border-stone-200 text-stone-300 cursor-not-allowed"}`}
            title={canApply ? "Apply this rewrite to the document" : "No rewrite to apply"}
          >
            Apply rewrite
          </button>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="text-sm px-3 py-1 rounded-full border border-emerald-400 text-emerald-700 hover:bg-emerald-100"
            title="Celebrate this and move on"
          >
            🎉 Nice
          </button>
        )}
      </div>
    </div>
  );
}
