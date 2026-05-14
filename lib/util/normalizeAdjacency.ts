/**
 * After Apply rewrite, the seam between the new text and its neighbours can
 * collect artifacts:
 *   - "X  Y"      double space when the AI's whitespace didn't match the
 *                 original phrase boundary
 *   - "ways ways" the suggestion's last word also appears immediately after
 *                 in the doc
 *   - "Y ."       stray space before sentence-ending punctuation
 *   - "..  "      doubled terminal punctuation
 *
 * normalizeAdjacency runs these tidy-ups on a small window of text only,
 * so we don't risk wiping formatting elsewhere in the paragraph.
 *
 * Conservative by design — only catches obvious noise. Won't try to "fix"
 * grammar or anything ambiguous.
 */
export function normalizeAdjacency(text: string): string {
  let out = text;
  // 1. Collapse runs of horizontal whitespace to a single space.
  out = out.replace(/[ \t]{2,}/g, " ");
  // 2. Remove spaces sitting directly before sentence-ending punctuation.
  out = out.replace(/ +([.,;:!?])/g, "$1");
  // 3. Collapse repeated terminal punctuation ("approved..  Brilliant").
  out = out.replace(/([.,;:!?])(?:\s*\1)+/g, "$1");
  // 4. Collapse an immediately-adjacent duplicate word (case-insensitive).
  //    Rare false positives on intentional repeats like "had had" — accept
  //    that for now in exchange for catching the common AI artifact.
  out = out.replace(/\b(\w+)(\s+)\1\b/gi, "$1");
  return out;
}
