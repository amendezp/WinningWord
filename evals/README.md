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

33 fixtures total today: 21 paragraph positives, 4 paragraph negatives, 8 document positives. Coverage spans all 20 rules in the catalog.

## Provider comparison — current state

Run 2026-05-19, after adding `weak_hook` and `weak_conclusion` (content-level structural rules). Same 33 fixtures, same prompts, same tool schemas; only the model provider differs.

| Metric | Anthropic Claude | Inception Mercury 2 |
|---|---|---|
| **Overall pass rate** | **33/33 (100%)** | **22/33 (67%)** |
| Paragraph mean latency | 9,710 ms | **2,460 ms** |
| Paragraph p50 latency | 11,923 ms | **1,741 ms** |
| Paragraph p95 latency | 13,006 ms | **5,181 ms** |
| Document mean latency | 8,892 ms | **2,620 ms** |
| Document p50 latency | 9,307 ms | **1,290 ms** |
| Document p95 latency | 11,612 ms | **8,780 ms** |

Mercury runs **~4–8× faster** end-to-end. Claude is the only one that passes every fixture, but Mercury matches Claude on every document-level rule (including the new `weak_hook` and `weak_conclusion`). That's why Hybrid routes Pass B to Mercury.

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
| weak_conclusion *(new)* | 2/2 (100%) | 2/2 (100%) |
| weak_hook *(new)* | 2/2 (100%) | 2/2 (100%) |
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

## All 29 fixtures, annotated

The fixtures live in `evals/fixtures/ww-before-after.json`. Reading them is the fastest way to understand both the rule catalog and the kinds of text that should (and should not) trigger each rule.

### Paragraph positives — 21 cases

Each must produce **at least one flag** with the named rule.

#### `wordiness` (3 cases)

**1. currently + in the process of**
> *I am currently working for Google and we are in the process of investigating ways to improve the system.*
Expected phrase: `currently` OR `in the process of`.

**2. in the event that**
> *In the event that it rains tomorrow, the outdoor presentation will be moved indoors at no additional cost.*
Expected phrase: `In the event that`.

**3. at this point in time**
> *At this point in time, the team has not yet decided which vendor to choose for the renovation project.*
Expected phrase: `At this point in time`.

#### `weak_adverb` (2 cases)

**4. successfully got**
> *After months of work, I successfully got the scholarship and absolutely crushed the interview.*
Expected phrase: `successfully` OR `absolutely`.

**5. completely crushed it**
> *Our small team completely crushed the quarterly target and totally smashed every retention milestone.*
Expected phrase: `completely` OR `totally`.

#### `powerful_word` (2 cases)

**6. incredibly smart → brilliant**
> *Our new lead engineer is incredibly smart and the team trusts her judgment on every release.*
Expected phrase: `incredibly smart`.

**7. extremely important → crucial**
> *It is extremely important that we ship this on time for an especially unusual reason.*
Expected phrase: `extremely important` OR `especially unusual`.

#### `weak_verb` (2 cases)

**8. utilize + facilitate → use + help**
> *We will utilize the new framework to facilitate faster onboarding for all new hires next quarter.*
Expected phrase: `utilize` OR `facilitate`.

**9. incentivize → encourage**
> *We must incentivize the sales team and operationalize the new pricing model before the end of Q4.*
Expected phrase: `incentivize` OR `operationalize`.

#### `synonym_pair` (2 cases)

**10. inspiring and constructive**
> *You can show you are an inspiring and constructive leader by how you write.*
Expected phrase: `inspiring and constructive`.

**11. rare and extraordinary**
> *She is a rare and extraordinary talent who joined us last summer from a clear and obvious rival.*
Expected phrase: `rare and extraordinary` OR `clear and obvious`.

#### `useless_jargon` (2 cases)

**12. ecommerce space**
> *I work in the ecommerce space and we are seeing rapid growth this quarter.*
Expected phrase: `space`.

**13. crisis situation**
> *When the outage hit, we treated it as a crisis situation and rolled out our action plan within an hour.*
Expected phrase: `situation` OR `action plan`.

#### `who_vs_that` (1 case)

**14. alumni that donate**
> *GSB alumni that donate to the school have a profound effect on the next generation of students.*
Expected phrase: `that`.

#### `dangling_modifier` (1 case)

**15. renowned investor**
> *As a renowned and savvy investor, I would love to spend 30 minutes with you to hear your feedback regarding my investment thesis.*
Expected phrase: `As a renowned and savvy investor`.

#### `destructive_phrasing` (1 case)

**16. this is boring**
> *This presentation is boring and the analysis is irrational.*
Expected phrase: `boring` OR `irrational`.

#### `ing_verb` (2 cases — yellow tier)

**17. is leading / is preparing**
> *Our team is leading the integration and is preparing the launch plan for next quarter.*
Expected phrase: `is leading` OR `is preparing`.

**18. is mentoring / is rewriting**
> *She is mentoring three new hires while she is rewriting the onboarding handbook.*
Expected phrase: `is mentoring` OR `is rewriting`.

