/**
 * Pass B (whole-document) trigger.
 *
 * Fires when ANY of:
 *   - 30s of idle time since the last edit
 *   - 5 successful Pass A analyses since the last Pass B
 *   - user clicked "Review" (handled outside this module)
 */

export type DocumentTriggerState = {
  passACountSinceLastB: number;
  lastEditAt: number;
  lastDocAnalyzedAt: number;
};

const DOC_IDLE_MS = 30_000;
const PASS_A_THRESHOLD = 5;

export function shouldRunDocumentPass(
  state: DocumentTriggerState,
  now: number,
  docLength: number
): boolean {
  if (docLength < 100) return false;
  if (now - state.lastDocAnalyzedAt < 15_000) return false; // throttle

  if (state.passACountSinceLastB >= PASS_A_THRESHOLD) return true;
  if (now - state.lastEditAt >= DOC_IDLE_MS) return true;
  return false;
}
