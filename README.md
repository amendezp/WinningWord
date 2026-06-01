# WinningWord

A clean, Typora-style word processor that coaches you in real time on the *"Winning Writing"* lessons (Stanford GSB).

- Type prose in a minimalist serif editor.
- WinningWord watches for completed sentences and paragraphs and quietly highlights:
  - **Light red** — prose that violates a rule (wordiness, weak adverbs, useless jargon, etc.).
  - **Mint / sky** — prose that exemplifies the lessons (vivid detail, strong short verbs, punchy brevity).
- The right-hand sidebar explains every flag and offers rewrites you can accept or dismiss.
- A document-level pass runs in the background to check BLUF, audience, redundancy, and the "one-sentence test".

## Local setup

```bash
cp .env.example .env.local
# paste your Anthropic API key (and optionally an Inception API key) into .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

## Models

Two providers ship today, swapped via the top-bar toggle:

| Provider | Pass A (paragraph) | Pass B (document) | Notes |
|---|---|---|---|
| **Claude** (default) | Claude Haiku 4.5 | Claude Sonnet 4.6 | 100% on the eval suite. Authoritative. |
| **Mercury** (diffusion) | Mercury 2 | Mercury 2 | ~4–8× faster end-to-end via OpenAI-compatible endpoint. Tends to under-flag multi-issue paragraphs. |

Selection persists in `localStorage`. Every suggestion card carries a latency badge so the comparison is visible as you write.

To use Mercury, set `INCEPTION_API_KEY` in `.env.local` (get one at <https://platform.inceptionlabs.ai>, 10M free tokens on signup). Override individual models with the env keys in `.env.example`.

### Gotcha: shell env vars shadow `.env.local`

If you've already exported `ANTHROPIC_API_KEY` in your shell (especially as an empty string, e.g. from an old `~/.zshrc` line), Next.js will **not** overwrite it with the value in `.env.local`. Symptom: the route returns `ANTHROPIC_API_KEY is not set` even though `.env.local` looks correct.

```bash
echo "len: ${#ANTHROPIC_API_KEY}"   # 0 = empty-but-exported; that wins
```

Fix: `unset ANTHROPIC_API_KEY` before `npm run dev`, or remove the offending export from your shell rc.

## Adding a new "Winning Writing" lesson

Edit `lib/rules/catalog.ts` — see `lib/rules/README.md`. The editor, prompts, `/rules` viewer, and the eval runner all pick up the new rule.

## Running evals

```bash
npm run eval                        # Anthropic (default)
WW_PROVIDER=inception npm run eval  # Mercury
```

Runs every fixture in `evals/fixtures/ww-before-after.json`. Prints per-rule pass rate and a latency summary (mean / p50 / p95). Use this when you add a rule, change a prompt, or want a head-to-head comparison between providers.

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set `ANTHROPIC_API_KEY` (and `INCEPTION_API_KEY` if you want the Mercury toggle to work) under Project → Settings → Environment Variables.
4. Deploy.

The API routes are server-only — the key never reaches the browser.
