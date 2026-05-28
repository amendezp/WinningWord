# Rules audit — 2026-05-26

Honest read of the current 20-rule catalog after several weeks of iterative additions. Goal: identify what's clean, what's overlapping, and what to fix before adding more.

The eval suite passes 40/40 — but a green eval doesn't mean the rules are well-designed. It means each rule fires on its own positive fixture in isolation. Real prose is messier: a single sentence often qualifies for two or three rules at once, and the model has to pick one. That's where the mess shows.

## TL;DR

The rules are largely sound. The mess is in **boundaries** — too many rules sit on top of each other, with no prompt-level guidance on which to prefer. Four boundary cases account for almost all the redundancy:

1. **`weak_adverb` vs `powerful_word`** — overlap on "adverb + verb" phrases.
2. **`weak_verb` vs `powerful_word`** — overlap on "weak verb phrase → one verb".
3. **`bluf` vs `weak_hook`** — almost-identical doc-level diagnoses.
4. **`happy_ending` vs `weak_conclusion`** — almost-identical doc-level diagnoses.

Plus three smaller cleanup items: voice inconsistencies, fixture imbalance, and one barely-earning-its-keep rule (`who_vs_that`).

The proposals below are concrete enough to ship one at a time. Each names files and lines.

---

## Finding 1 — `weak_adverb` and `powerful_word` overlap badly

### Current state

- **`weak_adverb`**: "Cut the adverb. *Successfully got* → *got*. *Completely crushed* → *crushed*."
- **`powerful_word`**: "Two pale words → one strong word. *Incredibly smart* → *brilliant*. *Dramatically cut* → *slashed*. *Walk fast* → *stride*."

These overlap heavily on the *adverb + verb* pattern. Compare:

| Phrase | `weak_adverb` would say | `powerful_word` would say |
|---|---|---|
| "successfully got" | cut "successfully" → "got" | (could also fire) |
| "dramatically cut" | cut "dramatically" → "cut" | replace both → "slashed" |
| "completely crushed" | cut "completely" → "crushed" | already strong; just drop adverb |

The model has no principled way to choose. In real prose, both rules can fire on the same phrase under different ruleIds, looking like two separate issues.

### Proposed fix — sharpen the boundary

Two options. I lean toward **B**.

**A) Merge into one rule** `weak_word_pair`. Covers all "modifier + word can be replaced or cut" patterns. Simpler, but loses the useful distinction between *cut the adverb* (verb is fine) and *swap both words* (the verb is also weak).

**B) Rewrite both shortDescs with a clean line — and add a prompt hint:**

- `weak_adverb` → "Adverb that adds nothing to an already-strong verb. *Cut* the adverb."
  - Trigger only when the underlying verb is strong on its own. "completely crushed" → drop "completely".
- `powerful_word` → "An adverb-verb (or intensifier-adjective) pair where *the verb itself is weak*. *Replace* both with one strong word."
  - "dramatically cut" → "slashed" (verb was weak; needed a stronger one).
  - "incredibly smart" → "brilliant".

Add to `PARAGRAPH_SYSTEM_PROMPT`:
> *Adverb + verb patterns: if the verb alone is strong (crushed, gutted, killed, shipped, won), use `weak_adverb`. If both words are weak and a single stronger word exists (slashed, stride, hurt, reshape), use `powerful_word`. Never fire both on the same phrase.*

### Files

- `lib/rules/catalog.ts` — rewrite the `shortDesc` and `longDesc` of both rules
- `lib/analyze/prompt.ts` — add the boundary rule to the strict-requirements block
- Add a fixture that's a known adverb+strong-verb case ("completely crushed") and assert the result fires `weak_adverb`, not `powerful_word`

---

## Finding 2 — `weak_verb` and `powerful_word` overlap on multi-word verb phrases

### Current state

- **`weak_verb`**: "Make sure → assure. Make better → improve. Utilize → use. Be able to → just say the verb."
- **`powerful_word`**: "Mitigating the impact → cushioning."

