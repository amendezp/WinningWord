/**
 * Eval runner.
 *
 *   ANTHROPIC_API_KEY=... npm run eval
 *
 * Calls Anthropic directly (not via the Next.js route — keeps this runnable
 * without a running dev server). Asserts that each fixture's Before text
 * triggers at least one flag with a `ruleId` in the fixture's `ruleIds` set.
 *
 * For paragraph-scope fixtures, also asserts the flagged phrase appears in
 * `expectedAnyOf` when provided.
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";

import { paragraphTool, documentTool, type ParagraphFeedback, type DocumentFeedback } from "../lib/analyze/tools";
import { PARAGRAPH_SYSTEM_PROMPT, DOCUMENT_SYSTEM_PROMPT } from "../lib/analyze/prompt";

type ParagraphFixture = {
  name: string;
  ruleIds: string[];
  scope: "paragraph";
  before: string;
  expectedAnyOf?: string[];
};

type DocumentFixture = {
  name: string;
  ruleIds: string[];
  scope: "document";
  before: string;
};

type Fixture = ParagraphFixture | DocumentFixture;

const MODEL = process.env.WW_EVAL_MODEL ?? "claude-sonnet-4-5";

async function runParagraphFixture(
  client: Anthropic,
  f: ParagraphFixture
): Promise<{ pass: boolean; detail: string; raw: ParagraphFeedback }> {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: PARAGRAPH_SYSTEM_PROMPT,
    tools: [paragraphTool],
    tool_choice: { type: "tool", name: "report_paragraph_feedback" },
    messages: [
      { role: "user", content: `Focus paragraph (analyze ONLY this paragraph):\n\n${f.before}` },
    ],
  });
  const toolUse = resp.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  const raw = (toolUse?.input as ParagraphFeedback) ?? { issues: [], praises: [] };

  const hitRule = raw.issues.find((i) => f.ruleIds.includes(i.ruleId));
  if (!hitRule) {
    return {
      pass: false,
      detail: `expected one of [${f.ruleIds.join(", ")}], got [${raw.issues.map((i) => i.ruleId).join(", ") || "none"}]`,
      raw,
    };
  }
  if (f.expectedAnyOf && f.expectedAnyOf.length) {
    const phraseOk = f.expectedAnyOf.some((p) =>
      raw.issues.some((i) => i.phrase.toLowerCase().includes(p.toLowerCase()))
    );
    if (!phraseOk) {
      return {
        pass: false,
        detail: `rule matched but phrase missed: got "${hitRule.phrase}", expected one of [${f.expectedAnyOf.join(", ")}]`,
        raw,
      };
    }
  }
  return { pass: true, detail: `flagged "${hitRule.phrase}" as ${hitRule.ruleId}`, raw };
}

async function runDocumentFixture(
  client: Anthropic,
  f: DocumentFixture
): Promise<{ pass: boolean; detail: string; raw: DocumentFeedback }> {
  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: DOCUMENT_SYSTEM_PROMPT,
    tools: [documentTool],
    tool_choice: { type: "tool", name: "report_document_feedback" },
    messages: [{ role: "user", content: `Document to analyze:\n\n${f.before}` }],
  });
  const toolUse = resp.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  const raw = (toolUse?.input as DocumentFeedback) ?? { observations: [] };
  const hit = raw.observations.find((o) => f.ruleIds.includes(o.ruleId));
  if (!hit) {
    return {
      pass: false,
      detail: `expected one of [${f.ruleIds.join(", ")}], got [${raw.observations.map((o) => o.ruleId).join(", ") || "none"}]`,
      raw,
    };
  }
  return { pass: true, detail: `observed ${hit.ruleId} (${hit.severity}): ${hit.rationale}`, raw };
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set. Add it to .env.local or export it.");
    process.exit(1);
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const fixtures: Fixture[] = JSON.parse(
    readFileSync(path.join(__dirname, "fixtures/ww-before-after.json"), "utf-8")
  );

  console.log(`Running ${fixtures.length} fixtures against ${MODEL}\n`);

  const results: Array<{ name: string; pass: boolean; detail: string; ruleIds: string[] }> = [];
  for (const f of fixtures) {
    process.stdout.write(`  ${f.name.padEnd(40)} `);
    try {
      const out =
        f.scope === "paragraph"
          ? await runParagraphFixture(client, f)
          : await runDocumentFixture(client, f);
      const mark = out.pass ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
      console.log(`${mark}  ${out.detail}`);
      results.push({ name: f.name, pass: out.pass, detail: out.detail, ruleIds: f.ruleIds });
    } catch (err) {
      console.log(`\x1b[31m✗\x1b[0m  ${(err as Error).message}`);
      results.push({ name: f.name, pass: false, detail: (err as Error).message, ruleIds: f.ruleIds });
    }
  }

  // Per-rule pass-rate summary.
  console.log("\nPer-rule pass rate:");
  const byRule = new Map<string, { pass: number; total: number }>();
  for (const r of results) {
    for (const rid of r.ruleIds) {
      const cur = byRule.get(rid) ?? { pass: 0, total: 0 };
      cur.total += 1;
      if (r.pass) cur.pass += 1;
      byRule.set(rid, cur);
    }
  }
  for (const [rid, { pass, total }] of [...byRule.entries()].sort()) {
    const pct = Math.round((pass / total) * 100);
    console.log(`  ${rid.padEnd(22)} ${pass}/${total}  ${pct}%`);
  }

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\nOverall: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
