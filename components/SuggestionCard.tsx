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

  // Expanded when this card is the focused one (clicked card OR clicked
  // editor highlight). Collapsed cards show the actionable summary only —
  // tier label, phrase, suggestion, primary button. Expanded adds rationale.
  const expanded = isFocused;
  const ringClass = expanded ? themed.ring : "";
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
      data-ww-card-uid={s.uid}
      onClick={onFocus}
      className={`rounded-lg border ${themed.border} ${ringClass} px-3 py-2.5 mb-2 cursor-pointer transition-all hover:shadow-sm`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs uppercase tracking-wide text-stone-500 flex items-center gap-1.5">
          <span>{rule?.name ?? s.ruleId}</span>
          <span className={`text-stone-400 transition-transform ${expanded ? "rotate-90" : ""}`}>
            ›
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="text-base text-stone-400 hover:text-stone-700 leading-none"
          aria-label="Dismiss"
          title="Dismiss"
        >
          ✕
        </button>
      </div>

      <div
        className={`font-serif italic text-stone-700 mt-1 text-base ${
          expanded ? "" : "line-clamp-1"
        }`}
      >
        “{s.phrase}”
      </div>

      {expanded && (
        <div className="text-sm text-stone-800 mt-1.5 leading-snug">{s.rationale}</div>
      )}

      {s.suggestion && (
        <div className={`mt-1.5 ${expanded ? "" : "line-clamp-1"}`}>
          <span className="text-stone-500 text-[10px] uppercase tracking-wide mr-1">Try:</span>
          <span className="font-serif text-stone-900 text-base">“{s.suggestion}”</span>
        </div>
      )}

      {/* Latency + provider attribution — only when we have real meta
          (seeded suggestions have neither). */}
      {s.latencyMs !== undefined && (
        <div className="mt-1.5 text-[10px] uppercase tracking-wide text-stone-400">
          {s.latencyMs}ms{s.provider && s.provider !== "anthropic" ? ` · ${s.provider}` : ""}
        </div>
      )}

      {/* Primary action — only shown when expanded so the compact card stays clean.
          The full card click is plenty for "open me", so no separate expand button. */}
      {expanded && (
        <div className="mt-2.5 flex justify-end">
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
      )}
    </div>
  );
}
