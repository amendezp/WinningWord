import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { DOCUMENT_SYSTEM_PROMPT, VALID_DOCUMENT_RULE_IDS } from "@/lib/analyze/prompt";
import { documentTool, type DocumentFeedback } from "@/lib/analyze/tools";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-sonnet-4-5";

type RequestBody = { documentBody: string };

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 }
    );
  }
  const body = (await req.json()) as RequestBody;
  if (!body.documentBody || body.documentBody.trim().length < 20) {
    return NextResponse.json({ observations: [] } satisfies DocumentFeedback);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    system: [
      {
        type: "text",
        text: DOCUMENT_SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    tools: [documentTool],
    tool_choice: { type: "tool", name: "report_document_feedback" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Document to analyze:\n\n${body.documentBody}`,
          },
        ],
      },
    ],
  });

  const toolUse = resp.content.find((b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use");
  if (!toolUse) {
    return NextResponse.json({ observations: [] } satisfies DocumentFeedback);
  }
  const raw = toolUse.input as DocumentFeedback;
  const observations = (raw.observations ?? []).filter((o) =>
    VALID_DOCUMENT_RULE_IDS.has(o.ruleId)
  );
  return NextResponse.json({
    observations,
    one_sentence_summary: raw.one_sentence_summary,
  } satisfies DocumentFeedback);
}