"Mitigating the impact" → "cushioning" really belongs under `weak_verb` (it's a weak multi-word verb construction). `powerful_word` is becoming a catch-all.

### Proposed fix

Keep `weak_verb` for **multi-word verb constructions**:
- "make sure" → "assure"
- "make better" → "improve"
- "be able to ship" → "ship"
- "mitigating the impact" → "cushioning"
- "in the process of investigating" → ALSO arguably belongs here, but `wordiness` already owns it (see Finding 5).

Keep `powerful_word` strictly for the **modifier + word → one word** pattern (per Finding 1).

Move the "mitigating the impact" example from `powerful_word` → `weak_verb`.

### Files

- `lib/rules/catalog.ts` — move the example
- `evals/fixtures/ww-before-after.json` — the "mitigating the impact" fixture switches ruleId from `powerful_word` to `weak_verb`

---

## Finding 3 — `bluf` and `weak_hook` double-flag

### Current state

- **`bluf`**: "Substance up front. Lead with the main point."
- **`weak_hook`**: "Opening doesn't engage. Drops in tension, stakes, a stat."

When I added `weak_hook` I argued it was distinct from BLUF — *substance* vs *engagement*. In practice the model can flag both on the same document. A doc that buries its lede usually also has a weak hook (same paragraph, different ruleId).

### Proposed fix — make them complementary, not overlapping

Two options:

**A) Merge `weak_hook` into `bluf`** (recommended). The hook IS the BLUF in 90% of pitches. Expand `bluf`'s description to cover engagement explicitly, with examples ranging from buried-substance to bland-opening. Removes one rule.

**B) Keep both but make `weak_hook` strictly secondary**. Prompt instruction: "Fire `weak_hook` only when BLUF passes (the main point IS up front) but the opening is still flat or generic."

If we keep both (option B), we should add a paragraph_negative-style doc fixture: a doc with strong BLUF but weak hook, to confirm `weak_hook` fires alone.

### Files

- Option A: delete the `weak_hook` rule, expand `bluf` examples, remove 2 fixtures
- Option B: add boundary instruction to `DOCUMENT_SYSTEM_PROMPT`, add 1 separating fixture

---

## Finding 4 — `happy_ending` and `weak_conclusion` are nearly identical

### Current state

- **`happy_ending`**: "End with resolution or an ask — not still mired in trouble. For a pitch, end with the ask."
- **`weak_conclusion`**: "No synthesis or takeaway at the end."

When I added `weak_conclusion` I argued `happy_ending` was pitch-specific and `weak_conclusion` was universal. Looking at the actual examples, the boundary is much fuzzier than that intent.

### Proposed fix — merge them

Same conclusion as Finding 3: collapse into one rule. I'd keep the name `weak_conclusion` (clearer than `happy_ending`, which sounds like a Kramon turn of phrase but reads oddly in a UI), and absorb the "pitches need an ask" guidance into its `longDesc`.

### Files

- Delete `happy_ending`, expand `weak_conclusion.longDesc` and `examples`, migrate the 1 `happy_ending` fixture's `ruleIds` field.

---

## Finding 5 — `wordiness` is doing too much

The rule has effectively become a bucket for *any phrase that could be shorter*. Targets in the longDesc include:

- "currently" — single redundant word
- "in the process of" — filler phrase
- "in the event that" — bloated conjunction
- "at this point in time" — temporal filler
- "due to the fact that" — bloated conjunction
- "with regard to" — preposition bloat

These are all valid but they're four different sub-patterns. The model picks "wordiness" for whatever it lands on, and the user has no idea which sub-pattern they triggered.

### Proposed fix — three options, in order of effort

**A) Status quo with sharper short-name in the card.** Cheapest. Add a per-pattern `subtype` field on issues that lets the UI show "wordiness (filler phrase)" vs "wordiness (redundant adverb)". Requires schema change.

**B) Tighten longDesc to a strict list.** No new rule, just discipline. Tell the model: "Flag ONLY these exact patterns: [explicit list]. Anything else that feels wordy goes to `powerful_word` or `weak_verb`."

**C) Split into `filler_phrase` and `redundant_word`.** Cleaner, more work. The catalog grows.

I lean toward **B**. Costs the least, fixes the diagnosis quality, doesn't proliferate rules.

### Files

- `lib/rules/catalog.ts` — rewrite `wordiness.longDesc` to a strict allowlist of phrases
- `lib/analyze/prompt.ts` — re-emphasize "do not stretch the wordiness rule"

---

## Finding 6 — `who_vs_that` barely earns its slot

- Single fixture
- Niche grammar nit
- Useful but rarely fires in real prose

### Proposed fix — keep it but recognize the cost

Leave it in. The cost of keeping is low (single rule entry, single fixture). The benefit is real for the use case (Kramon flags this explicitly). But don't add new niche grammar rules of similar weight until the higher-impact rules are cleaned up.

Note this in the catalog's README so we have a guardrail against drift.

### Files

- `lib/rules/README.md` — add a "before adding a new rule" checklist (impact, distinctness from existing rules, fixture plan).

