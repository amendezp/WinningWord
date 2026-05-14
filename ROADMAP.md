# WinningWord roadmap

Living doc — append new ideas at the bottom, mark in-flight ones, delete shipped ones (the commit history is the audit trail).

Effort is rough: **S** = a few hours, **M** = half a day to a day, **L** = multiple days. Impact is gut feel based on Kramon's lessons.

## Tier 1 — Low-hanging fruit (do these first)

### 1. Audience description input → fed into every prompt
- **Effort:** S · **Impact:** High
- **Why first:** Kramon's RULE ONE is "know your audience". Right now the model has to guess. Add one short text field at the top of the doc ("Who is this for? What do they care about?"), persist locally, prepend it to the system prompt and (cached) Pass B context. Every rule's coaching becomes more pointed for ~50 lines of code.
- **Where to plug in:**
  - New component above the editor — small expandable strip.
  - Zustand field `audienceDescription`.
  - Append to system prompt assembly in `lib/analyze/prompt.ts` ("the writer's stated audience is: …").

### 2. Bigger fonts (DONE in this session)
- Glenn (and most thoughtful readers) prefer large body type. Forces brevity by making bloat visible.

### 3. Elegant handwritten-style subtitle: *"be one in a million, not one of a million"*
- **Effort:** S · **Impact:** Medium (brand)
- Tagline under the WinningWord wordmark in the top bar, or as a hero strip on first load. Use a script-style Google Font (e.g. *Caveat* or *Homemade Apple*) at a small italic size.
- One file change: `components/TopBar.tsx` + `app/globals.css`.

### 4. Subject-line check + "content up-front" rule for email mode
- **Effort:** S · **Impact:** High (very common use case)
- Add an "email" doc type toggle. When on, surface two new rules in Pass B: `email_subject_line` (must be a straight-line, content-up-front subject) and `email_lede` (first sentence must carry the ask, not pleasantries).
- Rule catalog already supports this — just add two more entries with `scope: "document"` and gate them on `docType === "email"` in the prompt.

## Tier 2 — Medium-effort, meaningful

### 5. Journal mode
- **Effort:** M · **Impact:** Medium (recurring-use loop)
- Separate route `/journal`. Each save appends a timestamped entry to a list (localStorage MVP, KV/Supabase later). Journal entries still get coached but with relaxed rules (e.g. allow "I" prose, skip BLUF).
- New rule scope idea: `mode-specific rules` — gate certain rules on doc type.

### 6. Email mobile preview pane
- **Effort:** M · **Impact:** Medium
- When email mode is on, render a 375px-wide phone-screen preview on the right side (replaces the sidebar at narrow widths). Helps the writer feel the *shape* of their email before sending.
- Pure CSS; no AI dependency.

### 7. "Selfie / photo" nudge for emails
- **Effort:** S · **Impact:** Low–Medium
- Once email mode lands, the Pass B output can include an observation like "Long cold email — consider attaching a photo of yourself to humanize." Lives as a new rule `email_humanize`.

### 8. Brainstorm mode (voice intake)
- **Effort:** M · **Impact:** High (unique angle)
- A separate `/brainstorm` route. Click record → Web Speech API transcribes locally → the transcript appears as raw text. Then a dedicated "Structure" agent suggests how to reorder/group ideas into a draft. Different prompt from the writing coach: this one is a *thinking partner*, not a copy editor.

## Tier 3 — Larger bets

### 9. Fact-check mode
- **Effort:** M–L · **Impact:** High
- A separate dedicated pass that scans the document for claim-like statements ("X grew 80%", "the FDA banned Y in 2014") and verifies them. Two-layer approach:
  - **Heuristic**: numbers, dates, named entities, definitive verbs ("invented", "discovered", "first") get marked as candidate claims.
  - **Verification**: each candidate goes through a separate API call using Anthropic web search with strict instructions — every verified or refuted claim returns a URL and a verbatim quote. If the model can't find a source, it says "unverified" rather than guessing.
- Output: a new sidebar tab "Facts" alongside Coaching / Document, listing each claim with status (✓ verified · ✗ contradicted · ? unverified) and the source link.
- Risk: hallucinated citations. Mitigate with an eval suite of known-true and known-false claims; require URL + quote in the tool schema.

### 10. Structure review (suggest paragraph reorders / merges / splits)
- **Effort:** M · **Impact:** High
- Distinct from per-paragraph coaching. Operates on the *outline* of the document: each paragraph reduced to its core point, then the model proposes structural moves: "Paragraph 3 belongs before paragraph 2", "Paragraphs 5 and 6 cover the same ground — merge them", "This long paragraph is two ideas — split after the second sentence."
- Renders in the **Document** tab below the BLUF/audience observations, as an ordered list of move suggestions with "Apply" buttons that actually reorder/split/merge blocks in the TipTap doc.
- New rule scope: `structure` (third option alongside `paragraph` and `document`) so the catalog stays the source of truth.

### 11. Audience research mode (attributed, accurate facts about the recipient)
- **Effort:** L · **Impact:** High but risky
- The hardest one. The user wants real signals: childhood hero, favorite music, hobbies — *attributed to a source*, never fabricated. Hallucination risk is severe.
- Approach: web search tool calls (Anthropic web search) with strict prompt: every fact returned MUST carry a URL and a verbatim quote. If the model can't find it, it says so explicitly. No interpolation.
- Worth doing only after we have evals that catch fabrication.

## Rejection list (don't build, here's why)
- *(empty for now — add things we've considered and decided against, with reasoning)*

## How to add to this list
Append a new entry under the appropriate tier with: name, one-sentence why, rough S/M/L effort, and where it would plug into the codebase. If you're not sure of the tier, dump it at the bottom of Tier 3 and we'll triage later.
