import Anthropic from "@anthropic-ai/sdk";
import {
  PARAGRAPH_SYSTEM_PROMPT,
  DOCUMENT_SYSTEM_PROMPT,
  VALID_PARAGRAPH_RULE_IDS,
  VALID_DOCUMENT_RULE_IDS,
} from "@/lib/analyze/prompt";
import {
  paragraphTool,
  documentTool,
  type ParagraphFeedback,
  type DocumentFeedback,
} from "@/lib/analyze/tools";
import type { AnalysisProvider, ParagraphResult, DocumentResult } from "./types";

const PARAGRAPH_MODEL =
  process.env.WW_PARAGRAPH_MODEL ?? "claude-haiku-4-5-20251001";
const DOCUMENT_MODEL = process.env.WW_DOCUMENT_MODEL ?? "claude-sonnet-4-6";

function client() {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set on the server.");
  }
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const anthropicProvider: AnalysisProvider = {
  id: "anthropic",
  paragraphModelName: PARAGRAPH_MODEL,
  documentModelName: DOCUMENT_MODEL,

  async analyzeParagraph({ focusParagraph, documentBody }): Promise<ParagraphResult> {
    const a = client();
    const userBlocks: Anthropic.Messages.ContentBlockParam[] = [];
    if (documentBody && documentBody.length > 0) {
      userBlocks.push({
        type: "text",
        text: `Surrounding document (for context only — do NOT flag phrases outside the focus paragraph):\n\n${documentBody}`,
        cache_control: { type: "ephemeral" },
      });
    }
    userBlocks.push({
      type: "text",
      text: `Focus paragraph (analyze ONLY this paragraph):\n\n${focusParagraph}`,
    });

    const started = Date.now();
    const resp = await a.messages.create({
      model: PARAGRAPH_MODEL,
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
    const latencyMs = Date.now() - started;

    const toolUse = resp.content.find(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );
    const raw =
      (toolUse?.input as ParagraphFeedback) ?? {
        issues: [],
        improvements: [],
        praises: [],
      };
    const feedback = filterParagraph(raw, focusParagraph);

    return {
      feedback,
      meta: {
        provider: "anthropic",
        modelName: PARAGRAPH_MODEL,
        latencyMs,
      },
    };
  },

  async analyzeDocument({ documentBody }): Promise<DocumentResult> {
    const a = client();
    const started = Date.now();
    const resp = await a.messages.create({
      model: DOCUMENT_MODEL,
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
            { type: "text", text: `Document to analyze:\n\n${documentBody}` },
          ],
        },
      ],
    });
    const latencyMs = Date.now() - started;

    const toolUse = resp.content.find(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use"
    );
    const raw = (toolUse?.input as DocumentFeedback) ?? { observations: [] };
    const feedback = filterDocument(raw);

    return {
      feedback,
      meta: {
        provider: "anthropic",
        modelName: DOCUMENT_MODEL,
        latencyMs,
      },
    };
  },
};

function filterParagraph(
  raw: ParagraphFeedback,
  paragraphText: string
): ParagraphFeedback {
  const inText = (phrase: string) => paragraphText.includes(phrase);
  const validRule = (id: string) => VALID_PARAGRAPH_RULE_IDS.has(id);
  return {
    issues: (raw.issues ?? []).filter((i) => validRule(i.ruleId) && inText(i.phrase)),
    improvements: (raw.improvements ?? []).filter(
      (i) => validRule(i.ruleId) && inText(i.phrase)
    ),
    praises: (raw.praises ?? []).filter((p) => validRule(p.ruleId) && inText(p.phrase)),
  };
}

function filterDocument(raw: DocumentFeedback): DocumentFeedback {
  return {
    observations: (raw.observations ?? []).filter((o) =>
      VALID_DOCUMENT_RULE_IDS.has(o.ruleId)
    ),
    one_sentence_summary: raw.one_sentence_summary,
  };
}