---

## Finding 7 — Voice inconsistency across rules

Some `longDesc`s are punchy in Kramon's own voice. Others are themselves wordy or vague. A sampling:

- ✅ `weak_adverb`: "Adverbs ending in -ly … often add nothing. *Successfully got* is just *got*."
- ✅ `synonym_pair`: "Two words mean almost the same thing — pick the stronger one."
- ❌ `bluf`: "Winning Writing RULE FOUR: people are impatient. The most important thing goes first. If your main point is buried at the end, the reader is gone." — fine, but a third sentence to spare.
- ❌ `audience`: "Generic 'we' / 'our product' / 'the user' without a concrete reader signals an unfocused pitch." — last sentence is meta-commentary.

A tool that coaches concision should not have wordy rule descriptions. **Pass through every `shortDesc` and `longDesc` once with the rules turned on the rules themselves.** Most can lose 20–40% of their words.

### Files

- `lib/rules/catalog.ts` — full pass

---

## Finding 8 — Fixture imbalance

Coverage today:

| Rule | Positive | Negative |
|---|---|---|
| wordiness | 5 | 2 |
| powerful_word | 7 | 0 |
| weak_verb | 6 | 1 |
| useless_jargon | 3 | 0 |
| synonym_pair | 3 | 0 |
| weak_adverb | 3 | 0 |
| ing_verb | 2 | 1 |
| weak_hook | 2 | 0 |
| weak_conclusion | 2 | 0 |
| dangling_modifier | 1 | 0 |
| destructive_phrasing | 1 | 0 |
| who_vs_that | 1 | 1 |
| (each praise) | 1 | 0 |
| (each doc rule) | 1 | 0 |

Negative fixtures (false-positive guards) only exist for 4 of 20 rules. That's where regressions sneak in.

### Proposed fix

Add 1 negative fixture per rule still missing one — prioritize `useless_jargon`, `weak_adverb`, `weak_verb`, `powerful_word`, `synonym_pair`, `destructive_phrasing`, the 3 praise rules.

That's ~10 new fixtures, plus the schema is already there. Roughly an hour of work, big resilience win.

---

## Finding 9 — many real-prose bloat patterns aren't covered

Surfaced by Kramon's Session 9 condensation exercise (2026-05-26):

| Original | Kramon's condensed version | Rule we'd fire today |
|---|---|---|
| *"I think you need to be prepared for the possibility of the markets crashing."* | "Prepare for a market crash." | — none |
| *"Let me know if I can be of any assistance in helping you craft that report."* | "Let me know if I can help with that report." | — none |
| *"Email is the main way we speak to each other these days, but we often do it badly."* | "Email is how we speak today — and we do it badly." | — none |
| *"To be able to secure our future we have decided we need to restructure our workforce."* | "To secure our future, we must restructure our workforce." | `weak_verb` (catches "be able to" only) |
| *"I am personally happy to join your board and would love to discuss how I can support you in the best capacity I can."* | "I'd love to join your board. Let's discuss how I can help." | `weak_adverb` (catches "personally" only) |
| *"Let me know if you're interested and we can go from there."* | "Let me know if you're interested." | — none |
| *"Hope you're well."* (mid-doc) | Don't write this. | — none (`weak_hook` only fires on openers) |

**~2 of 7 cleanly caught.** The pattern: our `wordiness` rule has a strict-but-narrow allowlist (`currently`, `in the process of`, etc.) and `weak_verb` covers `make X` / `be able to`. Neither covers the broader Kramon drill: softeners, padded verbs of being, padded nouns, trailing vagueness, meta-phrasing.

### Proposed fix — new rule `padded_phrase` (paragraph, issue)

Distinct from `wordiness` (filler conjunctions/temporals) and `weak_verb` (corporate jargon verbs). Five sub-patterns, all with phrase lists:

1. **Softeners** at sentence start: "I think", "I feel", "I believe", "I'm wondering if", "It seems that", "Perhaps". Cut unless genuinely uncertain.
2. **Be + abstract noun**: "be of assistance" → "help", "be prepared for" → "prepare for", "be in a position to" → "can".
3. **The possibility/question/issue of X**: "the possibility of X crashing" → "X crashing"; "the question of whether" → "whether".
4. **Meta-phrasing**: "we have decided we need to" → "we will"; "we wanted to reach out about" → cut entirely.
5. **Trailing vagueness**: "and we can go from there", "or something like that", "as needed", "going forward", "at the end of the day".

