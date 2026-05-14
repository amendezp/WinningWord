/**
 * Pass B (whole-document) trigger.
 *
 * Fires when ALL of:
 *   - the document text has changed since the last successful Pass B
 *     (this is the key guard — without it, the idle condition below
 *      would re-fire every 15s as long as the user sits idle)
 * AND ANY of:
 *   - 30s of idle time since the last edit
 *   - 5 successful Pass A analyses since the last Pass B
 *   - user clicked "Review" (bypasses this function entirely)
 */

export type DocumentTriggerState = {
  passACountSinceLastB: number;
  lastEditAt: number;
  lastDocAnalyzedAt: number;
  lastAnalyzedDocText?: string;
};

const DOC_IDLE_MS = 30_000;
const PASS_A_THRESHOLD = 5;
const MIN_THROTTLE_MS = 15_000;
// Word count is a better signal than character count for "is there a real
// document here yet". The seed is ~54 words, so this threshold suppresses
// Pass B on placeholder-shaped content.
const MIN_WORDS = 80;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function shouldRunDocumentPass(
  state: DocumentTriggerState,
  now: number,
  currentDocText: string
): boolean {
  if (countWords(currentDocText) < MIN_WORDS) return false;
  // Hard guard against the idle-loop: don't re-analyze unchanged text.
  if (currentDocText === state.lastAnalyzedDocText) return false;
  if (now - state.lastDocAnalyzedAt < MIN_THROTTLE_MS) return false;

  if (state.passACountSinceLastB >= PASS_A_THRESHOLD) return true;
  if (now - state.lastEditAt >= DOC_IDLE_MS) return true;
  return false;
}
