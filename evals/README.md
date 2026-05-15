# Evals — what they are, why they exist

WinningWord coaches writers using a fixed catalog of "Winning Writing" rules. Every time we tweak a rule's wording, change a prompt, swap a model, or add a new rule, we risk breaking something quietly. The eval suite catches that.

Each fixture is a short piece of prose plus the rule we expect to fire (or NOT fire). The runner calls the live analysis pipeline and prints a per-rule pass rate. Run it after every meaningful change.

## How to run

```bash
# Anthropic (default)
npm run eval

# Inception Labs Mercury
WW_PROVIDER=inception npm run eval
```

Output: per-fixture ✓/✗ with latency, per-rule pass-rate table, mean/p50/p95 latency for paragraph and document passes, and an overall percentage.

## Fixture types

`evals/fixtures/ww-before-after.json` holds three kinds:

| scope | what it checks |
|---|---|
| `paragraph` | A specific rule **must** fire on the text, ideally with a phrase from `expectedAnyOf`. |
| `paragraph_negative` | The named rule **must not** fire on the text (false-positive guard). Clean prose, "had had" as legitimate repetition, etc. |
| `document` | A whole-doc rule (BLUF, audience, redundancy, happy_ending) must surface as an observation. |

29 fixtures total today: 21 paragraph positives, 4 paragraph negatives, 4 document positives. Coverage spans all 17 rules in the catalog.

## Provider comparison — current state

Run 2026-05-15. Same 29 fixtures, same prompts, same tool schemas; only the model provider differs.

| Metric | Anthropic Claude | Inception Mercury 2 |
|---|---|---|
| **Overall pass rate** | **29/29 (100%)** | **21/29 (72%)** |
| Paragraph mean latency | 9,661 ms | **1,378 ms** |
| Paragraph p50 latency | 11,781 ms | **1,425 ms** |
| Paragraph p95 latency | 13,128 ms | **2,025 ms** |
| Document mean latency | 8,427 ms | **980 ms** |
| Document p50 latency | 8,128 ms | **1,065 ms** |
| Document p95 latency | 10,752 ms | **1,093 ms** |

Mercury runs **~8× faster** end-to-end. Claude is the only one that passes every fixture.

### Per-rule pass rates

| Rule | Claude | Mercury |
|---|---|---|
| audience | 1/1 (100%) | 1/1 (100%) |
| bluf | 1/1 (100%) | 1/1 (100%) |
| dangling_modifier | 1/1 (100%) | **0/1 (0%)** |
| destructive_phrasing | 1/1 (100%) | 1/1 (100%) |
| happy_ending | 1/1 (100%) | 1/1 (100%) |
| ing_verb | 3/3 (100%) | 3/3 (100%) |
| powerful_word | 2/2 (100%) | **1/2 (50%)** |
| punchy_brevity | 1/1 (100%) | 1/1 (100%) |
| redundancy | 1/1 (100%) | 1/1 (100%) |
| strong_short_verb | 1/1 (100%) | 1/1 (100%) |
| synonym_pair | 3/3 (100%) | **2/3 (67%)** |
| useless_jargon | 2/2 (100%) | **0/2 (0%)** |
| vivid_specificity | 1/1 (100%) | 1/1 (100%) |
| weak_adverb | 3/3 (100%) | **2/3 (67%)** |
| weak_verb | 3/3 (100%) | **2/3 (67%)** |
| who_vs_that | 2/2 (100%) | 2/2 (100%) |
| wordiness | 5/5 (100%) | **4/5 (80%)** |

### Where Mercury fails — specific examples

**`useless_jargon` (0/2)** — missed both fixtures.

Input: *"I work in the ecommerce space and we are seeing rapid growth this quarter."*
Expected: flag `space` as useless jargon.
Mercury: returned zero flags.

Input: *"When the outage hit, we treated it as a crisis situation and rolled out our action plan within an hour."*
Expected: flag `situation` and/or `action plan`.
Mercury: returned zero flags.

**`dangling_modifier` (0/1)** — missed the canonical example.

Input: *"As a renowned and savvy investor, I would love to spend 30 minutes with you to hear your feedback regarding my investment thesis."*
Expected: flag the dangling opener.
Mercury: returned other flags but not this rule.

**`wordiness` (4/5)** — missed the seed demo paragraph.

Input: *"I am currently working for Google and we are in the process of investigating ways to improve the system. We successfully got the project approved."*
Expected: flag `currently` and/or `in the process of`.
Mercury: returned zero wordiness flags on this multi-issue paragraph (caught the issues individually in other fixtures, but stopped after one match here).

**Single-instance misses** (each rule has at least one positive case still passing):

- `weak_adverb` — caught "completely crushed" but missed "successfully got the scholarship"
- `weak_verb` — caught "utilize" but missed "incentivize the sales team"
- `powerful_word` — caught "incredibly smart" but missed "extremely important"
- `synonym_pair` — caught "rare and extraordinary" but missed "inspiring and constructive"

Pattern: Mercury catches **one** instance of each rule per paragraph but tends to stop after the first match. The model is conservative — it never produces false positives (4/4 on negative fixtures), but it under-flags in multi-issue paragraphs.

### Where Mercury wins

- **Latency**: ~8× faster across the board. For paragraph coaching, that's the difference between feeling instant (~1.4s) and feeling sluggish (~12s).
- **Document-level rules**: 4/4 with notably crisp rationales. The diffusion model's holistic decoding seems to suit whole-doc reasoning.
- **Praise rules**: 3/3. Including the Kramon canonical examples.
- **Negative fixtures**: 4/4. No false positives.
- **Cost** (per Inception pricing): ~3× cheaper input-side, 90% discount on cached input.

## Verdict

Use **Claude (Haiku) for Pass A** — quality matters most where the user sees every flag in their face.

Use **Mercury 2 for Pass B** — quality is identical, latency is 8× better, and the document pass is where speed compounds (larger payloads, less frequent calls).

That's the "Hybrid" mode in the top-bar toggle.

## How to add a fixture

1. Open `evals/fixtures/ww-before-after.json`.
2. Append an object matching the existing shape:
   ```json
   {
     "name": "short human description",
     "ruleIds": ["wordiness"],
     "scope": "paragraph",
     "before": "the text to feed the model",
     "expectedAnyOf": ["optional", "phrases", "to verify"]
   }
   ```
3. Run `npm run eval`. New fixtures appear in the per-rule pass rate.

## How to add a rule

See `lib/rules/README.md`. The rule catalog, prompts, `/rules` viewer, and this eval suite all read from `lib/rules/catalog.ts`. Adding a fixture for any new rule is essentially mandatory — without it, we can't tell whether the rule is firing in production.
