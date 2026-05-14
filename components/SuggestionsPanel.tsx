"use client";

import { useEffect, useState } from "react";
import { useSuggestionsStore, type ParagraphSuggestion } from "@/lib/store/suggestions";
import { SuggestionCard } from "./SuggestionCard";
import { DocumentFeedback } from "./DocumentFeedback";

type Tab = "coaching" | "document";
type ParagraphSuggestionKind = ParagraphSuggestion["kind"];

export function SuggestionsPanel() {
  const suggestions = useSuggestionsStore((s) => s.paragraphSuggestions);
  const pendingParagraphs = useSuggestionsStore((s) => s.pendingParagraphIndices);
  const docObservations = useSuggestionsStore((s) => s.docObservations);
  const oneSentenceSummary = useSuggestionsStore((s) => s.oneSentenceSummary);
  const pendingDocument = useSuggestionsStore((s) => s.pendingDocument);
  const focusedUid = useSuggestionsStore((s) => s.focusedUid);
  const dismiss = useSuggestionsStore((s) => s.dismiss);
  const focus = useSuggestionsStore((s) => s.focus);

  const [tab, setTab] = useState<Tab>("coaching");

  // When a highlight is clicked in the editor, focusedUid changes. Switch to
  // the Editor tab (if needed) and scroll the matching card into view —
  // `block: "nearest"` skips the scroll entirely when the card is already
  // fully visible, so the panel doesn't jump for no reason.
  useEffect(() => {
    if (!focusedUid) return;
    if (tab !== "coaching") setTab("coaching");
    // Wait one frame so React renders the cards (in case we just switched tabs).
    const id = window.setTimeout(() => {
      const card = document.querySelector<HTMLElement>(
        `[data-ww-card-uid="${CSS.escape(focusedUid)}"]`
      );
      card?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 30);
    return () => window.clearTimeout(id);
    // We deliberately don't depend on `tab` — switching tabs shouldn't re-scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedUid]);

  // Sort: paragraph order first, then by severity (issue > improve > praise).
  const kindOrder: Record<ParagraphSuggestionKind, number> = {
    issue: 0,
    improve: 1,
    praise: 2,
  };
  const ordered = [...suggestions].sort((a, b) => {
    if (a.paragraphIndex !== b.paragraphIndex)
      return a.paragraphIndex - b.paragraphIndex;
    return kindOrder[a.kind] - kindOrder[b.kind];
  });

  const coachingBadge = ordered.length || pendingParagraphs.size;
  const documentBadge =
    docObservations.length || (oneSentenceSummary ? 1 : 0) || (pendingDocument ? 1 : 0);

  return (
    <aside className="h-full w-full border-l border-stone-200 bg-paper/70 flex flex-col">
      {/* Tabs row — minimalist by design. The Document pass runs automatically
          (every 5 paragraph passes or 30s of idle); no manual refresh button. */}
      <div className="flex items-center border-b border-stone-200 px-2">
        <TabButton
          active={tab === "coaching"}
          badge={coachingBadge}
          onClick={() => setTab("coaching")}
        >
          Editor
        </TabButton>
        <TabButton
          active={tab === "document"}
          badge={documentBadge}
          onClick={() => setTab("document")}
        >
          Document
        </TabButton>
      </div>

      {/* Tab body */}
      <div className="flex-1 overflow-y-auto px-5 py-5">
        {tab === "coaching" ? (
          <>
            {ordered.length === 0 && pendingParagraphs.size === 0 && (
              <div className="text-base text-stone-500 italic mt-2 leading-relaxed">
                Nothing flagged yet. Write a couple of sentences and pause — coaching will appear here.
              </div>
            )}
            {pendingParagraphs.size > 0 && ordered.length === 0 && (
              <div className="text-base text-stone-400 italic mt-2">Analyzing…</div>
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
          </>
        ) : (
          <DocumentFeedback alwaysOpen />
        )}
      </div>
    </aside>
  );
}

function TabButton({
  active,
  badge,
  onClick,
  children,
}: {
  active: boolean;
  badge: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative px-4 py-3 text-sm font-medium tracking-wide transition
        ${active
          ? "text-stone-900 border-b-2 border-stone-800"
          : "text-stone-500 hover:text-stone-700 border-b-2 border-transparent"}`}
    >
      {children}
      {badge > 0 && (
        <span
          className={`ml-2 inline-flex items-center justify-center text-[10px] font-semibold rounded-full px-1.5 min-w-[1.25rem] h-5 align-middle
            ${active ? "bg-stone-800 text-stone-50" : "bg-stone-200 text-stone-600"}`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}
