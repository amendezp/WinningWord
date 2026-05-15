/**
 * Eval runner.
 *
 *   npm run eval
 *
 * Calls Anthropic directly (not via the Next.js route — keeps this runnable
 * without a running dev server). Uses the SAME model split as production:
 *   - paragraph fixtures → Haiku 4.5 (matches /api/analyze-paragraph)
 *   - document fixtures  → Sonnet 4.6 (matches /api/analyze-document)
 *
 * Fixture types:
 *   - "paragraph" / "document"  — positive case. The named rule must fire.
 *   - "paragraph_negative"      — text that should produce ZERO flags of the
 *                                 named ruleIds (false-positive guard).
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

type ParagraphNegativeFixture = {
  name: string;
  ruleIds: string[]; // rules that must NOT fire on this text
  scope: "paragraph_negative";
  before: string;
};

type DocumentFixture = {
  name: string;
  ruleIds: string[];
  scope: "document";
  before: string;
};

type Fixture = ParagraphFixture | ParagraphNegativeFixture | DocumentFixture;

const PARAGRAPH_MODEL = process.env.WW_PARAGRAPH_MODEL ?? "claude-haiku-4-5-20251001";
const DOCUMENT_MODEL = process.env.WW_DOCUMENT_MODEL ?? "claude-sonnet-4-6";

async function paragraphAnalysis(
  client: Anthropic,
  text: string
): Promise<ParagraphFeedback> {
  const resp = await client.messages.create({
    model: PARAGRAPH_MODEL,
    max_tokens: 1024,
    system: PARAGRAPH_SYSTEM_PROMPT,
    tools: [paragraphTool],
    tool_choice: { type: "tool", name: "report_paragraph_feedback" },
    messages: [
      { role: "user", content: `Focus paragraph (analyze ONLY this paragraph):\n\n${text}` },
    ],
  });
  const toolUse = resp.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  return (toolUse?.input as ParagraphFeedback) ?? { issues: [], improvements: [], praises: [] };
}

async function runParagraphFixture(
  client: Anthropic,
  f: ParagraphFixture
): Promise<{ pass: boolean; detail: string; raw: ParagraphFeedback }> {
  const raw = await paragraphAnalysis(client, f.before);
  // Check ALL three tiers — a praise fixture's ruleId lives in raw.praises,
  // not in issues/improvements. Earlier versions of this runner only looked
  // at issues+improvements, which silently failed every praise fixture.
  const allFlags = [
    ...(raw.issues ?? []),
    ...(raw.improvements ?? []),
    ...(raw.praises ?? []),
  ];
  const hit = allFlags.find((i) => f.ruleIds.includes(i.ruleId));
  if (!hit) {
    return {
      pass: false,
      detail: `expected one of [${f.ruleIds.join(", ")}], got [${allFlags.map((i) => i.ruleId).join(", ") || "none"}]`,
      raw,
    };
  }
  if (f.expectedAnyOf && f.expectedAnyOf.length) {
    const phraseOk = f.expectedAnyOf.some((p) =>
      allFlags.some((i) => i.phrase.toLowerCase().includes(p.toLowerCase()))
    );
    if (!phraseOk) {
      return {
        pass: false,
        detail: `rule matched but phrase missed: got "${hit.phrase}", expected one of [${f.expectedAnyOf.join(", ")}]`,
        raw,
      };
    }
  }
  return { pass: true, detail: `flagged "${hit.phrase}" as ${hit.ruleId}`, raw };
}

async function runParagraphNegativeFixture(
  client: Anthropic,
  f: ParagraphNegativeFixture
): Promise<{ pass: boolean; detail: string; raw: ParagraphFeedback }> {
  const raw = await paragraphAnalysis(client, f.before);
  const allFlags = [...(raw.issues ?? []), ...(raw.improvements ?? [])];
  const offender = allFlags.find((i) => f.ruleIds.includes(i.ruleId));
  if (offender) {
    return {
      pass: false,
      detail: `false positive: "${offender.phrase}" flagged as ${offender.ruleId} (clean text should produce no such flag)`,
      raw,
    };
  }
  return {
    pass: true,
    detail: `no false positives (total flags returned: ${allFlags.length})`,
    raw,
  };
}

async function runDocumentFixture(
  client: Anthropic,
  f: DocumentFixture
): Promise<{ pass: boolean; detail: string; raw: DocumentFeedback }> {
  const resp = await client.messages.create({
    model: DOCUMENT_MODEL,
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

  console.log(`Running ${fixtures.length} fixtures`);
  console.log(`  paragraph model: ${PARAGRAPH_MODEL}`);
  console.log(`  document model:  ${DOCUMENT_MODEL}\n`);

  const results: Array<{ name: string; pass: boolean; detail: string; ruleIds: string[]; scope: string }> = [];
  for (const f of fixtures) {
    process.stdout.write(`  [${f.scope.padEnd(20)}] ${f.name.padEnd(40)} `);
    try {
      let out: { pass: boolean; detail: string };
      if (f.scope === "paragraph") out = await runParagraphFixture(client, f);
      else if (f.scope === "paragraph_negative") out = await runParagraphNegativeFixture(client, f);
      else out = await runDocumentFixture(client, f);
      const mark = out.pass ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
      console.log(`${mark}  ${out.detail}`);
      results.push({ name: f.name, pass: out.pass, detail: out.detail, ruleIds: f.ruleIds, scope: f.scope });
    } catch (err) {
      console.log(`\x1b[31m✗\x1b[0m  ${(err as Error).message}`);
      results.push({ name: f.name, pass: false, detail: (err as Error).message, ruleIds: f.ruleIds, scope: f.scope });
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
    const color = pct === 100 ? "\x1b[32m" : pct >= 50 ? "\x1b[33m" : "\x1b[31m";
    console.log(`  ${rid.padEnd(22)} ${pass}/${total}  ${color}${pct}%\x1b[0m`);
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
