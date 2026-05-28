import type { ParagraphFeedback } from "@/lib/analyze/tools";

/**
 * Initial document content + pre-baked suggestions for the demo.
 *
 * Why: every page load used to fire Pass A on the seed text, costing an
 * API call to produce highlights we can predict deterministically. Seeding
 * the store on mount gives us:
 *   - zero API cost on first paint
 *   - a consistent demo state every time
 *   - guaranteed highlight on "Brilliant." (the model was too stingy)
 *
 * If the user edits a seeded paragraph, the regular trigger flow takes over
 * and the seed is overwritten with whatever the model returns.
 */
export const SEED_HTML = `<h1><em>Be one in a million.</em></h1>
<p>Type below. After every couple of sentences, WinningWord scans your prose against Winning Writing rules and gives editor feedback. Write on!</p>
<p>Try pasting this sample: I am currently working for Google and we are in the process of investigating ways to improve Google Docs. We successfully got the project approved. Brilliant!</p>`;

/**
 * Suggestions keyed by paragraph index (top-level textblock order in the doc).
 * Indices here MUST match the SEED_HTML structure:
 *   0 → heading
 *   1 → explainer paragraph
 *   2 → sample paragraph (the one we actually want to demo on)
 */
// Seed suggestions are crafted so that *if the user applies every rewrite*,
// the final paragraph reads cleanly:
//
//   "I work at Google and we investigate ways to improve Docs.
//    We got the project approved. Brilliant."
//
// Every rewrite must itself follow Winning Writing — no -ing verbs in
// suggestions, no weak adverbs, no jargon. Otherwise we'd be hypocritical.
export const SEED_PARAGRAPH_SUGGESTIONS: Record<number, ParagraphFeedback> = {
  2: {
    issues: [
      {
        phrase: "I am currently working for Google",
        ruleId: "wordiness",
        rationale:
          "'Currently' is redundant and 'I am working' is bloated progressive. Drop both for a tight 'I work at Google'.",
        suggestion: "I work at Google",
      },
      {
        phrase: "we are in the process of investigating",
        ruleId: "wordiness",
        rationale:
          "'In the process of' is filler and 'are X-ing' bloats further. Simple present hits harder.",
        suggestion: "we investigate",
      },
      {
        phrase: "successfully got the project approved",
        ruleId: "weak_adverb",
        rationale: "'Successfully' adds nothing — getting approval IS the success.",
        suggestion: "got the project approved",
      },
    ],
    improvements: [],
    praises: [
      {
        phrase: "Brilliant!",
        ruleId: "punchy_brevity",
        rationale: "Single-word punch. Maximum impact, minimum words. Perfect close.",
      },
    ],
  },
};

// We intentionally do NOT seed document-level feedback. The Document tab
// stays empty until the user has written ≥80 words of real content, at
// which point Pass B fires and produces meaningful feedback. Seeding a
// placeholder summary used to lead to confusing "this is placeholder copy"
// commentary from the model.
