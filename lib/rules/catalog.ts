import type { Rule } from "./types";

/**
 * The single source of truth for every coaching rule.
 * Add a new rule = append an entry. Editor, prompts, /rules viewer,
 * and eval runner all read from here.
 *
 * Distilled from Glenn Kramon's "The Best of Winning Writing" (Dec 2025).
 */
export const RULES: Rule[] = [
  // ============= PARAGRAPH-SCOPED ISSUE RULES =============
  {
    id: "wordiness",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Wordiness",
    shortDesc: "Cut filler words and bloated phrases.",
    longDesc:
      "Eliminate words that add length without meaning. Common offenders: 'being able to', 'currently', 'in the process of', 'in the event that', 'at this point in time', 'due to the fact that'. If a phrase can be shortened or deleted without losing meaning, do it.",
    examples: [
      { before: "We are in the process of investigating.", after: "We are investigating." },
      { before: "I am currently working for Google.", after: "I work at Google." },
      { before: "In the event that it rains, the picnic is cancelled.", after: "If it rains, the picnic is cancelled." },
    ],
  },
  {
    id: "weak_adverb",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Weak adverb",
    shortDesc: "Adverbs often signal a weak verb. Cut them or use a stronger word.",
    longDesc:
      "Adverbs ending in -ly (and intensifiers like 'very', 'really', 'extremely') often add nothing. 'Successfully got' is just 'got'. 'Completely crushed' is just 'crushed'. 'Tragically derailed' — the killing is the tragedy.",
    examples: [
      { before: "I successfully got a scholarship.", after: "I got a scholarship." },
      { before: "We're absolutely certain.", after: "We're certain.", note: "If you're certain, you're certain." },
      { before: "I completely crushed it.", after: "I crushed it." },
    ],
  },
  {
    id: "powerful_word",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Use a powerful word",
    shortDesc: "Replace 'intensifier + ordinary word' with one strong word.",
    longDesc:
      "'Incredibly smart' is 'brilliant'. 'Extremely important' is 'crucial'. 'Especially unusual' is 'rare'. One strong word beats two pale ones.",
    examples: [
      { before: "She is incredibly smart.", after: "She's brilliant." },
      { before: "It's extremely important.", after: "It's crucial." },
      { before: "An especially unusual gem.", after: "A rare gem." },
    ],
  },
  {
    id: "weak_verb",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Weak verb (utilize, facilitate, make)",
    shortDesc: "Prefer simple verbs: use, help, start, improve, assure.",
    longDesc:
      "Business jargon verbs sap energy. 'Utilize' is 'use'. 'Facilitate' is 'help'. 'Commence' is 'start'. 'Incentivize' is 'encourage'. 'Impact' as a verb is 'affect'. 'Implement' is often 'carry out'. Also avoid the verb 'make' when you can: 'make sure' → 'assure', 'make better' → 'improve'.",
    examples: [
      { before: "We will utilize this framework.", after: "We will use this framework." },
      { before: "This will facilitate the process.", after: "This will help the process." },
      { before: "Make sure the door is locked.", after: "Assure the door is locked." },
    ],
  },
  {
    id: "synonym_pair",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Two synonyms in a row",
    shortDesc: "Pick one. Don't pair near-synonyms with 'and'.",
    longDesc:
      "When two words mean almost the same thing — 'inspiring and constructive', 'rare and extraordinary', 'clear and obvious' — you weaken both. Pick the stronger one.",
    examples: [
      { before: "an inspiring and constructive leader", after: "an inspiring leader", note: "Or 'a constructive leader'. Not both." },
      { before: "rare and extraordinary", after: "rare", note: "Or 'extraordinary'." },
    ],
  },
  {
    id: "useless_jargon",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Useless jargon noun",
    shortDesc: "Drop empty puffer nouns: 'space', 'situation', 'action plan'.",
    longDesc:
      "'I work in the ecommerce space' — what does 'space' add? 'A crisis situation' — what other kind of crisis is there? 'An action plan' — as opposed to what? Cut.",
    examples: [
      { before: "I work in the ecommerce space.", after: "I work in ecommerce." },
      { before: "This was a crisis situation.", after: "This was a crisis." },
      { before: "We have an action plan.", after: "We have a plan." },
    ],
  },
  {
    id: "who_vs_that",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Use 'who', not 'that', for people",
    shortDesc: "People who. Things that.",
    longDesc:
      "Grammar nit but a credibility one. 'Alumni that donate' should be 'Alumni who donate'.",
    examples: [
      { before: "GSB alumni that donate to the school.", after: "GSB alumni who donate to the school." },
    ],
  },
  {
    id: "dangling_modifier",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Dangling modifier",
    shortDesc: "The phrase before the comma must describe the subject after it.",
    longDesc:
      "Classic mistake: 'As a renowned investor, I would love to meet you.' — that compliments yourself, not him. Make sure the part after the comma involves the same person/thing as the part before.",
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
      "'This is boring.' 'This is irrational.' No one will listen. Reframe as constructive: what would make it better?",
    examples: [
      { before: "This presentation is boring.", after: "This presentation would land harder with a story up front." },
    ],
  },

  // ============= PARAGRAPH-SCOPED PRAISE RULES =============
  {
    id: "vivid_specificity",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Vivid, specific detail",
    shortDesc: "Concrete imagery the reader can picture.",
    longDesc:
      "Kramon: 'Picture your favorite movie scene. Describe it in words.' Sensory or numeric detail makes prose memorable — applaud when the writer brings something to life.",
    examples: [
      { before: "Drink your daily prenatal vitamins in a light, refreshing 12oz beverage reminiscent of coconut water." },
    ],
  },
  {
    id: "strong_short_verb",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Strong, short verb",
    shortDesc: "Punchy, monosyllabic verbs.",
    longDesc:
      "Verbs like 'crush', 'shred', 'spark', 'gut', 'land' carry more force than their corporate counterparts. Celebrate when the writer reaches for the strong word.",
    examples: [
      { before: "Diamonds aren't forever.", note: "Three words. Whole pitch." },
    ],
  },
  {
    id: "punchy_brevity",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Punchy brevity",
    shortDesc: "A sentence that says it in fewer words than seemed possible.",
    longDesc:
      "The Miniskirt Rule: long enough to cover the basics, short enough to keep it interesting. Sentences that pass the 'one phrase' test deserve celebration.",
    examples: [
      { before: "Personalized algorithms will make us shallow, narrow and small by exploiting our biases — all to make others rich. There's a solution." },
    ],
  },

  // ============= DOCUMENT-SCOPED RULES =============
  {
    id: "bluf",
    scope: "document",
    highlightKind: "issue",
    name: "BLUF — Bottom Line Up Front",
    shortDesc: "Get to the point in the first sentence, not the last.",
    longDesc:
      "Kramon's RULE FOUR: people are impatient. The most important thing goes first. If your main point is buried at the end, the reader is gone.",
    examples: [
      {
        before: "I am the co-founder of BorrowBear, a peer-to-peer rental marketplace that is scaling at 100% month-over-month and recently passed 10,000 users. The goal is to become the Airbnb of everything...",
        after: "We're the fast-growing Airbnb of … everything. You can lend anything, and generate substantial income.",
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
      "Kramon's RULE ONE. Before you write, identify the audience and what result you want from them. If the document doesn't betray a clear audience, flag it.",
    examples: [
      {
        before: "Generic vendor pitch addressed to no one.",
        after: "A pitch that names the target reader's pain in sentence one.",
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
      "Kramon's RULE TWO. Before writing, you should be able to state the core idea in one phrase, sentence, or paragraph. The model attempts this and offers it back so you can compare against what you actually wrote.",
    examples: [
      { before: "Long meandering pitch.", after: "Diamonds Aren't Forever." },
    ],
  },
  {
    id: "redundancy",
    scope: "document",
    highlightKind: "issue",
    name: "Repetition across paragraphs",
    shortDesc: "Same idea twice in different paragraphs — cut one.",
    longDesc:
      "Document-level wordiness. If two paragraphs make the same point, the second weakens the first.",
    examples: [
      { before: "Paragraph 2 restating what paragraph 1 already said.", after: "Cut paragraph 2 or merge them." },
    ],
  },
  {
    id: "happy_ending",
    scope: "document",
    highlightKind: "issue",
    name: "Happy ending / call to action",
    shortDesc: "End with resolution or an ask — not still mired in trouble.",
    longDesc:
      "Better to show yourself overcoming something than still stuck. For a pitch, end with the ask. For a story, end with what you learned or how it resolved.",
    examples: [],
  },
];

export const PARAGRAPH_RULES = RULES.filter((r) => r.scope === "paragraph");
export const DOCUMENT_RULES = RULES.filter((r) => r.scope === "document");

export function ruleById(id: string): Rule | undefined {
  return RULES.find((r) => r.id === id);
}
