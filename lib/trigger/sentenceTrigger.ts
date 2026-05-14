/**
 * Pass A trigger logic — pure functions, no editor dependency.
 *
 * Drives the question: "is this paragraph ready to analyze?"
 * Fires when ANY of these is true since the last successful analysis:
 *   - the paragraph contains ≥ 2 newly-completed sentences
 *   - the paragraph ended with a hard break (caller signals this)
 *   - 5 seconds have passed since the last keystroke (idle fallback)
 */

export type ParagraphState = {
  text: string;
  lastAnalyzedText: string | undefined;
  lastEditAt: number;
};

const SENTENCE_BOUNDARY = /[.!?]+(?=\s|$)/g;

export function countSentences(text: string): number {
  const matches = text.match(SENTENCE_BOUNDARY);
  return matches ? matches.length : 0;
}

const MIN_SENTENCE_DELTA = 2;
const IDLE_MS = 5000;
const SENTENCE_GRACE_MS = 400;

export function shouldAnalyze(
  state: ParagraphState,
  now: number,
  options?: { paragraphCompleted?: boolean }
): boolean {
  if (state.text.trim().length < 4) return false;
  if (state.text === state.lastAnalyzedText) return false;

  if (options?.paragraphCompleted) return true;

  const previousSentences = state.lastAnalyzedText
    ? countSentences(state.lastAnalyzedText)
    : 0;
  const currentSentences = countSentences(state.text);
  const delta = currentSentences - previousSentences;

  const idle = now - state.lastEditAt;

  if (delta >= MIN_SENTENCE_DELTA && idle >= SENTENCE_GRACE_MS) {
    return true;
  }
  if (idle >= IDLE_MS && state.text.trim().length > 20) {
    return true;
  }
  return false;
}
