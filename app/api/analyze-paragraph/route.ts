import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { PARAGRAPH_SYSTEM_PROMPT, VALID_PARAGRAPH_RULE_IDS } from "@/lib/analyze/prompt";
import { paragraphTool, type ParagraphFeedback } from "@/lib/analyze/tools";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-5";

type RequestBody = {
  focusParagraph: string;
  documentBody?: string;
};

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 }
    );
  }
  const body = (await req.json()) as RequestBody;
  if (!body.focusParagraph || body.focusParagraph.trim().length < 4) {
    return NextResponse.json({ issues: [], praises: [] } satisfies ParagraphFeedback);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userBlocks: Anthropic.Messages.ContentBlockParam[] = [];

  if (body.documentBody && body.documentBody.length > 0) {
    userBlocks.push({
      type: "text",
      text: `Surrounding document (for context only — do NOT flag phrases outside the focus paragraph):\n\n${body.documentBody}`,
      cache_control: { type: "ephemeral" },
    });
  }
  userBlocks.push({
    type: "text",
    text: `Focus paragraph (analyze ONLY this paragraph):\n\n${body.focusParagraph}`,
  });

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: PARAGRAPH_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [paragraphTool],
    tool_choice: { type: "tool", name: "report_paragraph_feedback" },
    messages: [{ role: "user", content: userBlocks }],
  });

  const toolUse = resp.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) {
    return NextResponse.json({ issues: [], praises: [] } satisfies ParagraphFeedback);
  }
  const raw = toolUse.input as ParagraphFeedback;

  // Defensive filtering: drop anything that doesn't appear in the paragraph
  // (the model occasionally paraphrases) or cites an unknown ruleId.
  const issues = (raw.issues ?? []).filter(
    (i) =>
      VALID_PARAGRAPH_RULE_IDS.has(i.ruleId) &&
      body.focusParagraph.includes(i.phrase)
  );
  const praises = (raw.praises ?? []).filter(
    (p) =>
      VALID_PARAGRAPH_RULE_IDS.has(p.ruleId) &&
      body.focusParagraph.includes(p.phrase)
  );

  return NextResponse.json({ issues, praises } satisfies ParagraphFeedback);
}
