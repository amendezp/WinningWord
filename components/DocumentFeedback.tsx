"use client";

import { useState } from "react";
import { useSuggestionsStore } from "@/lib/store/suggestions";
import { ruleById } from "@/lib/rules/catalog";

export function DocumentFeedback({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
  const observations = useSuggestionsStore((s) => s.docObservations);
  const oneSentence = useSuggestionsStore((s) => s.oneSentenceSummary);
  const pending = useSuggestionsStore((s) => s.pendingDocument);
  const [open, setOpen] = useState(true);
  const expanded = alwaysOpen || open;

  const hasContent =
    observations.length > 0 || oneSentence || pending;

  // When this component is rendered inside its own tab, show an empty-state
  // hint instead of nothing.
  if (!hasContent) {
    return alwaysOpen ? (
      <div className="text-base text-stone-500 italic mt-2 leading-relaxed">
        Document feedback appears once you&apos;ve written enough for there to be
        structure to comment on. Keep typing — audience fit, BLUF, redundancy,
        and a one-sentence summary will show up here.
      </div>
    ) : null;
  }

  const body = (
    <div className={alwaysOpen ? "space-y-3" : "px-3 pb-3 space-y-2"}>
      {oneSentence && (
        <div className="text-base">
          <div className="text-xs uppercase tracking-wide text-stone-500 mb-1">
            If we boiled it down…
          </div>
          <div className="font-serif italic text-stone-800 text-lg">
            “{oneSentence}”
          </div>
        </div>
      )}
      {observations.length === 0 && !pending && oneSentence && (
        <div className="text-base text-stone-500">
          No structural concerns — the doc reads cleanly end to end.
        </div>
      )}
      {observations.map((o, i) => {
        const rule = ruleById(o.ruleId);
        const severityColor =
          o.severity === "warn"
            ? "bg-rose-100 text-rose-700"
            : o.severity === "suggest"
            ? "bg-amber-100 text-amber-800"
            : "bg-stone-100 text-stone-600";
        return (
          <div
            key={`${o.ruleId}-${i}`}
            className="border border-stone-200 rounded p-3 bg-white/60"
          >
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] uppercase px-1.5 py-0.5 rounded ${severityColor}`}
              >
                {o.severity}
              </span>
              <span className="text-xs uppercase tracking-wide text-stone-500">
                {rule?.name ?? o.ruleId}
              </span>
            </div>
            <div className="text-base text-stone-800 mt-1.5">{o.rationale}</div>
            {o.suggestion && (
              <div className="text-base text-stone-700 mt-1.5">
                <span className="text-stone-500 text-xs uppercase tracking-wide mr-1">
                  Try:
                </span>
                {o.suggestion}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // When rendered standalone (legacy mode), keep the collapsible chrome.
  if (alwaysOpen) {
    return (
      <div>
        {pending && (
          <div className="text-stone-400 text-xs uppercase tracking-wide mb-3">
            analyzing…
          </div>
        )}
        {body}
      </div>
    );
  }

  return (
    <div className="border border-stone-200 rounded-lg bg-white/60 mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-stone-700"
      >
        <span>
          Document feedback{" "}
          {pending && (
            <span className="text-stone-400 text-xs ml-1">analyzing…</span>
          )}
        </span>
        <span className="text-stone-400">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && body}
    </div>
  );
}