#### Praise (3 cases — green tier)

**19. punchy brevity**
> *Diamonds aren't forever.*
Expected: `punchy_brevity`. 3-word tagline with no hedges.

**20. strong short verb**
> *The fire gutted the warehouse. The owner crushed by debt watched it burn.*
Expected: `strong_short_verb`. Monosyllabic action verbs (`gutted`, `crushed`) carrying the sentences.

**21. vivid specificity**
> *Drink your daily prenatal vitamins in a light, refreshing 12oz beverage reminiscent of coconut water.*
Expected: `vivid_specificity`. Measurement + named comparison.

### Paragraph negatives — 4 cases

Each must produce **zero flags** of the named rules. Catches false positives.

**22. NEG: clean prose, no -ing flag** (must not fire `ing_verb`)
> *The team ships every Friday. We track three metrics: latency, errors, and revenue per request.*
Reason: no progressive verbs anywhere — clean simple-present prose.

**23. NEG: "had had" — genuine repetition** (must not fire `wordiness` or `synonym_pair`)
> *She told me she had had a difficult week before the announcement landed.*
Reason: `had had` is correct past-perfect grammar, not redundancy.

**24. NEG: clean strong prose, no wordiness** (must not fire `wordiness`, `weak_adverb`, or `weak_verb`)
> *We ship every Friday. The team trusts the build. Outages are rare.*
Reason: short, direct, no fluff, no weak verbs or adverbs.

**25. NEG: who used correctly** (must not fire `who_vs_that`)
> *The candidates who applied last quarter performed best in the panel review.*
Reason: the rule applies only when `that` is misused for people. Here `who` is correct.

### Document positives — 4 cases

Each runs through Pass B and must produce a document-level observation with the named ruleId.

**26. doc: BLUF — buried lede pitch** (must fire `bluf`)
> *I am the co-founder of BorrowBear, a peer-to-peer rental marketplace that is scaling at 100% month-over-month and recently passed 10,000 users. The goal is to become the Airbnb of everything, where people can rent items temporarily and lenders can generate substantial passive income by sharing items they already own. Do you have 20 minutes for me to tell you more?*
Reason: the headline value ("Airbnb of everything", high growth, big TAM) is buried behind the founder's role.

**27. doc: audience missing** (must fire `audience`)
> *Our product solves a real problem. We have many features. We are different from competitors. We would love to discuss the opportunity further. Please let us know if you are interested in moving forward.*
Reason: no reader is named. "Our product", "a real problem", "the opportunity" — could be addressed to anyone.

**28. doc: redundancy across paragraphs** (must fire `redundancy`)
> *Our platform helps small teams ship faster by removing friction in the deploy pipeline. The core insight: most outages come from human steps, not code.*
>
> *Small teams move slower than they should because deploys involve too many manual steps. Each manual step is a chance for human error. Our platform automates those steps.*
>
> *The payoff: small teams ship without fear. They stop dreading Friday afternoons. The platform handles the human-error parts so engineers can focus on the work.*
Reason: paragraphs 1 and 2 make the same claim ("manual steps cause errors, platform automates"); paragraph 3 is the only one with a new beat.

**29. doc: missing call to action** (must fire `happy_ending`)
> *Our analysis suggests the new pricing tier should land between $39 and $59 per seat per month. We modeled three scenarios. In all three, contribution margin improves materially. Adoption looks healthy in the willingness-to-pay survey. There are some open questions about enterprise carve-outs and whether to bundle the audit log.*
Reason: ends on open questions instead of a recommendation, a date, or an ask.

**30. doc: weak hook — throat clearing opener** (must fire `weak_hook`)
> *Hope you're having a great Tuesday! I wanted to reach out about our new analytics platform, which I've been working on for the past six months. Our team has invested significant resources into building a product we're proud of. Today I'd like to walk you through what we've learned and where we're headed next.*
Reason: four sentences of pleasantries before the reader learns why they should keep reading.

**31. doc: weak hook — meta opening** (must fire `weak_hook`)
> *This document discusses the rationale for our Q4 pricing changes. The team has been considering several options. Below, we outline each option and the relevant trade-offs. We welcome your feedback before the next planning cycle.*
Reason: tells the reader what the doc is *about* instead of giving them the substance. Opens with a description of the document rather than the actual idea.

**32. doc: weak conclusion — just stops** (must fire `weak_conclusion`)
> *The migration plan is on track. Engineering, ops, and support have all been briefed. We will run a dry-run on staging next week. Database swaps are scheduled. The team has been briefed.*
Reason: doc ends mid-thought with status updates and repeats itself ("The team has been briefed" twice). No takeaway, no rule for what happens when things go wrong.

**33. doc: weak conclusion — recap only** (must fire `weak_conclusion`)
> *Pricing matters. Audience matters. Distribution matters. As we've shown, all three need to align for a launch to succeed. In summary, we covered three factors that determine outcomes. Teams that ignore any one of them tend to underperform.*
Reason: the ending re-summarizes the body instead of escalating to a sharp, memorable takeaway. "In summary…" is the tell.

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
