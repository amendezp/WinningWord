import type { Rule } from "./types";

/**
 * The single source of truth for every coaching rule.
 * Add a new rule = append an entry. Editor, prompts, /rules viewer,
 * and eval runner all read from here.
 *
 * Distilled from "The Best of Winning Writing" (Dec 2025).
 */
export const RULES: Rule[] = [
  // ============= PARAGRAPH-SCOPED ISSUE RULES =============
  {
    id: "wordiness",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Wordiness",
    shortDesc: "Cut filler phrases that add length without meaning.",
    longDesc:
      "Flag specific filler phrases worth cutting. Targets: 'being able to', 'currently', 'in the process of', 'in the event that', 'at this point in time', 'due to the fact that', 'with regard to', 'in order to'. Do NOT flag legitimate grammatical repetition like 'had had', 'that that', 'is is' — those are correct English, not wordiness.",
    examples: [
      { before: "We are in the process of investigating.", after: "We are investigating." },
      { before: "I am currently working for Google.", after: "I work at Google." },
      { before: "In the event that it rains, the picnic is cancelled.", after: "If it rains, the picnic is cancelled." },
      { before: "She had had a difficult week.", note: "Not wordiness — 'had had' is past perfect of 'have'. Leave it alone." },
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
    shortDesc: "Replace two (or more) pale words with one strong word.",
    longDesc:
      "Kramon's drill: when a two- or three-word phrase can be replaced by a single strong word, do it. Three patterns to watch for: (1) INTENSIFIER + ADJECTIVE → one adjective ('incredibly smart' → 'brilliant'; 'extremely important' → 'crucial'; 'especially unusual' → 'rare'). (2) ADVERB + VERB or VERB + ADVERB → one strong verb ('dramatically cut' → 'slashed'; 'walk fast' → 'stride'; 'impact significantly' → 'reshape'; 'negatively affect' → 'hurt'; 'grown up significantly' → 'matured'). (3) VERB-PHRASE → one verb ('mitigating the impact' → 'cushioning'; 'make better' is handled by `weak_verb`).",
    examples: [
      { before: "She is incredibly smart.", after: "She's brilliant." },
      { before: "It's extremely important.", after: "It's crucial." },
      { before: "An especially unusual gem.", after: "A rare gem." },
      { before: "We dramatically cut headcount.", after: "We slashed headcount." },
      { before: "She walks fast across the lobby.", after: "She strides across the lobby." },
      { before: "This will impact significantly the roadmap.", after: "This will reshape the roadmap." },
      { before: "The outage will negatively affect revenue.", after: "The outage will hurt revenue." },
      { before: "The team has grown up significantly this year.", after: "The team has matured this year." },
      { before: "We're focused on mitigating the impact on customers.", after: "We're focused on cushioning the impact on customers." },
    ],
  },
  {
    id: "weak_verb",
    scope: "paragraph",
    highlightKind: "issue",
    name: "Weak verb (utilize, facilitate, make)",
    shortDesc: "Prefer simple verbs: use, help, start, improve, assure.",
    longDesc:
      "Business jargon verbs sap energy. 'Utilize' is 'use'. 'Facilitate' is 'help'. 'Commence' is 'start'. 'Incentivize' is 'encourage'. 'Impact' as a verb is 'affect'. 'Implement' is often 'carry out'. Also avoid the verb 'make' when you can: 'make sure' → 'assure', 'make better' → 'improve', 'make a decision' → 'decide', 'make use of' → 'use'. And drop 'be able to' — if you say 'I will be able to ship it', just say 'I will ship it' or 'I can ship it'.",
    examples: [
      { before: "We will utilize this framework.", after: "We will use this framework." },
      { before: "This will facilitate the process.", after: "This will help the process." },
      { before: "Make sure the door is locked.", after: "Assure the door is locked." },
      { before: "We need to make better the onboarding flow.", after: "We need to improve the onboarding flow." },
      { before: "I'll be able to do this by Friday.", after: "I'll do this by Friday." },
      { before: "The team will be able to ship next week.", after: "The team will ship next week." },
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
    shortDesc: "Drop empty puffer nouns: 'space', 'situation', 'action plan', 'action item'.",
    longDesc:
      "'I work in the ecommerce space' — what does 'space' add? 'A crisis situation' — what other kind of crisis is there? 'An action plan' — as opposed to what? 'Action item' is just 'task'. Cut.",
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

  // ============= PARAGRAPH-SCOPED IMPROVE RULES =============
  // "Yellow" tier — not violations, but candidates for tightening.
  {
    id: "ing_verb",
    scope: "paragraph",
    highlightKind: "improve",
    name: "Tighten the -ing verb",
    shortDesc: "Progressive verbs often weaken. Try a tighter form.",
    longDesc:
      "Progressive tense ('we are investigating', 'she is leading', 'the team is preparing') often pads what could be a punchier verb. Not always wrong — sometimes the progressive sense is exactly right — but worth a second look. Cut to the simple form when you can: 'we investigate', 'she leads', 'the team prepares'.",
    examples: [
      { before: "We are investigating new approaches.", after: "We investigate new approaches." },
      { before: "She is leading the team.", after: "She leads the team." },
      { before: "The team is preparing the release.", after: "The team prepares the release." },
    ],
  },

  // ============= PARAGRAPH-SCOPED PRAISE RULES =============
  // Each praise rule lists CONCRETE LINGUISTIC SIGNALS the model can detect.
  // Vibes ("memorable", "engaging") don't reliably trigger; specifics do.
  {
    id: "vivid_specificity",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Vivid, specific detail",
    shortDesc: "Concrete sensory or numeric detail the reader can picture.",
    longDesc:
      "Praise a phrase that swaps an abstraction for a specific image the reader can see. Signals: a measurement ('12oz', '70%', 'three minutes'), a brand or proper noun, a sensory adjective ('refreshing', 'gritty', 'metallic'), or a recognizable comparison ('like coconut water', 'the color of dry rust'). 'A refreshing drink' is abstract; '12oz beverage reminiscent of coconut water' is vivid.",
    examples: [
      {
        before: "Drink your daily prenatal vitamins in a light, refreshing 12oz beverage reminiscent of coconut water.",
        note: "'12oz' + 'reminiscent of coconut water' — measurable + recognizable comparison",
      },
      {
        before: "The fire gutted the warehouse in eleven minutes, leaving steel beams the color of dry rust.",
        note: "numeric ('eleven minutes') + sensory ('color of dry rust')",
      },
    ],
  },
  {
    id: "strong_short_verb",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Strong, short verb",
    shortDesc: "A monosyllabic action verb that carries the sentence.",
    longDesc:
      "Praise when the writer uses a punchy one-syllable verb where a corporate paraphrase would have used three syllables and an auxiliary. Detect: a single-word past or present verb of 4–6 letters doing the main work, no helping verb. Look for: gut, crush, kill, spark, land, shred, bend, snap, smash, sink, dwarf, burn, drag, slash, hit, hold, jolt, rip, tear, swing. Praise the verb, not the whole sentence.",
    examples: [
      { before: "The fire gutted the warehouse.", note: "'gutted' — 4 chars, no helper" },
      { before: "Diamonds aren't forever.", note: "'aren't' as the load-bearer; 3-word sentence" },
      { before: "The outage crushed Q3 revenue.", note: "'crushed' beats 'severely impacted'" },
    ],
  },
  {
    id: "punchy_brevity",
    scope: "paragraph",
    highlightKind: "praise",
    name: "Punchy brevity",
    shortDesc: "A standalone sentence ≤8 words that lands without qualifiers.",
    longDesc:
      "Praise when a sentence is short enough to count on one hand (≤8 words) AND contains no hedge words ('perhaps', 'maybe', 'somewhat', 'kind of', 'arguably'). Often a one-word sentence ('Brilliant.'), a tagline ('Diamonds aren't forever.'), or a punch ending after a longer setup. The brevity is the impact.",
    examples: [
      { before: "Brilliant!", note: "single-word punch" },
      { before: "Diamonds aren't forever.", note: "3-word tagline" },
      { before: "There's a solution.", note: "punch ending after a longer setup" },
      { before: "Write on.", note: "two-word close" },
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
      "Winning Writing RULE FOUR: people are impatient. The most important thing goes first. If your main point is buried at the end, the reader is gone.",
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
      "Winning Writing RULE ONE. The reader's role, pain, or stake should be obvious in the first paragraph. If the doc doesn't name a specific audience — by role, industry, or named pain — flag it. Generic 'we' / 'our product' / 'the user' without a concrete reader signals an unfocused pitch.",
    examples: [
      {
        before:
          "Our product solves a real problem. We have many features. We are different from competitors. We would love to discuss the opportunity further.",
        after:
          "Engineering leaders shipping more than once a day: our deploy pipeline removes the manual approval step you currently chase across three Slack channels.",
        note: "After version names the reader (engineering leaders), their context (>1 deploy/day), and the specific pain (manual approvals across Slack).",
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
      "Winning Writing RULE TWO. The whole document should reduce to one sentence. The model attempts that reduction in the 'If we boiled it down' summary so you can compare it against what you actually wrote. If the reduction doesn't match your intent, your prose is hiding the point.",
    examples: [
      {
        before:
          "A four-paragraph product pitch describing features, market dynamics, competitive moats, and growth metrics without a single clear claim.",
        after: "Diamonds Aren't Forever.",
        note: "If you can't reduce your doc this hard, the core idea isn't actually clear in your own head.",
      },
      {
        before:
          "We discuss several factors that influence engagement, including notification cadence, feed ranking, and onboarding friction. The analysis suggests there are trade-offs in each.",
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
      "Document-level wordiness. If two paragraphs make the same point in different words, the second weakens the first. Flag when ≥2 paragraphs share the same core claim, even if phrased differently.",
    examples: [
      {
        before:
          "Our platform automates deploys. The core insight: most outages come from human steps, not code.\n\nSmall teams move slower than they should because deploys involve too many manual steps. Each manual step is a chance for human error.\n\nThe payoff: small teams ship without fear. The platform handles the human-error parts.",
        after:
          "Cut paragraph 2 or fold it into 1 — both say 'manual steps cause errors, we automate them'. Paragraph 3 is the only one with a new beat (the payoff).",
      },
    ],
  },
  {
    id: "happy_ending",
    scope: "document",
    highlightKind: "issue",
    name: "Happy ending / call to action",
    shortDesc: "End with resolution or an ask — not still mired in trouble.",
    longDesc:
      "Better to show yourself overcoming something than still stuck. For a pitch, end with the ask. For a story, end with what you learned or how it resolved. Flag when the final paragraph opens new questions, dwells on unresolved problems, or trails off without an explicit next step.",
    examples: [
      {
        before:
          "Our analysis suggests the new pricing tier should land between $39 and $59 per seat. We modeled three scenarios. Adoption looks healthy in the survey. There are some open questions about enterprise carve-outs and whether to bundle the audit log.",
        after:
          "Recommend $49/seat. We'll ship the public tier Thursday and defer enterprise carve-outs to a separate review next month. Decision needed by EOW.",
        note: "After ends with a concrete recommendation, a date, and the ask.",
      },
    ],
  },
  {
    id: "weak_hook",
    scope: "document",
    highlightKind: "issue",
    name: "Weak hook",
    shortDesc: "The opening doesn't make the reader want the second sentence.",
    longDesc:
      "A strong hook drops the reader straight into tension, stakes, a stat, a question, or an unexpected image. Flag openings that throat-clear, summarize the doc itself, name the writer's role first, or open with platitudes like 'Hope you're well.' Adjacent to BLUF but distinct: BLUF cares about the *substance* up front; the hook cares about whether the first sentence pulls the reader in.",
    examples: [
      {
        before:
          "Hope you're having a great Tuesday! I wanted to reach out about our new analytics platform, which I've been working on for the past six months.",
        after:
          "Eighty percent of your dashboards are answering questions no one asked. Here's a faster way to find the 20% that matter.",
        note: "After opens with a punchy stat and an implied promise — the reader keeps reading.",
      },
      {
        before:
          "This document discusses the rationale for our Q4 pricing changes. The team has been considering several options.",
        after:
          "We're leaving $12M on the table at the current price. Q4 is when we take it back.",
        note: "Stakes up front, no preamble.",
      },
    ],
  },
  {
    id: "weak_conclusion",
    scope: "document",
    highlightKind: "issue",
    name: "Weak conclusion",
    shortDesc: "No synthesis or takeaway at the end — the doc just stops.",
    longDesc:
      "A strong conclusion either restates the core claim, names the one thing the reader should remember, or escalates from the body into a sharper version of the thesis. Flag endings that trail off mid-thought, summarize what the reader just read instead of landing a takeaway, or end on a bullet point. Different from `happy_ending` (about ASKs in pitches) — applies to essays, memos, stories. Every doc deserves a landing.",
    examples: [
      {
        before:
          "In summary, we covered three approaches to onboarding. Each has trade-offs depending on team size, growth rate, and tooling maturity.",
        after:
          "If you remember one thing: tiered onboarding only pays off above 50 hires a year. Below that, one path, ruthlessly maintained, beats three.",
        note: "After lands a sharp, contrarian takeaway. Before merely recaps.",
      },
      {
        before:
          "The migration is on track. Database swaps are scheduled. The team has been briefed.",
        after:
          "The migration is on track. Database swaps Friday at 2am. If anything goes sideways, we roll back by 6am — no judgement call needed.",
        note: "Before just stops. After ends with a concrete commitment and the rollback rule.",
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
