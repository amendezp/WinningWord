# Rule catalog

This directory holds the **single source of truth** for every coaching rule WinningWord knows about.

## Adding a rule

1. Open `catalog.ts` and append a new entry to the `RULES` array.
2. Fill in:
   - `id` — kebab/snake_case identifier. Used in prompts, the eval runner, and the dismissal store. **Never change an existing id** without migrating dismissals.
   - `scope` — `"paragraph"` (Pass A, runs on every trigger) or `"document"` (Pass B, runs less often on the whole doc).
   - `highlightKind` — `"issue"` (light red) or `"praise"` (mint/sky).
   - `name`, `shortDesc`, `longDesc` — what shows up in the sidebar and on `/rules`.
   - `examples` — Before / After pairs. These are also used as few-shot examples in the prompt.
3. Add fixtures to `evals/fixtures/ww-before-after.json` if you want the eval runner to enforce this rule.
4. Restart `npm run dev`. The rule appears on `/rules`, in suggestions, and (if fixtured) in evals.

## Why one catalog?

We want adding a rule to be cheap and consistent. The editor pulls names from here for sidebar cards. The server pulls descriptions and examples from here to build the system prompt. The `/rules` page renders the catalog directly. The eval runner uses `id` as the contract. One file, one place to add.
