/**
 * Forbidden words — always flagged in dark red, instantly (no API call).
 * The AI may also flag these via the wordiness rule; the dark-red
 * highlight takes visual precedence.
 *
 * Add a word here and it appears in red the moment the user types it.
 */
export const FORBIDDEN_WORDS: readonly string[] = ["currently"];

const FORBIDDEN_REGEX = new RegExp(
  `\\b(${FORBIDDEN_WORDS.map(escapeRegex).join("|")})\\b`,
  "gi"
);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function findForbiddenMatches(text: string): Array<{ from: number; to: number }> {
  if (FORBIDDEN_WORDS.length === 0) return [];
  FORBIDDEN_REGEX.lastIndex = 0;
  const out: Array<{ from: number; to: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = FORBIDDEN_REGEX.exec(text))) {
    out.push({ from: m.index, to: m.index + m[0].length });
  }
  return out;
}
