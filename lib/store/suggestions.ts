import { create } from "zustand";
import type { ParagraphFeedback, DocumentFeedback } from "@/lib/analyze/tools";

export type ParagraphSuggestion = {
  paragraphIndex: number;
  paragraphHash: string;
  phrase: string;
  ruleId: string;
  rationale: string;
  suggestion?: string;
  kind: "issue" | "improve" | "praise";
  // Stable identifier so React lists can key off it and dismissal stays scoped.
  uid: string;
};

export type DocObservation = DocumentFeedback["observations"][number];

type Store = {
  paragraphSuggestions: ParagraphSuggestion[];
  docObservations: DocObservation[];
  oneSentenceSummary?: string;
  pendingParagraphIndices: Set<number>;
  pendingDocument: boolean;
  focusedUid?: string;

  upsertParagraph: (
    paragraphIndex: number,
    paragraphHash: string,
    fb: ParagraphFeedback
  ) => void;
  setDocumentFeedback: (fb: DocumentFeedback) => void;
  dismiss: (uid: string) => void;
  setPendingParagraph: (idx: number, pending: boolean) => void;
  setPendingDocument: (pending: boolean) => void;
  focus: (uid?: string) => void;

  // Dismissed flags persist in localStorage so they don't reappear on
  // re-analysis of an untouched paragraph.
  dismissedKeys: Set<string>;
};

const DISMISS_KEY = "ww:dismissed:v1";

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

function saveDismissed(set: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DISMISS_KEY, JSON.stringify([...set]));
  } catch {
    // best effort
  }
}

// Dismiss key combines the paragraph hash + phrase + rule id.
// If the paragraph text changes, the hash changes, the dismissal lapses,
// and re-evaluation can re-surface the issue. That's the intended behavior.
export function dismissKey(s: {
  paragraphHash: string;
  phrase: string;
  ruleId: string;
}): string {
  return `${s.paragraphHash}::${s.ruleId}::${s.phrase}`;
}

function makeUid(s: { paragraphIndex: number; phrase: string; ruleId: string }): string {
  return `${s.paragraphIndex}:${s.ruleId}:${s.phrase}`;
}

export const useSuggestionsStore = create<Store>((set, get) => ({
  paragraphSuggestions: [],
  docObservations: [],
  oneSentenceSummary: undefined,
  pendingParagraphIndices: new Set(),
  pendingDocument: false,
  focusedUid: undefined,
  dismissedKeys: loadDismissed(),

  upsertParagraph: (paragraphIndex, paragraphHash, fb) => {
    const dismissed = get().dismissedKeys;

    const issueSuggestions: ParagraphSuggestion[] = (fb.issues ?? [])
      .map((i) => ({
        paragraphIndex,
        paragraphHash,
        phrase: i.phrase,
        ruleId: i.ruleId,
        rationale: i.rationale,
        suggestion: i.suggestion,
        kind: "issue" as const,
        uid: makeUid({ paragraphIndex, phrase: i.phrase, ruleId: i.ruleId }),
      }))
      .filter((s) => !dismissed.has(dismissKey(s)));

    const improveSuggestions: ParagraphSuggestion[] = (fb.improvements ?? [])
      .map((i) => ({
        paragraphIndex,
        paragraphHash,
        phrase: i.phrase,
        ruleId: i.ruleId,
        rationale: i.rationale,
        suggestion: i.suggestion,
        kind: "improve" as const,
        uid: makeUid({ paragraphIndex, phrase: i.phrase, ruleId: i.ruleId }),
      }))
      .filter((s) => !dismissed.has(dismissKey(s)));

    const praiseSuggestions: ParagraphSuggestion[] = (fb.praises ?? [])
      .map((p) => ({
        paragraphIndex,
        paragraphHash,
        phrase: p.phrase,
        ruleId: p.ruleId,
        rationale: p.rationale,
        kind: "praise" as const,
        uid: makeUid({ paragraphIndex, phrase: p.phrase, ruleId: p.ruleId }),
      }))
      .filter((s) => !dismissed.has(dismissKey(s)));

    const newOnes = [...issueSuggestions, ...improveSuggestions, ...praiseSuggestions];

    set((state) => ({
      paragraphSuggestions: [
        ...state.paragraphSuggestions.filter((s) => s.paragraphIndex !== paragraphIndex),
        ...newOnes,
      ],
    }));
  },

  setDocumentFeedback: (fb) => {
    set({
      docObservations: fb.observations,
      oneSentenceSummary: fb.one_sentence_summary,
    });
  },

  dismiss: (uid) => {
    set((state) => {
      const target = state.paragraphSuggestions.find((s) => s.uid === uid);
      if (!target) return state;
      const next = new Set(state.dismissedKeys);
      next.add(dismissKey(target));
      saveDismissed(next);
      return {
        dismissedKeys: next,
        paragraphSuggestions: state.paragraphSuggestions.filter((s) => s.uid !== uid),
      };
    });
  },

  setPendingParagraph: (idx, pending) => {
    set((state) => {
      const next = new Set(state.pendingParagraphIndices);
      if (pending) next.add(idx);
      else next.delete(idx);
      return { pendingParagraphIndices: next };
    });
  },

  setPendingDocument: (pending) => set({ pendingDocument: pending }),

  focus: (uid) => set({ focusedUid: uid }),
}));
