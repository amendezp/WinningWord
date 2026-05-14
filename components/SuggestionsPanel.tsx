"use client";

import { useSuggestionsStore } from "@/lib/store/suggestions";
import { SuggestionCard } from "./SuggestionCard";
import { DocumentFeedback } from "./DocumentFeedback";

export function SuggestionsPanel() {
  const suggestions = useSuggestionsStore((s) => s.paragraphSuggestions);
  const pendingParagraphs = useSuggestionsStore((s) => s.pendingParagraphIndices);
  const focusedUid = useSuggestionsStore((s) => s.focusedUid);
  const dismiss = useSuggestionsStore((s) => s.dismiss);
  const focus = useSuggestionsStore((s) => s.focus);

  const ordered = [...suggestions].sort((a, b) => {
    if (a.paragraphIndex !== b.paragraphIndex)
      return a.paragraphIndex - b.paragraphIndex;
    // Issues before praise within a paragraph.
    if (a.kind !== b.kind) return a.kind === "issue" ? -1 : 1;
    return 0;
  });

  return (
    <aside className="h-full w-full md:w-[30rem] border-l border-stone-200 bg-paper/70 px-5 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-medium tracking-wide text-stone-700">
          Coaching
        </h2>
        <button
          onClick={() =>
            (window as unknown as { __wwForceDocumentPass?: () => void }).__wwForceDocumentPass?.()
          }
          className="text-sm text-stone-500 hover:text-stone-900 underline-offset-2 hover:underline"
        >
          Review now
        </button>
      </div>

      <DocumentFeedback />

      {ordered.length === 0 && pendingParagraphs.size === 0 && (
        <div className="text-base text-stone-500 italic mt-6 leading-relaxed">
          Nothing flagged yet. Write a couple of sentences and pause — coaching will appear here.
        </div>
      )}

      {pendingParagraphs.size > 0 && ordered.length === 0 && (
        <div className="text-base text-stone-400 italic mt-6">Analyzing…</div>
      )}

      {ordered.map((s) => (
        <SuggestionCard
          key={s.uid}
          s={s}
          isFocused={focusedUid === s.uid}
          onFocus={() => focus(s.uid)}
          onDismiss={() => dismiss(s.uid)}
        />
      ))}
    </aside>
  );
}