The lists ARE the rule — like `wordiness`. Avoid asking the model to detect "padded" by vibes.

### Files
- `lib/rules/catalog.ts` — new rule entry with the five sub-patterns and concrete before/after for each
- `evals/fixtures/ww-before-after.json` — add fixtures for Kramon's 5–6 condensation cases so we don't regress

---

## Recommended ship order

If we want to ship in chunks rather than one big sweep:

1. **Findings 3 + 4** — merge `weak_hook` into `bluf` and `happy_ending` into `weak_conclusion`. Drops 2 rules. Reduces "two doc cards on the same problem" UX confusion. Two files changed, ~30 lines.
2. **Findings 1 + 2** — sharpen `weak_adverb` / `powerful_word` / `weak_verb` boundaries with prompt instruction + example shuffling. ~50 lines.
3. **Finding 5** — tighten `wordiness` to a strict allowlist. ~10 lines + a prompt note.
4. **Finding 9** — add `padded_phrase` rule with Kramon Session 9 patterns. ~80 lines (new rule + 5 fixtures).
5. **Finding 7** — voice pass. Mostly text edits.
6. **Finding 8** — fixture coverage. Mechanical.

Each step keeps the eval green. Each step is reversible.

**Per user direction (2026-05-26): ship all of the above in one pass.** The audit doc gets a "Shipped" section appended once the sweep lands.

---

## Shipped — 2026-05-26

All nine findings landed in a single commit. Eval suite runs **52/52 (100%)** with 8 negative fixtures up from 4.

### Catalog deltas (20 rules → 19 rules)

| Action | Rule | Notes |
|---|---|---|
| **NEW** | `padded_phrase` | Five sub-patterns (softeners, be+abstract-noun, the-X-of, meta-phrasing, trailing vagueness). 9 fixtures. |
| **DELETED** | `weak_hook` | Merged into `bluf`. BLUF now explicitly covers throat-clearing, meta openings, and lede-burial. |
| **DELETED** | `happy_ending` | Merged into `weak_conclusion`. Conclusion now covers asks + dates for pitches AND takeaways for any doc. |
| **TIGHTENED** | `wordiness` | Strict allowlist of filler conjunctions/temporals only. Padded patterns moved to `padded_phrase` and `weak_verb`. |
| **TIGHTENED** | `weak_adverb` | Adverb + VERB only (cut the adverb when verb is strong). Adverb + adjective routes to `padded_phrase` or `powerful_word`. |
| **TIGHTENED** | `powerful_word` | Modifier+word pair where BOTH are weak (one stronger word exists). Mutually exclusive with `weak_adverb`. |
| **TIGHTENED** | `weak_verb` | Owns 'mitigating the impact' (moved from `powerful_word`). 'be able to' moved to `padded_phrase`. |
| **VOICE PASS** | every rule | shortDesc and longDesc rewritten shorter; tool no longer ironically wordy in its own descriptions. |

### Prompt

`PARAGRAPH_SYSTEM_PROMPT` gained an explicit **RULE BOUNDARIES** block: a five-step hierarchy (wordiness → padded_phrase → weak_verb → weak_adverb → powerful_word) plus an "adverb + verb decision shortcut" so the model never double-flags the same phrase.

### Fixtures (40 → 52)

- 9 new positive fixtures for `padded_phrase` covering all five sub-patterns and Kramon's Session 9 exercise sentences (markets crashing, be of assistance, decision narration, trailing vagueness, in the best capacity, be able to, I am personally happy to).
- 4 new negative fixtures (false-positive guards): no praise on generic short prose, no powerful_word on legitimate intensifier ("terminal"), no useless_jargon on "the Marshall Plan", no strong_short_verb on "approved".
- Doc fixtures rerouted: 2 weak_hook → bluf, 1 happy_ending → weak_conclusion.
- `weak_adverb` swapped one example to a clean adverb+verb case ("literally screamed").

### Out of scope (still)

- Praise calibration — separate prompt tuning, not a rule-design issue.
- New rules beyond `padded_phrase` (passive voice, story arc, evidence-needed). Wait for real prose to surface what's missing.
- Multi-provider work — Mercury experiment removed last commit.

## Out of scope of this audit

- **Praise calibration** — the user has flagged praise-too-often before; that's a prompt knob, not a rule design issue. Handled separately.
- **Adding new rules** — the brief is to clean up, not extend. Throat-clearing openers, passive voice, story arc, etc. are good ideas but not for this pass.
- **Provider work** — Mercury removal already shipped. Hybrid mode is gone.
