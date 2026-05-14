"use client";

import { useState } from "react";
import { useSuggestionsStore } from "@/lib/store/suggestions";
import { ruleById } from "@/lib/rules/catalog";

export function DocumentFeedback() {
  const observations = useSuggestionsStore((s) => s.docObservations);
  const oneSentence = useSuggestionsStore((s) => s.oneSentenceSummary);
  const pending = useSuggestionsStore((s) => s.pendingDocument);
  const [open, setOpen] = useState(true);

  const hasContent =
    observations.length > 0 || oneSentence || pending;
  if (!hasContent) return null;

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
        <span className="text-stone-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
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
                className="border border-stone-200 rounded p-2"
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
      )}
    </div>
  );
}
