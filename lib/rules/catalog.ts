import type { Rule } from "./types";

/**
 * Single source of truth for every coaching rule. Editor, prompts,
 * /rules viewer, and eval runner all read from here.
 *
 * Distilled from "The Best of Winning Writing" (Dec 2025).
 *
 * Rule design discipline (see docs/RULES_AUDIT.md):
 *   1. Each rule owns ONE pattern. Boundaries between rules must be cheap to state.
 *   2. shortDesc and longDesc must follow Winning Writing — if our rule
 *      descriptions need cutting, the rule itself needs revising.
 *   3. Every rule earns its slot through fixtures. New rule = new positive
 *      AND new negative fixture. Otherwise we can't tell if it works.
 */
export const RULES: Rule[] = [
  // ============= PARAGRAPH-SCOPED ISSUE RULES =============
  {
    id: "wordiness",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Wordiness",
    shortDesc: "Cut filler conjunctions and temporal phrases.",
    longDesc:
      "Narrow allowlist of bloat phrases — flag ONLY these: 'in the event that' → 'if', 'at this point in time' → 'now', 'due to the fact that' → 'because', 'with regard to' → 'about', 'in order to' → 'to', 'in the process of' → cut, 'currently' (when redundant with present tense) → cut, 'being able to' → cut. Anything else that feels wordy belongs to `padded_phrase`, `weak_verb`, or `powerful_word`. Do NOT flag legitimate grammatical repetition like 'had had'.",
    examples: [
      { before: "We are in the process of investigating.", after: "We are investigating." },
      { before: "In the event that it rains, the picnic is cancelled.", after: "If it rains, the picnic is cancelled." },
      { before: "I am currently working at Google.", after: "I work at Google." },
      { before: "She had had a difficult week.", note: "Not wordiness — past perfect, leave it." },
    ],
  },
  {
    id: "padded_phrase",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Padded phrase",
    shortDesc: "Cut softeners, padded verbs of being, and trailing vagueness.",
    longDesc:
      "Kramon's condensation drill. Five patterns to flag, each with concrete phrase lists:\n\n(1) SOFTENERS at sentence start — 'I think', 'I feel', 'I believe', 'I'm wondering if', 'It seems that', 'Perhaps'. Cut unless the hedge is genuinely earned.\n\n(2) BE + ABSTRACT NOUN — 'be of assistance' → 'help', 'be prepared for' → 'prepare for', 'be in a position to' → 'can'.\n\n(3) THE POSSIBILITY/QUESTION/ISSUE OF X — 'the possibility of X crashing' → 'X crashing'; 'the question of whether' → 'whether'.\n\n(4) META-PHRASING — 'we have decided we need to' → 'we will'; 'we wanted to reach out about' → cut entirely; 'I am personally happy to' → 'I'd love to'.\n\n(5) TRAILING VAGUENESS — 'and we can go from there', 'or something like that', 'as needed', 'going forward', 'at the end of the day', 'in the best capacity I can'.",
    examples: [
      {
        before: "I think you need to be prepared for the possibility of the markets crashing.",
        after: "Prepare for a market crash.",
        note: "Combines softener (I think), padded verb (be prepared for), padded noun (the possibility of).",
      },
      {
        before: "Let me know if I can be of any assistance in helping you craft that report.",
        after: "Let me know if I can help with that report.",
        note: "'be of any assistance' → 'help'.",
      },
      {
        before: "We have decided we need to restructure our workforce.",
        after: "We must restructure our workforce.",
        note: "Meta-phrasing — cut the decision narration.",
      },
      {
        before: "Let me know if you're interested and we can go from there.",
        after: "Let me know if you're interested.",
        note: "Trailing vagueness — cut.",
      },
      {
        before: "I'd love to discuss how I can support you in the best capacity I can.",
        after: "Let's discuss how I can help.",
        note: "Trailing vagueness + padded verb.",
      },
    ],
  },
  {
    id: "weak_adverb",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Weak adverb",
    shortDesc: "Adverb adds nothing to an already-strong verb. Cut it.",
    longDesc:
      "Boundary with `powerful_word`: fire `weak_adverb` when the verb alone is already strong, so the fix is simply to delete the adverb. Adverb + VERB only (if the adverb modifies an adjective, it's usually `padded_phrase` or `powerful_word` territory). Targets: 'successfully', 'completely', 'absolutely', 'totally', 'tragically', 'literally'. If both the adverb AND the verb are weak (and a single stronger word exists), use `powerful_word` instead.",
    examples: [
      { before: "I successfully got the scholarship.", after: "I got the scholarship." },
      { before: "We're absolutely certain.", after: "We're certain.", note: "Adverb attached to a strong adjective — drop." },
      { before: "I completely crushed it.", after: "I crushed it.", note: "'crushed' is already strong." },
      { before: "I literally screamed.", after: "I screamed." },
    ],
  },
  {
    id: "powerful_word",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Use a powerful word",
    shortDesc: "Two pale words → one strong word.",
    longDesc:
      "Boundary with `weak_adverb`: fire `powerful_word` when BOTH words in a modifier+word pair are weak and a single stronger word exists. Two patterns: (1) INTENSIFIER + ADJECTIVE: 'incredibly smart' → 'brilliant', 'extremely important' → 'crucial', 'especially unusual' → 'rare'. (2) ADVERB + VERB (or VERB + ADVERB): 'dramatically cut' → 'slashed', 'walk fast' → 'stride', 'impact significantly' → 'reshape', 'negatively affect' → 'hurt', 'grown up significantly' → 'matured'. NEVER fire on the same phrase as `weak_adverb`.",
    examples: [
      { before: "She is incredibly smart.", after: "She's brilliant." },
      { before: "It's extremely important.", after: "It's crucial." },
      { before: "An especially unusual gem.", after: "A rare gem." },
      { before: "We dramatically cut headcount.", after: "We slashed headcount." },
      { before: "She walks fast across the lobby.", after: "She strides across the lobby." },
      { before: "The outage will negatively affect revenue.", after: "The outage will hurt revenue." },
      { before: "The team has grown up significantly.", after: "The team has matured." },
    ],
  },
  {
    id: "weak_verb",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Weak verb",
    shortDesc: "Replace a weak multi-word verb with one strong verb.",
    longDesc:
      "Corporate jargon verbs and 'make X' constructions: 'utilize' → 'use', 'facilitate' → 'help', 'commence' → 'start', 'incentivize' → 'encourage', 'operationalize' → 'roll out', 'impact' as a verb → 'affect', 'implement' → 'carry out'. Also: 'make sure' → 'assure', 'make better' → 'improve', 'make a decision' → 'decide', 'mitigating the impact' → 'cushioning'. 'Be able to X' is handled by `padded_phrase`.",
    examples: [
      { before: "We will utilize this framework.", after: "We will use this framework." },
      { before: "This will facilitate the process.", after: "This will help the process." },
      { before: "Make sure the door is locked.", after: "Assure the door is locked." },
      { before: "We need to make better the onboarding flow.", after: "We need to improve the onboarding flow." },
      { before: "We're focused on mitigating the impact on customers.", after: "We're focused on cushioning the impact on customers." },
    ],
  },
  {
    id: "synonym_pair",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Two synonyms in a row",
    shortDesc: "Pick one. Don't pair near-synonyms with 'and'.",
    longDesc:
      "Two words mean almost the same thing — 'inspiring and constructive', 'rare and extraordinary', 'clear and obvious'. You weaken both. Pick the stronger.",
    examples: [
      { before: "an inspiring and constructive leader", after: "an inspiring leader" },
      { before: "rare and extraordinary", after: "rare" },
    ],
  },
  {
    id: "useless_jargon",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Useless jargon noun",
    shortDesc: "Drop empty puffer nouns.",
    longDesc:
      "'Space' adds nothing to 'I work in ecommerce'. 'Situation' adds nothing to 'a crisis'. 'Action plan' is just 'a plan'. 'Action item' is just 'a task'. Cut.",
    examples: [
      { before: "I work in the ecommerce space.", after: "I work in ecommerce." },
      { before: "This was a crisis situation.", after: "This was a crisis." },
      { before: "We have an action plan.", after: "We have a plan." },
      { before: "Three action items came out of the meeting.", after: "Three tasks came out of the meeting." },
    ],
  },
  {
    id: "who_vs_that",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Use 'who', not 'that', for people",
    shortDesc: "People who. Things that.",
    longDesc: "Grammar nit but a credibility one.",
    examples: [
      { before: "GSB alumni that donate to the school.", after: "GSB alumni who donate to the school." },
    ],
  },
  {
    id: "dangling_modifier",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Dangling modifier",
    shortDesc: "The phrase before the comma must describe the subject after.",
    longDesc:
      "Classic mistake: 'As a renowned investor, I would love to meet you.' That compliments yourself, not him. The subject after the comma must match the description before.",
    examples: [
      {
        before: "As a renowned and savvy investor, I would love to spend 30 minutes with you.",
        after: "You are a renowned and savvy investor with whom I would love to spend 30 minutes.",
      },
    ],
  },
  {
    id: "destructive_phrasing",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Destructive phrasing",
    shortDesc: "Say what you'd like, not what you don't like.",
    longDesc:
      "'This is boring.' 'This is irrational.' No one listens. Reframe constructively: what would make it better?",
    examples: [
      { before: "This presentation is boring.", after: "This presentation would land harder with a story up front." },
    ],
  },

  // ============= PARAGRAPH-SCOPED IMPROVE RULES =============
  {
    id: "ing_verb",
    scope: "paragraph",
    highlightKind: "improve",
    name: "Tighten the -ing verb",
    shortDesc: "Progressive tense often pads. Try the simple form.",
    longDesc:
      "'We are investigating', 'she is leading', 'the team is preparing' often pad what a simple-present verb says cleanly: 'we investigate', 'she leads', 'the team prepares'. Not always wrong — sometimes the progressive sense is exactly right — but worth a second look.",
    examples: [
      { before: "We are investigating new approaches.", after: "We investigate new approaches." },
      { before: "She is leading the team.", after: "She leads the team." },
      { before: "The team is preparing the release.", after: "The team prepares the release." },
    ],
  },

  // ============= PARAGRAPH-SCOPED PRAISE RULES =============
  {
    id: "vivid_specificity",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Vivid, specific detail",
    shortDesc: "Concrete sensory or numeric detail the reader can picture.",
    longDesc:
      "Praise a phrase that swaps abstraction for a specific image. Signals: a measurement ('12oz', '70%', 'three minutes'), a brand or proper noun, a sensory adjective ('refreshing', 'gritty', 'metallic'), or a recognizable comparison ('like coconut water', 'the color of dry rust').",
    examples: [
      {
        before: "Drink your daily prenatal vitamins in a light, refreshing 12oz beverage reminiscent of coconut water.",
        note: "Measurable + recognizable comparison.",
      },
      {
        before: "The fire gutted the warehouse in eleven minutes, leaving steel beams the color of dry rust.",
        note: "Numeric + sensory.",
      },
    ],
  },
  {
    id: "strong_short_verb",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Strong, short verb",
    shortDesc: "A monosyllabic action verb carries the sentence.",
    longDesc:
      "Praise when a punchy 4–6 letter verb does the main work with no auxiliary. Look for: gut, crush, kill, spark, land, shred, bend, snap, smash, sink, dwarf, burn, drag, slash, hit, hold, jolt, rip, tear, swing.",
    examples: [
      { before: "The fire gutted the warehouse.", note: "'gutted' — 4 chars, no helper." },
      { before: "The outage crushed Q3 revenue.", note: "'crushed' beats 'severely impacted'." },
    ],
  },
  {
    id: "punchy_brevity",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Punchy brevity",
    shortDesc: "A standalone sentence ≤8 words with no hedges.",
    longDesc:
      "Praise a sentence short enough to count on one hand (≤8 words) AND containing no hedge words ('perhaps', 'maybe', 'somewhat', 'kind of', 'arguably'). Often a one-word sentence or a punch ending after a longer setup.",
    examples: [
      { before: "Brilliant!", note: "Single-word punch." },
      { before: "Diamonds aren't forever.", note: "3-word tagline." },
      { before: "Write on.", note: "Two-word close." },
    ],
  },

  // ============= DOCUMENT-SCOPED RULES =============
  {
    id: "bluf",
    scope: "document",
    highlightKind: "issue",
    name: "BLUF — Bottom Line Up Front",
    shortDesc: "Lead with the substance AND the hook.",
    longDesc:
      "RULE FOUR: people are impatient. The most important thing — the value, the stake, or a hook that makes the reader want the second sentence — goes first. Flag when the lede is buried (substance hidden mid-paragraph), the opening throat-clears ('Hope you're well', 'I wanted to reach out about'), or the first sentence describes the document itself ('This document discusses...') instead of stating the idea.",
    examples: [
      {
        before:
          "I am the co-founder of BorrowBear, a peer-to-peer rental marketplace that is scaling at 100% month-over-month and recently passed 10,000 users. The goal is to become the Airbnb of everything...",
        after: "We're the fast-growing Airbnb of everything. Lend anything, earn passive income.",
        note: "Buried substance — lead with the idea, not your role.",
      },
      {
        before: "Hope you're having a great Tuesday! I wanted to reach out about our new analytics platform.",
        after: "Eighty percent of your dashboards answer questions no one asked. Here's a faster way to find the 20% that matter.",
        note: "Throat-clearing opener — drop in with a stat or stake.",
      },
      {
        before: "This document discusses the rationale for our Q4 pricing changes.",
        after: "We're leaving $12M on the table at the current price. Q4 is when we take it back.",
        note: "Meta opening — say the idea, not the doc's contents.",
      },
    ],
  },
  {
    id: "audience",
    scope: "document",
    highlightKind: "issue",
    name: "Audience clarity",
    shortDesc: "Who is this for? What do they care about?",
    longDesc:
      "RULE ONE. The reader's role, pain, or stake should be obvious in the first paragraph. Generic 'we' / 'our product' / 'the user' without a concrete reader signals an unfocused pitch.",
    examples: [
      {
        before:
          "Our product solves a real problem. We have many features. We are different from competitors. We would love to discuss the opportunity further.",
        after:
          "Engineering leaders shipping more than once a day: our deploy pipeline removes the manual approval step you chase across three Slack channels.",
        note: "After names the reader, their context, and their specific pain.",
      },
    ],
  },
  {
    id: "one_sentence_test",
    scope: "document",
    highlightKind: "issue",
    name: "One-sentence test",
    shortDesc: "If you boiled it down to one sentence, what would it say?",
    longDesc:
      "RULE TWO. The whole doc should reduce to one sentence. The model attempts that reduction in the 'If we boiled it down' line. If the reduction doesn't match your intent, your prose is hiding the point.",
    examples: [
      {
        before:
          "A four-paragraph product pitch describing features, market dynamics, competitive moats, and growth metrics without a single clear claim.",
        after: "Diamonds Aren't Forever.",
        note: "If you can't reduce this hard, the core idea isn't clear in your own head.",
      },
      {
        before:
          "We discuss several factors that influence engagement, including notification cadence, feed ranking, and onboarding friction.",
        after: "Two onboarding screens kill 40% of signups. Cut both.",
      },
    ],
  },
  {
    id: "redundancy",
    scope: "document",
    highlightKind: "issue",
    name: "Repetition across paragraphs",
    shortDesc: "Same idea twice in different paragraphs — cut one.",
    longDesc:
      "Document-level wordiness. If two paragraphs make the same point in different words, the second weakens the first.",
    examples: [
      {
        before:
          "Our platform automates deploys. The core insight: most outages come from human steps, not code.\n\nSmall teams move slower than they should because deploys involve too many manual steps. Each manual step is a chance for human error.",
        after: "Cut paragraph 2 or fold it into 1 — both say 'manual steps cause errors, we automate them.'",
      },
    ],
  },
  {
    id: "weak_conclusion",
    scope: "document",
    highlightKind: "issue",
    name: "Weak conclusion",
    shortDesc: "End with a takeaway, a resolution, or an ask — not a recap or open questions.",
    longDesc:
      "A strong ending either lands a sharp takeaway, names the one thing the reader should remember, escalates to a contrarian punch, or — for pitches — gives a concrete ask with a date. Flag endings that trail off mid-thought, recap what the reader just read ('In summary...'), end on open questions, or dwell on unresolved problems. Every doc deserves a landing.",
    examples: [
      {
        before:
          "In summary, we covered three approaches to onboarding. Each has trade-offs depending on team size, growth rate, and tooling maturity.",
        after:
          "If you remember one thing: tiered onboarding only pays off above 50 hires a year. Below that, one path, ruthlessly maintained, beats three.",
        note: "Recap → sharp takeaway.",
      },
      {
        before:
          "Our analysis suggests the new pricing tier should land between $39 and $59 per seat. There are some open questions about enterprise carve-outs.",
        after:
          "Recommend $49/seat. Public tier ships Thursday; enterprise carve-outs go to a separate review next month. Decision by EOW.",
        note: "Open questions → concrete recommendation + date + ask.",
      },
      {
        before: "The migration is on track. Database swaps are scheduled. The team has been briefed.",
        after: "Database swaps Friday 2am. If anything goes sideways, we roll back by 6am — no judgement call needed.",
        note: "Status bullets → concrete commitment + rollback rule.",
      },
    ],
  },
];

export const PARAGRAPH_RULES = RULES.filter((r) => r.scope === "paragraph");
export const DOCUMENT_RULES = RULES.filter((r) => r.scope === "document");

export const PARAGRAPH_ISSUE_RULES = PARAGRAPH_RULES.filter((r) => r.highlightKind === "issue");
export const PARAGRAPH_IMPROVE_RULES = PARAGRAPH_RULES.filter((r) => r.highlightKind === "improve");
export const PARAGRAPH_PRAISE_RULES = PARAGRAPH_RULES.filter((r) => r.highlightKind === "praise");

export function ruleById(id: string): Rule | undefined {
  return RULES.find((r) => r.id === id);
}
