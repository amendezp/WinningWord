# WinningWord

A clean, Typora-style word processor that coaches you in real time on Glenn Kramon's *"Winning Writing"* lessons (Stanford GSB).

- Type prose in a minimalist serif editor.
- WinningWord watches for completed sentences and paragraphs and quietly highlights:
  - **Light red** — prose that violates a rule (wordiness, weak adverbs, useless jargon, etc.).
  - **Mint / sky** — prose that exemplifies the lessons (vivid detail, strong short verbs, punchy brevity).
- The right-hand sidebar explains every flag and offers rewrites you can accept or dismiss.
- A document-level pass runs in the background to check BLUF, audience, redundancy, and the "one-sentence test".

## Local setup

```bash
cp .env.example .env.local
# paste your Anthropic API key into .env.local
npm install
npm run dev
```

Open <http://localhost:3000>.

## Adding a new "Winning Writing" lesson

Edit `lib/rules/catalog.ts` — see `lib/rules/README.md`. The editor, prompts, `/rules` viewer, and the eval runner all pick up the new rule.

## Running evals

```bash
npm run eval
```

Asserts that every fixture in `evals/fixtures/ww-before-after.json` triggers the expected rule. Prints a per-rule pass rate. Use this whenever you add a rule.

## Deploy to Vercel

1. Push to GitHub.
2. Import the repo in Vercel.
3. Set `ANTHROPIC_API_KEY` under Project → Settings → Environment Variables.
4. Deploy.

The API routes are server-only — the key never reaches the browser.
