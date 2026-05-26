/**
 * Eval runner.
 *
 *   npm run eval
 *
 * Routes through the same provider abstraction the API uses, so we test
 * what production actually runs.
 *
 * Fixture types:
 *   - "paragraph" / "document"  — positive case. The named rule must fire.
 *   - "paragraph_negative"      — text that should produce ZERO flags of the
 *                                 named ruleIds (false-positive guard).
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { getProvider } from "../lib/analyze/providers";
import type { ParagraphFeedback, DocumentFeedback } from "../lib/analyze/tools";

type ParagraphFixture = {
  name: string;
  ruleIds: string[];
  scope: "paragraph";
  before: string;
  expectedAnyOf?: string[];
};

type ParagraphNegativeFixture = {
  name: string;
  ruleIds: string[];
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

async function runParagraphFixture(
  f: ParagraphFixture
): Promise<{ pass: boolean; detail: string; latencyMs: number; raw: ParagraphFeedback }> {
  const provider = getProvider();
  const { feedback: raw, meta } = await provider.analyzeParagraph({
    focusParagraph: f.before,
  });
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
      latencyMs: meta.latencyMs,
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
        latencyMs: meta.latencyMs,
        raw,
      };
    }
  }
  return {
    pass: true,
    detail: `flagged "${hit.phrase}" as ${hit.ruleId}`,
    latencyMs: meta.latencyMs,
    raw,
  };
}

async function runParagraphNegativeFixture(
  f: ParagraphNegativeFixture
): Promise<{ pass: boolean; detail: string; latencyMs: number; raw: ParagraphFeedback }> {
  const provider = getProvider();
  const { feedback: raw, meta } = await provider.analyzeParagraph({
    focusParagraph: f.before,
  });
  const allFlags = [...(raw.issues ?? []), ...(raw.improvements ?? [])];
  const offender = allFlags.find((i) => f.ruleIds.includes(i.ruleId));
  if (offender) {
    return {
      pass: false,
      detail: `false positive: "${offender.phrase}" flagged as ${offender.ruleId} (clean text should produce no such flag)`,
      latencyMs: meta.latencyMs,
      raw,
    };
  }
  return {
    pass: true,
    detail: `no false positives (total flags returned: ${allFlags.length})`,
    latencyMs: meta.latencyMs,
    raw,
  };
}

async function runDocumentFixture(
  f: DocumentFixture
): Promise<{ pass: boolean; detail: string; latencyMs: number; raw: DocumentFeedback }> {
  const provider = getProvider();
  const { feedback: raw, meta } = await provider.analyzeDocument({
    documentBody: f.before,
  });
  const hit = raw.observations.find((o) => f.ruleIds.includes(o.ruleId));
  if (!hit) {
    return {
      pass: false,
      detail: `expected one of [${f.ruleIds.join(", ")}], got [${raw.observations.map((o) => o.ruleId).join(", ") || "none"}]`,
      latencyMs: meta.latencyMs,
      raw,
    };
  }
  return {
    pass: true,
    detail: `observed ${hit.ruleId} (${hit.severity}): ${hit.rationale}`,
    latencyMs: meta.latencyMs,
    raw,
  };
}

async function main() {
  const provider = getProvider();

  const fixtures: Fixture[] = JSON.parse(
    readFileSync(path.join(__dirname, "fixtures/ww-before-after.json"), "utf-8")
  );

  console.log(`Running ${fixtures.length} fixtures via ${provider.id}`);
  console.log(`  paragraph model: ${provider.paragraphModelName}`);
  console.log(`  document model:  ${provider.documentModelName}\n`);

  const results: Array<{
    name: string;
    pass: boolean;
    detail: string;
    latencyMs: number;
    ruleIds: string[];
    scope: string;
  }> = [];

  for (const f of fixtures) {
    process.stdout.write(`  [${f.scope.padEnd(20)}] ${f.name.padEnd(40)} `);
    try {
      let out: { pass: boolean; detail: string; latencyMs: number };
      if (f.scope === "paragraph") out = await runParagraphFixture(f);
      else if (f.scope === "paragraph_negative") out = await runParagraphNegativeFixture(f);
      else out = await runDocumentFixture(f);
      const mark = out.pass ? "\x1b[32m✓\x1b[0m" : "\x1b[31m✗\x1b[0m";
      console.log(`${mark}  ${String(out.latencyMs).padStart(5)}ms  ${out.detail}`);
      results.push({
        name: f.name,
        pass: out.pass,
        detail: out.detail,
        latencyMs: out.latencyMs,
        ruleIds: f.ruleIds,
        scope: f.scope,
      });
    } catch (err) {
      console.log(`\x1b[31m✗\x1b[0m  ${(err as Error).message}`);
      results.push({
        name: f.name,
        pass: false,
        detail: (err as Error).message,
        latencyMs: 0,
        ruleIds: f.ruleIds,
        scope: f.scope,
      });
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

  // Latency summary.
  const paragraphLats = results
    .filter((r) => (r.scope === "paragraph" || r.scope === "paragraph_negative") && r.latencyMs > 0)
    .map((r) => r.latencyMs);
  const docLats = results.filter((r) => r.scope === "document" && r.latencyMs > 0).map((r) => r.latencyMs);

  const stats = (arr: number[]) => {
    if (arr.length === 0) return null;
    const sorted = [...arr].sort((a, b) => a - b);
    const mean = Math.round(arr.reduce((s, x) => s + x, 0) / arr.length);
    const p50 = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))];
    return { mean, p50, p95, n: arr.length };
  };

  console.log("\nLatency (ms):");
  const pStats = stats(paragraphLats);
  const dStats = stats(docLats);
  if (pStats) console.log(`  paragraph  n=${pStats.n}  mean=${pStats.mean}  p50=${pStats.p50}  p95=${pStats.p95}`);
  if (dStats) console.log(`  document   n=${dStats.n}  mean=${dStats.mean}  p50=${dStats.p50}  p95=${dStats.p95}`);

  const passed = results.filter((r) => r.pass).length;
  const total = results.length;
  console.log(`\nOverall: ${passed}/${total} (${Math.round((passed / total) * 100)}%)`);
  process.exit(passed === total ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
